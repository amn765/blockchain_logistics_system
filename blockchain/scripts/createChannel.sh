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

# Orderer container name
ORDERER_CONTAINER="orderer.${ORDERER_DOMAIN}"

# Check if orderer container is running
checkOrderer() {
    printInfo "Checking if orderer is running..."
    
    # Check if container exists (running or stopped)
    if ! docker ps -a --format '{{.Names}}' | grep -q "^${ORDERER_CONTAINER}$"; then
        printError "Orderer container ${ORDERER_CONTAINER} does not exist"
        printError "Please start the network first: ./scripts/network.sh up"
        exit 1
    fi
    
    # Check if container is actually running
    if ! docker ps --format '{{.Names}}' | grep -q "^${ORDERER_CONTAINER}$"; then
        printError "Orderer container ${ORDERER_CONTAINER} exists but is not running"
        printError "Container status:"
        docker ps -a --filter "name=${ORDERER_CONTAINER}" --format "table {{.Names}}\t{{.Status}}"
        printError ""
        printError "Please check orderer logs: docker logs ${ORDERER_CONTAINER}"
        printError "Or restart the network: ./scripts/network.sh down && ./scripts/network.sh up"
        exit 1
    fi
    
    printSuccess "Orderer container is running"
    
    # Wait for orderer to be ready
    printInfo "Waiting for orderer to be ready..."
    local retry=0
    local max_retry=10
    
    while [ $retry -lt $max_retry ]; do
        if docker exec ${ORDERER_CONTAINER} test -f /var/hyperledger/orderer/orderer.genesis.block 2>/dev/null; then
            printSuccess "Orderer is ready"
            return 0
        fi
        retry=$((retry + 1))
        printInfo "Waiting for orderer... ($retry/$max_retry)"
        sleep 2
    done
    
    printWarning "Orderer may not be fully ready, but proceeding..."
}

# Create channel
createChannel() {
    # Check orderer first
    checkOrderer

    # Use Manufacturer org admin to create channel (not orderer admin)
    # Channel creation requires a peer organization admin signature
    setGlobalsForPeer "Manufacturer"

    # Check if channel already exists by trying to fetch channel info
    printInfo "Checking if channel ${CHANNEL_NAME} already exists..."
    if peer channel getinfo -c ${CHANNEL_NAME} >/dev/null 2>&1; then
        printInfo "Channel ${CHANNEL_NAME} already exists, skipping creation"
        return 0
    fi
    
    # IMPORTANT: Save peer's TLS root cert BEFORE we override it for orderer connection
    # CORE_PEER_TLS_ROOTCERT_FILE is used for peer-to-peer connections, but --cafile should override for orderer
    # However, some Fabric versions may still check CORE_PEER_TLS_ROOTCERT_FILE, so we save and restore it
    SAVED_PEER_TLS_ROOTCERT=${CORE_PEER_TLS_ROOTCERT_FILE}
    
    printInfo "Creating channel ${CHANNEL_NAME}..."
    
    # Use localhost for orderer address (certificate includes localhost)
    ORDERER_HOST_LOCAL="localhost:${ORDERER_PORT}"
    printInfo "Using orderer address: ${ORDERER_HOST_LOCAL}"
    
    # Use orderer's TLS CA certificate to verify orderer's certificate
    # IMPORTANT: Must use tls/ca.crt (signed by fabric-tlsca-server), not msp/tlscacerts
    TLS_CA_FILE="${ROOTDIR}/organizations/ordererOrganizations/${ORDERER_DOMAIN}/orderers/orderer.${ORDERER_DOMAIN}/tls/ca.crt"
    
    if [ ! -f "${TLS_CA_FILE}" ]; then
        printError "Orderer TLS CA certificate not found at ${TLS_CA_FILE}"
        printError "This certificate is required to verify orderer's TLS certificate"
        exit 1
    fi
    
    # Verify the certificate can validate orderer's server certificate
    if ! openssl verify -CAfile "${TLS_CA_FILE}" "${ROOTDIR}/organizations/ordererOrganizations/${ORDERER_DOMAIN}/orderers/orderer.${ORDERER_DOMAIN}/tls/server.crt" >/dev/null 2>&1; then
        printWarning "TLS CA certificate may not match orderer's server certificate"
    fi
    
    printInfo "Using orderer TLS CA: ${TLS_CA_FILE}"
    
    # Set ORDERER_CA for use in peer commands
    export ORDERER_CA=${TLS_CA_FILE}
    
    # Retry logic for channel creation
    local retry=0
    local max_retry=3
    
    while [ $retry -lt $max_retry ]; do
        printInfo "Attempting to create channel (attempt $((retry + 1))/$max_retry)..."
        
        # Use localhost for orderer address
        # TLS certificate now includes localhost in SAN, so TLS should work
        ORDERER_HOST_LOCAL="localhost:${ORDERER_PORT}"
        
        # Remove existing block file if any
        rm -f ${ROOTDIR}/channel-artifacts/${CHANNEL_NAME}.block
        
        # Create channel with TLS (certificate includes localhost)
        # Use orderer's TLS CA to verify orderer's certificate
        # Note: --cafile must point to orderer's TLS CA, not peer's TLS CA
        # Temporarily override CORE_PEER_TLS_ROOTCERT_FILE for orderer connection
        export CORE_PEER_TLS_ROOTCERT_FILE=${ORDERER_CA}
        
        peer channel create -o ${ORDERER_HOST_LOCAL} -c ${CHANNEL_NAME} \
            --file ${ROOTDIR}/channel-artifacts/${CHANNEL_NAME}.tx \
            --outputBlock ${ROOTDIR}/channel-artifacts/${CHANNEL_NAME}.block \
            --tls \
            --cafile ${ORDERER_CA} \
            --timeout 30s 2>&1
        
        # Restore peer's TLS root cert
        export CORE_PEER_TLS_ROOTCERT_FILE=${SAVED_PEER_TLS_ROOTCERT}
        
        # Check if block was created successfully (even if there were TLS warnings)
        if [ -f "${ROOTDIR}/channel-artifacts/${CHANNEL_NAME}.block" ]; then
            printSuccess "Channel ${CHANNEL_NAME} created successfully"
            return 0
        fi
        
        retry=$((retry + 1))
        if [ $retry -lt $max_retry ]; then
            printWarning "Channel creation failed, retrying in 3 seconds..."
            sleep 3
        fi
    done
    
    printError "Failed to create channel after $max_retry attempts"
    printError "Please check:"
    printError "  1. Orderer container is running: docker ps | grep orderer"
    printError "  2. Orderer logs: docker logs ${ORDERER_CONTAINER}"
    printError "  3. Port ${ORDERER_PORT} is accessible"
    exit 1
}

