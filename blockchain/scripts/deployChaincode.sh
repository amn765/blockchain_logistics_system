#!/bin/bash

# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# Script to deploy chaincode

# Get the current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ ! -d "$DIR" ]; then
  DIR="$PWD"
fi
ROOTDIR="$(dirname "$DIR")"

. scripts/envVar.sh
. scripts/utils.sh

CC_NAME=${1:-supplychain}
CC_SRC_PATH=${2:-../contracts}
CC_SRC_LANGUAGE=${3:-go}
CC_VERSION=${4:-1.0}
CC_SEQUENCE=${5:-1}
CC_INIT_FCN=${6:-InitLedger}
CC_END_POLICY=${7:-NA}
CC_COLL_CONFIG=${8:-NA}
CHANNEL_NAME=${9:-supplychainchannel}

DELAY=3
MAX_RETRY=5
VERBOSE=false

printInfo "Deploying chaincode ${CC_NAME} version ${CC_VERSION}..."

# Package chaincode
packageChaincode() {
    ORG=$1
    setGlobalsForPeer $ORG
    
    printInfo "Packaging chaincode for ${ORG}..."
    
    peer lifecycle chaincode package ${CC_NAME}.tar.gz --path ${CC_SRC_PATH} --lang ${CC_SRC_LANGUAGE} --label ${CC_NAME}_${CC_VERSION}
    
    if [ $? -ne 0 ]; then
        printError "Failed to package chaincode"
        exit 1
    fi
    
    printSuccess "Chaincode packaged successfully"
}

# Install chaincode
installChaincode() {
    ORG=$1
    setGlobalsForPeer $ORG
    
    printInfo "Installing chaincode on ${ORG}..."
    
    peer lifecycle chaincode install ${CC_NAME}.tar.gz
    
    if [ $? -ne 0 ]; then
        printError "Failed to install chaincode on ${ORG}"
        exit 1
    fi
    
    printSuccess "Chaincode installed on ${ORG}"
}

# Query installed chaincode
queryInstalled() {
    ORG=$1
    setGlobalsForPeer $ORG
    
    printInfo "Querying installed chaincode on ${ORG}..."
    
    peer lifecycle chaincode queryinstalled --output json
    
    if [ $? -ne 0 ]; then
        printError "Failed to query installed chaincode"
        exit 1
    fi
}

# Approve chaincode definition
approveChaincodeDefinition() {
    ORG=$1
    setGlobalsForPeer $ORG
    
    printInfo "Approving chaincode definition for ${ORG}..."
    
    peer lifecycle chaincode approveformyorg -o ${ORDERER_ADDRESS} --channelID ${CHANNEL_NAME} --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE} --tls --cafile ${ORDERER_CA}
    
    if [ $? -ne 0 ]; then
        printError "Failed to approve chaincode definition for ${ORG}"
        exit 1
    fi
    
    printSuccess "Chaincode definition approved for ${ORG}"
}

# Check commit readiness
checkCommitReadiness() {
    printInfo "Checking commit readiness..."
    
    peer lifecycle chaincode checkcommitreadiness --channelID ${CHANNEL_NAME} --name ${CC_NAME} --version ${CC_VERSION} --sequence ${CC_SEQUENCE} --output json --tls --cafile ${ORDERER_CA}
}

# Commit chaincode definition
commitChaincodeDefinition() {
    printInfo "Committing chaincode definition..."
    
    peer lifecycle chaincode commit -o ${ORDERER_ADDRESS} --channelID ${CHANNEL_NAME} --name ${CC_NAME} --version ${CC_VERSION} --sequence ${CC_SEQUENCE} --tls --cafile ${ORDERER_CA} --peerAddresses ${PEER0_MANUFACTURER} --tlsRootCertFiles ${ROOTDIR}/organizations/peerOrganizations/${MANUFACTURER_DOMAIN}/peers/peer0.${MANUFACTURER_DOMAIN}/tls/ca.crt --peerAddresses ${PEER0_LOGISTICS} --tlsRootCertFiles ${ROOTDIR}/organizations/peerOrganizations/${LOGISTICS_DOMAIN}/peers/peer0.${LOGISTICS_DOMAIN}/tls/ca.crt --peerAddresses ${PEER0_RETAILER} --tlsRootCertFiles ${ROOTDIR}/organizations/peerOrganizations/${RETAILER_DOMAIN}/peers/peer0.${RETAILER_DOMAIN}/tls/ca.crt
    
    if [ $? -ne 0 ]; then
        printError "Failed to commit chaincode definition"
        exit 1
    fi
    
    printSuccess "Chaincode definition committed"
}

# Query committed chaincode
queryCommitted() {
    ORG=$1
    setGlobalsForPeer $ORG
    
    printInfo "Querying committed chaincode on ${ORG}..."
    
    peer lifecycle chaincode querycommitted --channelID ${CHANNEL_NAME} --name ${CC_NAME}
    
    if [ $? -ne 0 ]; then
        printError "Failed to query committed chaincode"
        exit 1
    fi
}

# Initialize chaincode
initChaincode() {
    ORG=$1
    setGlobalsForPeer $ORG
    
    printInfo "Initializing chaincode on ${ORG}..."
    
    if [ "$CC_INIT_FCN" = "NA" ]; then
        printInfo "Chaincode initialization function not specified, skipping..."
        return
    fi
    
    peer chaincode invoke -o ${ORDERER_ADDRESS} --tls --cafile ${ORDERER_CA} -C ${CHANNEL_NAME} -n ${CC_NAME} --peerAddresses ${CORE_PEER_ADDRESS} --tlsRootCertFiles ${CORE_PEER_TLS_ROOTCERT_FILE} --isInit -c '{"function":"'${CC_INIT_FCN}'","Args":[]}'
    
    if [ $? -ne 0 ]; then
        printError "Failed to initialize chaincode"
        exit 1
    fi
    
    printSuccess "Chaincode initialized"
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
printInfo "Starting chaincode deployment process..."

# Package chaincode
packageChaincode Manufacturer

# Install on all peers
installChaincode Manufacturer
installChaincode Logistics
installChaincode Retailer

# Query installed to get package ID
printInfo "Querying installed chaincode to get package ID..."
setGlobalsForPeer Manufacturer
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled --output json | jq -r '.installed_chaincodes[0].package_id')
if [ -z "$PACKAGE_ID" ] || [ "$PACKAGE_ID" == "null" ]; then
    printError "Failed to get package ID"
    exit 1
fi
printInfo "Package ID: ${PACKAGE_ID}"

# Approve for all organizations
approveChaincodeDefinition Manufacturer
approveChaincodeDefinition Logistics
approveChaincodeDefinition Retailer

# Check commit readiness
checkCommitReadiness

# Commit chaincode definition
commitChaincodeDefinition

# Query committed
queryCommitted Manufacturer

# Initialize chaincode
initChaincode Manufacturer

printSuccess "Chaincode ${CC_NAME} deployed successfully!"

