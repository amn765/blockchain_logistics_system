#!/bin/bash

# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# Script to create and join channel

# Get the current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ ! -d "$DIR" ]; then
  DIR="$PWD"
fi
ROOTDIR="$(dirname "$DIR")"

. scripts/envVar.sh
. scripts/utils.sh

CHANNEL_NAME=$1
DELAY=${2:-3}
MAX_RETRY=${3:-5}
VERBOSE=${4:-false}

: ${CHANNEL_NAME:="supplychainchannel"}
: ${DELAY:="3"}
: ${MAX_RETRY:="5"}
: ${VERBOSE:="false"}

if [ -z "$CHANNEL_NAME" ]; then
    printError "Channel name not provided"
    exit 1
fi

printInfo "Creating channel ${CHANNEL_NAME}..."

# Create channel
createChannel() {
    setGlobalsForOrderer
    
    printInfo "Creating channel ${CHANNEL_NAME}..."
    
    peer channel create -o ${ORDERER_ADDRESS} -c ${CHANNEL_NAME} --file ${ROOTDIR}/channel-artifacts/${CHANNEL_NAME}.tx --outputBlock ${ROOTDIR}/channel-artifacts/${CHANNEL_NAME}.block --tls --cafile ${ROOTDIR}/organizations/ordererOrganizations/${ORDERER_DOMAIN}/orderers/orderer.${ORDERER_DOMAIN}/msp/tlscacerts/tlsca.${ORDERER_DOMAIN}-cert.pem
    
    if [ $? -ne 0 ]; then
        printError "Failed to create channel"
        exit 1
    fi
    
    printSuccess "Channel ${CHANNEL_NAME} created successfully"
}

# Join channel for a peer
joinChannel() {
    ORG=$1
    setGlobalsForPeer $ORG
    
    printInfo "Joining ${ORG} to channel ${CHANNEL_NAME}..."
    
    peer channel join -b ${ROOTDIR}/channel-artifacts/${CHANNEL_NAME}.block
    
    if [ $? -ne 0 ]; then
        printError "Failed to join ${ORG} to channel"
        exit 1
    fi
    
    printSuccess "${ORG} joined channel successfully"
}

# Update anchor peers
updateAnchorPeers() {
    ORG=$1
    setGlobalsForPeer $ORG
    
    printInfo "Updating anchor peers for ${ORG}..."
    
    peer channel update -o ${ORDERER_ADDRESS} -c ${CHANNEL_NAME} -f ${ROOTDIR}/channel-artifacts/${ORG}Anchors.tx --tls --cafile ${ROOTDIR}/organizations/ordererOrganizations/${ORDERER_DOMAIN}/orderers/orderer.${ORDERER_DOMAIN}/msp/tlscacerts/tlsca.${ORDERER_DOMAIN}-cert.pem
    
    if [ $? -ne 0 ]; then
        printError "Failed to update anchor peers for ${ORG}"
        exit 1
    fi
    
    printSuccess "Anchor peers updated for ${ORG}"
}

# Set environment variables for orderer
setGlobalsForOrderer() {
    export CORE_PEER_LOCALMSPID=${ORDERER_MSP}
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_TLS_ROOTCERT_FILE=${ROOTDIR}/organizations/ordererOrganizations/${ORDERER_DOMAIN}/orderers/orderer.${ORDERER_DOMAIN}/msp/tlscacerts/tlsca.${ORDERER_DOMAIN}-cert.pem
    export CORE_PEER_MSPCONFIGPATH=${ROOTDIR}/organizations/ordererOrganizations/${ORDERER_DOMAIN}/users/Admin@${ORDERER_DOMAIN}/msp
}

# Set environment variables for peer organization
setGlobalsForPeer() {
    ORG=$1
    if [ "$ORG" == "Manufacturer" ]; then
        export CORE_PEER_LOCALMSPID=${MANUFACTURER_MSP}
        export CORE_PEER_ADDRESS=${PEER0_MANUFACTURER}
        export CORE_PEER_TLS_ROOTCERT_FILE=${ROOTDIR}/organizations/peerOrganizations/${MANUFACTURER_DOMAIN}/peers/peer0.${MANUFACTURER_DOMAIN}/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=${ROOTDIR}/organizations/peerOrganizations/${MANUFACTURER_DOMAIN}/users/Admin@${MANUFACTURER_DOMAIN}/msp
    elif [ "$ORG" == "Logistics" ]; then
        export CORE_PEER_LOCALMSPID=${LOGISTICS_MSP}
        export CORE_PEER_ADDRESS=${PEER0_LOGISTICS}
        export CORE_PEER_TLS_ROOTCERT_FILE=${ROOTDIR}/organizations/peerOrganizations/${LOGISTICS_DOMAIN}/peers/peer0.${LOGISTICS_DOMAIN}/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=${ROOTDIR}/organizations/peerOrganizations/${LOGISTICS_DOMAIN}/users/Admin@${LOGISTICS_DOMAIN}/msp
    elif [ "$ORG" == "Retailer" ]; then
        export CORE_PEER_LOCALMSPID=${RETAILER_MSP}
        export CORE_PEER_ADDRESS=${PEER0_RETAILER}
        export CORE_PEER_TLS_ROOTCERT_FILE=${ROOTDIR}/organizations/peerOrganizations/${RETAILER_DOMAIN}/peers/peer0.${RETAILER_DOMAIN}/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=${ROOTDIR}/organizations/peerOrganizations/${RETAILER_DOMAIN}/users/Admin@${RETAILER_DOMAIN}/msp
    else
        printError "Unknown organization: $ORG"
        exit 1
    fi
    
    export CORE_PEER_TLS_ENABLED=true
    export ORDERER_CA=${ROOTDIR}/organizations/ordererOrganizations/${ORDERER_DOMAIN}/orderers/orderer.${ORDERER_DOMAIN}/msp/tlscacerts/tlsca.${ORDERER_DOMAIN}-cert.pem
}

# Main execution
createChannel

# Join all peers to channel
joinChannel Manufacturer
joinChannel Logistics
joinChannel Retailer

# Update anchor peers
updateAnchorPeers Manufacturer
updateAnchorPeers Logistics
updateAnchorPeers Retailer

printSuccess "Channel ${CHANNEL_NAME} created and all peers joined successfully"