# Join channel for a peer
joinChannel() {
    ORG=$1
    setGlobalsForPeer $ORG

    printInfo "Joining ${ORG} to channel ${CHANNEL_NAME}..."

    # Check if peer is already joined to the channel
    if peer channel list | grep -q "${CHANNEL_NAME}"; then
        printInfo "${ORG} peer is already joined to channel ${CHANNEL_NAME}, skipping join"
        return 0
    fi

    BLOCK_FILE="${ROOTDIR}/channel-artifacts/${CHANNEL_NAME}.block"

    # If block file doesn't exist, fetch it from orderer
    if [ ! -f "$BLOCK_FILE" ]; then
        printInfo "Channel block file not found, fetching from orderer..."
        # Set ORDERER_CA if not already set
        if [ -z "${ORDERER_CA}" ] || [ ! -f "${ORDERER_CA}" ]; then
            ORDERER_TLS_CA="${ROOTDIR}/organizations/ordererOrganizations/${ORDERER_DOMAIN}/orderers/orderer.${ORDERER_DOMAIN}/tls/ca.crt"
            if [ -f "${ORDERER_TLS_CA}" ]; then
                export ORDERER_CA=${ORDERER_TLS_CA}
            fi
        fi

        peer channel fetch oldest $BLOCK_FILE -c ${CHANNEL_NAME} -o localhost:${ORDERER_PORT} --tls --cafile ${ORDERER_CA}
        if [ $? -ne 0 ]; then
            printError "Failed to fetch channel block from orderer"
            exit 1
        fi
        printInfo "Channel block fetched successfully"
    fi

    peer channel join -b $BLOCK_FILE

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

    # Use localhost for orderer address (from host)
    # TLS certificate includes localhost, so TLS should work
    ORDERER_HOST="localhost:${ORDERER_PORT}"

    # Convert org name to lowercase for anchor file
    ORG_LOWER=$(echo $ORG | tr '[:upper:]' '[:lower:]')

    # Check if anchor peer update file exists
    ANCHOR_FILE="${ROOTDIR}/channel-artifacts/${ORG_LOWER}Anchors.tx"
    if [ ! -f "$ANCHOR_FILE" ]; then
        printWarning "Anchor peer file ${ANCHOR_FILE} not found, skipping update"
        return 0
    fi

    # Use ORDERER_CA from envVar.sh if available
    if [ -z "${ORDERER_CA}" ] || [ ! -f "${ORDERER_CA}" ]; then
        TLS_CA_FILE="${ROOTDIR}/organizations/ordererOrganizations/${ORDERER_DOMAIN}/orderers/orderer.${ORDERER_DOMAIN}/tls/ca.crt"
        if [ ! -f "${TLS_CA_FILE}" ]; then
            TLS_CA_FILE="${ROOTDIR}/organizations/ordererOrganizations/${ORDERER_DOMAIN}/orderers/orderer.${ORDERER_DOMAIN}/msp/tlscacerts/tlsca.${ORDERER_DOMAIN}-cert.pem"
        fi
        export ORDERER_CA=${TLS_CA_FILE}
    fi

    if peer channel update -o ${ORDERER_HOST} -c ${CHANNEL_NAME} \
        -f ${ANCHOR_FILE} \
        --tls \
        --cafile ${ORDERER_CA} \
        --timeout 30s; then
        printSuccess "Anchor peers updated for ${ORG}"
    else
        printWarning "Failed to update anchor peers for ${ORG} (may already be updated)"
        # Don't exit with error for anchor peer updates, as they might already be set
    fi
}

# Set environment variables for orderer
setGlobalsForOrderer() {
    export CORE_PEER_LOCALMSPID=${ORDERER_MSP}
    export CORE_PEER_TLS_ENABLED=true
    # Use ORDERER_CA from envVar.sh if available
    if [ -z "${ORDERER_CA}" ] || [ ! -f "${ORDERER_CA}" ]; then
        TLS_CA_FILE="${ROOTDIR}/organizations/ordererOrganizations/${ORDERER_DOMAIN}/orderers/orderer.${ORDERER_DOMAIN}/tls/ca.crt"
        if [ ! -f "${TLS_CA_FILE}" ]; then
            TLS_CA_FILE="${ROOTDIR}/organizations/ordererOrganizations/${ORDERER_DOMAIN}/orderers/orderer.${ORDERER_DOMAIN}/msp/tlscacerts/tlsca.${ORDERER_DOMAIN}-cert.pem"
        fi
        export ORDERER_CA=${TLS_CA_FILE}
    fi
    export CORE_PEER_TLS_ROOTCERT_FILE=${ORDERER_CA}
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

