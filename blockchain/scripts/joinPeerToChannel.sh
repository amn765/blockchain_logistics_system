#!/bin/bash

# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# Script to join a peer to an existing channel

. scripts/envVar.sh
. scripts/utils.sh

# Get the current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ ! -d "$DIR" ]; then
  DIR="$PWD"
fi
ROOTDIR="$(dirname "$DIR")"

ORG_NAME=${1:-""}
PEER_NUM=${2:-"0"}
CHANNEL_NAME=${3:-"supplychainchannel"}

if [ -z "$ORG_NAME" ]; then
    printError "Organization name is required"
    echo "Usage: $0 <org_name> [peer_num] [channel_name]"
    echo "Example: $0 Distributor 0 supplychainchannel"
    exit 1
fi

ORG_LOWER=$(echo $ORG_NAME | tr '[:upper:]' '[:lower:]')
ORG_DOMAIN="${ORG_LOWER}.supplychain.com"
PEER_NAME="peer${PEER_NUM}.${ORG_DOMAIN}"

printInfo "Joining peer ${PEER_NAME} to channel ${CHANNEL_NAME}..."

# Set environment variables for peer
setGlobalsForPeer() {
    ORG=$1
    PEER_N=$2
    
    if [ "$ORG" == "Manufacturer" ]; then
        export CORE_PEER_LOCALMSPID=${MANUFACTURER_MSP}
        PEER_PORT=$((7051 + PEER_N * 2))
        export CORE_PEER_ADDRESS=peer${PEER_N}.${MANUFACTURER_DOMAIN}:${PEER_PORT}
        export CORE_PEER_TLS_ROOTCERT_FILE=${ROOTDIR}/organizations/peerOrganizations/${MANUFACTURER_DOMAIN}/peers/peer${PEER_N}.${MANUFACTURER_DOMAIN}/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=${ROOTDIR}/organizations/peerOrganizations/${MANUFACTURER_DOMAIN}/users/Admin@${MANUFACTURER_DOMAIN}/msp
    elif [ "$ORG" == "Logistics" ]; then
        export CORE_PEER_LOCALMSPID=${LOGISTICS_MSP}
        PEER_PORT=$((9051 + PEER_N * 2))
        export CORE_PEER_ADDRESS=peer${PEER_N}.${LOGISTICS_DOMAIN}:${PEER_PORT}
        export CORE_PEER_TLS_ROOTCERT_FILE=${ROOTDIR}/organizations/peerOrganizations/${LOGISTICS_DOMAIN}/peers/peer${PEER_N}.${LOGISTICS_DOMAIN}/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=${ROOTDIR}/organizations/peerOrganizations/${LOGISTICS_DOMAIN}/users/Admin@${LOGISTICS_DOMAIN}/msp
    elif [ "$ORG" == "Retailer" ]; then
        export CORE_PEER_LOCALMSPID=${RETAILER_MSP}
        PEER_PORT=$((11051 + PEER_N * 2))
        export CORE_PEER_ADDRESS=peer${PEER_N}.${RETAILER_DOMAIN}:${PEER_PORT}
        export CORE_PEER_TLS_ROOTCERT_FILE=${ROOTDIR}/organizations/peerOrganizations/${RETAILER_DOMAIN}/peers/peer${PEER_N}.${RETAILER_DOMAIN}/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=${ROOTDIR}/organizations/peerOrganizations/${RETAILER_DOMAIN}/users/Admin@${RETAILER_DOMAIN}/msp
    else
        # Generic organization
        export CORE_PEER_LOCALMSPID="${ORG}MSP"
        PEER_PORT=$((12051 + PEER_N * 2))
        export CORE_PEER_ADDRESS=peer${PEER_N}.${ORG_DOMAIN}:${PEER_PORT}
        export CORE_PEER_TLS_ROOTCERT_FILE=${ROOTDIR}/organizations/peerOrganizations/${ORG_DOMAIN}/peers/peer${PEER_N}.${ORG_DOMAIN}/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=${ROOTDIR}/organizations/peerOrganizations/${ORG_DOMAIN}/users/Admin@${ORG_DOMAIN}/msp
    fi
    
    export CORE_PEER_TLS_ENABLED=true
    export ORDERER_CA=${ROOTDIR}/organizations/ordererOrganizations/${ORDERER_DOMAIN}/orderers/orderer.${ORDERER_DOMAIN}/msp/tlscacerts/tlsca.${ORDERER_DOMAIN}-cert.pem
}

# Check if channel block exists
CHANNEL_BLOCK="${ROOTDIR}/channel-artifacts/${CHANNEL_NAME}.block"
if [ ! -f "$CHANNEL_BLOCK" ]; then
    printError "Channel block not found: ${CHANNEL_BLOCK}"
    printInfo "Please create the channel first or provide the channel block"
    exit 1
fi

# Join peer to channel
setGlobalsForPeer $ORG_NAME $PEER_NUM

printInfo "Joining peer to channel..."
docker exec ${PEER_NAME} peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/${CHANNEL_NAME}.block

# Alternative: using peer CLI from host
# peer channel join -b ${CHANNEL_BLOCK}

if [ $? -eq 0 ]; then
    printSuccess "Peer ${PEER_NAME} successfully joined channel ${CHANNEL_NAME}"
else
    printError "Failed to join peer to channel"
    exit 1
fi

