#!/bin/bash

# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# Network management script for Supply Chain Blockchain

# Import utility functions
. scripts/utils.sh
. scripts/portUtils.sh

# Function to check and allocate ports
checkAndAllocatePorts() {
    printInfo "Checking port availability..."
    
    # Load ports from .env if exists
    if [ -f "${ROOTDIR}/.env" ]; then
        source "${ROOTDIR}/.env"
    fi
    
    # Check all ports
    if ! checkAllPorts; then
        printWarning "Some ports are in use. Attempting to find alternatives..."
        
        # Try to find available ports
        ORDERER_PORT=$(findAvailablePort ${ORDERER_PORT:-7050} 7100)
        MANUFACTURER_PEER_PORT=$(findAvailablePort ${MANUFACTURER_PEER_PORT:-7051} 7100)
        MANUFACTURER_CHAINCODE_PORT=$(findAvailablePort ${MANUFACTURER_CHAINCODE_PORT:-7052} 7100)
        LOGISTICS_PEER_PORT=$(findAvailablePort ${LOGISTICS_PEER_PORT:-9051} 9100)
        LOGISTICS_CHAINCODE_PORT=$(findAvailablePort ${LOGISTICS_CHAINCODE_PORT:-9052} 9100)
        RETAILER_PEER_PORT=$(findAvailablePort ${RETAILER_PEER_PORT:-11051} 11100)
        RETAILER_CHAINCODE_PORT=$(findAvailablePort ${RETAILER_CHAINCODE_PORT:-11052} 11100)
        
        # Save to .env
        savePortsToEnv
        
        printInfo "Ports allocated. Check .env file for details."
    fi
}

# Function to generate certificates
generateCerts() {
    printInfo "Generating certificates using cryptogen..."
    
    if [ -d "${ROOTDIR}/organizations" ]; then
        printWarning "Organizations directory already exists. Removing..."
        rm -rf "${ROOTDIR}/organizations"
    fi
    
    cryptogen generate --config="${ROOTDIR}/config/cryptogen.yaml" --output="${ROOTDIR}/organizations"
    
    if [ $? -ne 0 ]; then
        printError "Failed to generate certificates"
        exit 1
    fi
    
    printSuccess "Certificates generated successfully"
}

# Function to generate genesis block
generateGenesisBlock() {
    printInfo "Generating genesis block..."
    
    mkdir -p "${ROOTDIR}/system-genesis-block"
    
    configtxgen -profile SupplyChainGenesis -channelID system-channel -outputBlock "${ROOTDIR}/system-genesis-block/genesis.block"
    
    if [ $? -ne 0 ]; then
        printError "Failed to generate genesis block"
        exit 1
    fi
    
    printSuccess "Genesis block generated successfully"
}

# Function to generate channel configuration
generateChannelTx() {
    printInfo "Generating channel configuration transaction..."
    
    mkdir -p "${ROOTDIR}/channel-artifacts"
    
    configtxgen -profile SupplyChainChannel -outputCreateChannelTx "${ROOTDIR}/channel-artifacts/${CHANNEL_NAME}.tx" -channelID ${CHANNEL_NAME}
    
    if [ $? -ne 0 ]; then
        printError "Failed to generate channel configuration transaction"
        exit 1
    fi
    
    printSuccess "Channel configuration transaction generated successfully"
}

# Function to generate anchor peer updates
generateAnchorPeers() {
    printInfo "Generating anchor peer updates..."
    
    for org in Manufacturer Logistics Retailer; do
        org_lower=$(echo $org | tr '[:upper:]' '[:lower:]')
        configtxgen -profile SupplyChainChannel -outputAnchorPeersUpdate "${ROOTDIR}/channel-artifacts/${org_lower}Anchors.tx" -channelID ${CHANNEL_NAME} -asOrg ${org}MSP
        
        if [ $? -ne 0 ]; then
            printError "Failed to generate anchor peer update for ${org}"
            exit 1
        fi
    done
    
    printSuccess "Anchor peer updates generated successfully"
}

# Function to start the network
networkUp() {
    printInfo "Starting the network..."
    
    # Check prerequisites
    checkPrereqs
    
    # Check and allocate ports
    checkAndAllocatePorts
    
    # Generate certificates if they don't exist
    if [ ! -d "${ROOTDIR}/organizations" ]; then
        generateCerts
    else
        printInfo "Certificates already exist, skipping generation"
    fi
    
    # Generate genesis block if it doesn't exist
    if [ ! -f "${ROOTDIR}/system-genesis-block/genesis.block" ]; then
        generateGenesisBlock
    else
        printInfo "Genesis block already exists, skipping generation"
    fi
    
    # Generate channel configuration if it doesn't exist
    if [ ! -f "${ROOTDIR}/channel-artifacts/${CHANNEL_NAME}.tx" ]; then
        generateChannelTx
        generateAnchorPeers
    else
        printInfo "Channel configuration already exists, skipping generation"
    fi
    
    # Start Docker containers
    cd "${ROOTDIR}"
    docker-compose up -d
    
    if [ $? -ne 0 ]; then
        printError "Failed to start network"
        exit 1
    fi
    
    printSuccess "Network started successfully"
    printInfo "Waiting for network to be ready..."
    sleep 10
    
    # Check if containers are running
    docker ps --filter "name=supplychain" --format "table {{.Names}}\t{{.Status}}"
}

# Function to stop the network
networkDown() {
    printInfo "Stopping the network..."
    
    cd "${ROOTDIR}"
    docker-compose down
    
    if [ $? -ne 0 ]; then
        printError "Failed to stop network"
        exit 1
    fi
    
    # Optionally remove volumes
    if [ "$1" == "-v" ] || [ "$1" == "--volumes" ]; then
        printInfo "Removing volumes..."
        docker-compose down -v
        docker volume prune -f
    fi
    
    printSuccess "Network stopped successfully"
}

# Function to clean up all generated files
networkClean() {
    printInfo "Cleaning up network artifacts..."
    
    networkDown -v
    
    clean
    
    # Remove Docker containers and images
    printInfo "Removing Docker containers..."
    docker ps -a --filter "name=supplychain" -q | xargs -r docker rm -f
    docker images --filter "reference=hyperledger/fabric-*" -q | xargs -r docker rmi -f
    
    printSuccess "Network cleaned successfully"
}

# Function to show network status
networkStatus() {
    printInfo "Network status:"
    docker ps --filter "name=supplychain" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Main command handler
if [ "$1" == "up" ]; then
    networkUp
elif [ "$1" == "down" ]; then
    networkDown "$2"
elif [ "$1" == "clean" ]; then
    networkClean
elif [ "$1" == "status" ]; then
    networkStatus
elif [ "$1" == "generate" ]; then
    checkPrereqs
    createDirs
    generateCerts
    generateGenesisBlock
    generateChannelTx
    generateAnchorPeers
    printSuccess "All artifacts generated successfully"
else
    echo "Usage: $0 {up|down|clean|status|generate}"
    echo "  up      - Start the network"
    echo "  down    - Stop the network (add -v to remove volumes)"
    echo "  clean   - Clean up all artifacts and containers"
    echo "  status  - Show network status"
    echo "  generate - Generate certificates and configuration files"
    exit 1
fi

