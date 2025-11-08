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
        printInfo "Loaded ports from .env file"
    else
        printWarning ".env file not found, using default ports"
        loadPorts
    fi
    
    # Quick check: if ports are already set, skip detailed check
    # Docker will handle port conflicts when starting containers
    if [ -n "${ORDERER_PORT}" ]; then
        printInfo "Ports configured, skipping detailed port check..."
        printInfo "Docker will handle port conflicts when starting containers"
        printSuccess "Port check completed (using configured ports)"
        return 0
    fi
    
    # If no ports configured, do full check (but with timeout protection)
    printInfo "Performing full port availability check..."
    if checkAllPorts; then
        printSuccess "All ports are available"
    else
        printWarning "Some ports may be in use, but proceeding with configured ports..."
    fi
}

# Function to generate TLS certificates using Fabric CA
generateTLSCerts() {
    # Check if TLS certificates already exist
    if [ -f "${ROOTDIR}/organizations/ordererOrganizations/supplychain.com/orderers/orderer.supplychain.com/tls/ca.crt" ]; then
        printInfo "TLS certificates already exist, skipping generation"
        return 0
    fi

    printInfo "Generating TLS certificates using Fabric CA..."
    
    # Check if fabric-ca-client is available
    if [ -f "${ROOTDIR}/../fabric-samples/bin/fabric-ca-client" ]; then
        export PATH=${ROOTDIR}/../fabric-samples/bin:$PATH
    elif ! command -v fabric-ca-client &> /dev/null; then
        printWarning "fabric-ca-client not found, using cryptogen TLS certificates"
        # Try to copy TLS certs from cryptogen output
        copyCryptogenTLSCerts
        return 0
    fi
    
    # Create CA directory
    CA_DIR="${ROOTDIR}/ca-tls"
    rm -rf "${CA_DIR}"
    mkdir -p "${CA_DIR}"
    
    # Copy TLS CA config
    mkdir -p "${CA_DIR}/tlsca"
    cp "${ROOTDIR}/config/tlsca/fabric-ca-server-config.yaml" "${CA_DIR}/tlsca/fabric-ca-server-config.yaml"
    
    # Start TLS CA server
    printInfo "Starting TLS CA server..."
    cd "${CA_DIR}/tlsca"
    
    # Check if fabric-ca-server is available
    if ! command -v fabric-ca-server &> /dev/null && [ ! -f "${ROOTDIR}/../fabric-samples/bin/fabric-ca-server" ]; then
        printWarning "fabric-ca-server not found, using cryptogen TLS certificates"
        copyCryptogenTLSCerts
        return 0
    fi
    
    # Set fabric-ca-server path
    if [ -f "${ROOTDIR}/../fabric-samples/bin/fabric-ca-server" ]; then
        export PATH=${ROOTDIR}/../fabric-samples/bin:$PATH
    fi
    
    # Initialize CA server (bootstrap)
    FABRIC_CA_SERVER_HOME="${CA_DIR}/tlsca" fabric-ca-server init -b admin:adminpw 2>&1 | tee "${CA_DIR}/tlsca-init.log" || {
        printWarning "CA initialization had issues, but continuing..."
    }
    
    # Start CA server
    FABRIC_CA_SERVER_HOME="${CA_DIR}/tlsca" fabric-ca-server start -b admin:adminpw -d > "${CA_DIR}/tlsca-server.log" 2>&1 &
    TLS_CA_PID=$!
    
    # Wait for CA server to start
    sleep 10
    
    # Check if CA server is running
    if ! kill -0 $TLS_CA_PID 2>/dev/null; then
        printError "TLS CA server failed to start. Check ${CA_DIR}/tlsca-server.log"
        if [ -f "${CA_DIR}/tlsca-server.log" ]; then
            printError "Last 20 lines of CA server log:"
            tail -20 "${CA_DIR}/tlsca-server.log" | sed 's/^/  /'
        fi
        copyCryptogenTLSCerts
        return 0
    fi
    
    # Verify CA server is responding
    sleep 2
    if ! curl -s http://localhost:7055/cainfo > /dev/null 2>&1; then
        printWarning "CA server may not be ready, but continuing..."
    fi
    
    # Enroll admin for TLS CA
    export FABRIC_CA_CLIENT_HOME="${CA_DIR}/admin"
    mkdir -p "${FABRIC_CA_CLIENT_HOME}"
    
    # Wait a bit more for CA to be ready
    sleep 2
    
    # Get CA certificate first
    fabric-ca-client getcacert -u http://localhost:7055 --caname tlsca-supplychain -M "${FABRIC_CA_CLIENT_HOME}/msp" 2>/dev/null || {
        printWarning "Failed to get CA cert, trying alternative method"
        copyCryptogenTLSCerts
        kill $TLS_CA_PID 2>/dev/null || true
        return 0
    }
    
    # Enroll admin
    fabric-ca-client enroll -u http://admin:adminpw@localhost:7055 --caname tlsca-supplychain -M "${FABRIC_CA_CLIENT_HOME}/msp" 2>/dev/null || {
        printWarning "Failed to enroll admin"
        copyCryptogenTLSCerts
        kill $TLS_CA_PID 2>/dev/null || true
        return 0
    }
    
    # Generate TLS certificates for orderer
    printInfo "Generating TLS certificate for orderer..."
    ORDERER_TLS_DIR="${ROOTDIR}/organizations/ordererOrganizations/supplychain.com/orderers/orderer.supplychain.com/tls"
    mkdir -p "${ORDERER_TLS_DIR}"
    
    # Register orderer identity
    fabric-ca-client register --caname tlsca-supplychain --id.name orderer --id.secret ordererpw --id.type orderer -u http://localhost:7055 2>/dev/null || true
    
    # Enroll orderer to get TLS certificate
    export FABRIC_CA_CLIENT_HOME="${ORDERER_TLS_DIR}/.."
    fabric-ca-client enroll -u http://orderer:ordererpw@localhost:7055 --caname tlsca-supplychain -M "${ORDERER_TLS_DIR}" --enrollment.profile tls --csr.hosts "orderer.supplychain.com,localhost,127.0.0.1" 2>/dev/null || {
        printWarning "Failed to enroll orderer TLS cert"
        copyCryptogenTLSCerts
        kill $TLS_CA_PID 2>/dev/null || true
        return 0
    }
    
    # Copy TLS certificates to correct location
    if [ -d "${ORDERER_TLS_DIR}/tlscacerts" ] && [ -n "$(ls -A ${ORDERER_TLS_DIR}/tlscacerts 2>/dev/null)" ]; then
        cp "${ORDERER_TLS_DIR}/tlscacerts/"*.pem "${ORDERER_TLS_DIR}/ca.crt" 2>/dev/null
    fi
    if [ -d "${ORDERER_TLS_DIR}/signcerts" ] && [ -n "$(ls -A ${ORDERER_TLS_DIR}/signcerts 2>/dev/null)" ]; then
        cp "${ORDERER_TLS_DIR}/signcerts/"*.pem "${ORDERER_TLS_DIR}/server.crt" 2>/dev/null
    fi
    if [ -d "${ORDERER_TLS_DIR}/keystore" ] && [ -n "$(ls -A ${ORDERER_TLS_DIR}/keystore 2>/dev/null)" ]; then
        cp "${ORDERER_TLS_DIR}/keystore/"* "${ORDERER_TLS_DIR}/server.key" 2>/dev/null
    fi
    
    # Generate TLS certificates for peers (similar process)
    for org in Manufacturer Logistics Retailer; do
        org_lower=$(echo $org | tr '[:upper:]' '[:lower:]')
        PEER_TLS_DIR="${ROOTDIR}/organizations/peerOrganizations/${org_lower}.supplychain.com/peers/peer0.${org_lower}.supplychain.com/tls"
        mkdir -p "${PEER_TLS_DIR}"
        
        # Register peer identity
        fabric-ca-client register --caname tlsca-supplychain --id.name "peer0.${org_lower}" --id.secret peerpw --id.type peer -u http://localhost:7055 2>/dev/null || true
        
        # Enroll peer
        export FABRIC_CA_CLIENT_HOME="${PEER_TLS_DIR}/.."
        fabric-ca-client enroll -u http://peer0.${org_lower}:peerpw@localhost:7055 --caname tlsca-supplychain -M "${PEER_TLS_DIR}" --enrollment.profile tls --csr.hosts "peer0.${org_lower}.supplychain.com,localhost,127.0.0.1" 2>/dev/null || continue
        
        # Copy certificates
        if [ -d "${PEER_TLS_DIR}/tlscacerts" ] && [ -n "$(ls -A ${PEER_TLS_DIR}/tlscacerts 2>/dev/null)" ]; then
            cp "${PEER_TLS_DIR}/tlscacerts/"*.pem "${PEER_TLS_DIR}/ca.crt" 2>/dev/null
        fi
        if [ -d "${PEER_TLS_DIR}/signcerts" ] && [ -n "$(ls -A ${PEER_TLS_DIR}/signcerts 2>/dev/null)" ]; then
            cp "${PEER_TLS_DIR}/signcerts/"*.pem "${PEER_TLS_DIR}/server.crt" 2>/dev/null
        fi
        if [ -d "${PEER_TLS_DIR}/keystore" ] && [ -n "$(ls -A ${PEER_TLS_DIR}/keystore 2>/dev/null)" ]; then
            cp "${PEER_TLS_DIR}/keystore/"* "${PEER_TLS_DIR}/server.key" 2>/dev/null
        fi
    done
    
    # Stop CA server
    kill $TLS_CA_PID 2>/dev/null || true
    wait $TLS_CA_PID 2>/dev/null || true
    
    cd "${ROOTDIR}"
    printSuccess "TLS certificates generated successfully"
}

# Function to copy TLS certs from cryptogen output (fallback)
copyCryptogenTLSCerts() {
    printInfo "Generating TLS certificates from MSP certificates..."
    
    # For orderer
    ORDERER_TLS_DIR="${ROOTDIR}/organizations/ordererOrganizations/supplychain.com/orderers/orderer.supplychain.com/tls"
    ORDERER_TLSCACERTS="${ROOTDIR}/organizations/ordererOrganizations/supplychain.com/orderers/orderer.supplychain.com/msp/tlscacerts"
    ORDERER_SIGNCERTS="${ROOTDIR}/organizations/ordererOrganizations/supplychain.com/orderers/orderer.supplychain.com/msp/signcerts"
    ORDERER_KEYSTORE="${ROOTDIR}/organizations/ordererOrganizations/supplychain.com/orderers/orderer.supplychain.com/msp/keystore"
    
    mkdir -p "${ORDERER_TLS_DIR}"
    
    # Use TLS certificates from tlscacerts directory (proper TLS certificates)
    # First try tlscacerts, then fall back to cacerts
    if [ -d "${ORDERER_TLSCACERTS}" ] && [ -n "$(ls -A ${ORDERER_TLSCACERTS} 2>/dev/null)" ]; then
        CA_CERT=$(ls "${ORDERER_TLSCACERTS}"/*.pem 2>/dev/null | head -1)
        if [ -n "$CA_CERT" ]; then
            cp "$CA_CERT" "${ORDERER_TLS_DIR}/ca.crt" 2>/dev/null
            printSuccess "Copied orderer TLS CA certificate from tlscacerts"
        fi
    else
        # Fallback to cacerts
        ORDERER_CACERTS="${ROOTDIR}/organizations/ordererOrganizations/supplychain.com/orderers/orderer.supplychain.com/msp/cacerts"
        if [ -d "${ORDERER_CACERTS}" ] && [ -n "$(ls -A ${ORDERER_CACERTS} 2>/dev/null)" ]; then
            CA_CERT=$(ls "${ORDERER_CACERTS}"/*.pem 2>/dev/null | head -1)
            if [ -n "$CA_CERT" ]; then
                cp "$CA_CERT" "${ORDERER_TLS_DIR}/ca.crt" 2>/dev/null
                printSuccess "Copied orderer TLS CA certificate from cacerts"
            fi
        fi
    fi
    
    # Use signcerts for server certificate (contains localhost in SAN)
    if [ -d "${ORDERER_SIGNCERTS}" ] && [ -n "$(ls -A ${ORDERER_SIGNCERTS} 2>/dev/null)" ]; then
        SERVER_CERT=$(ls "${ORDERER_SIGNCERTS}"/*.pem 2>/dev/null | head -1)
        if [ -n "$SERVER_CERT" ]; then
            cp "$SERVER_CERT" "${ORDERER_TLS_DIR}/server.crt" 2>/dev/null
            printSuccess "Copied orderer TLS server certificate"
        fi
    fi
    if [ -d "${ORDERER_KEYSTORE}" ] && [ -n "$(ls -A ${ORDERER_KEYSTORE} 2>/dev/null)" ]; then
        SERVER_KEY=$(ls "${ORDERER_KEYSTORE}"/* 2>/dev/null | head -1)
        if [ -n "$SERVER_KEY" ]; then
            cp "$SERVER_KEY" "${ORDERER_TLS_DIR}/server.key" 2>/dev/null
            printSuccess "Copied orderer TLS server key"
        fi
    fi
    
    # For peers
    for org in Manufacturer Logistics Retailer; do
        org_lower=$(echo $org | tr '[:upper:]' '[:lower:]')
        PEER_TLS_DIR="${ROOTDIR}/organizations/peerOrganizations/${org_lower}.supplychain.com/peers/peer0.${org_lower}.supplychain.com/tls"
        PEER_TLSCACERTS="${ROOTDIR}/organizations/peerOrganizations/${org_lower}.supplychain.com/peers/peer0.${org_lower}.supplychain.com/msp/tlscacerts"
        PEER_SIGNCERTS="${ROOTDIR}/organizations/peerOrganizations/${org_lower}.supplychain.com/peers/peer0.${org_lower}.supplychain.com/msp/signcerts"
        PEER_KEYSTORE="${ROOTDIR}/organizations/peerOrganizations/${org_lower}.supplychain.com/peers/peer0.${org_lower}.supplychain.com/msp/keystore"
        
        mkdir -p "${PEER_TLS_DIR}"
        
        # Use MSP certificates as TLS certificates
        PEER_CACERTS="${ROOTDIR}/organizations/peerOrganizations/${org_lower}.supplychain.com/peers/peer0.${org_lower}.supplychain.com/msp/cacerts"
        
        if [ -d "${PEER_CACERTS}" ] && [ -n "$(ls -A ${PEER_CACERTS} 2>/dev/null)" ]; then
            CA_CERT=$(ls "${PEER_CACERTS}"/*.pem 2>/dev/null | head -1)
            if [ -n "$CA_CERT" ]; then
                cp "$CA_CERT" "${PEER_TLS_DIR}/ca.crt" 2>/dev/null
            fi
        fi
        if [ -d "${PEER_SIGNCERTS}" ] && [ -n "$(ls -A ${PEER_SIGNCERTS} 2>/dev/null)" ]; then
            SERVER_CERT=$(ls "${PEER_SIGNCERTS}"/*.pem 2>/dev/null | head -1)
            if [ -n "$SERVER_CERT" ]; then
                cp "$SERVER_CERT" "${PEER_TLS_DIR}/server.crt" 2>/dev/null
            fi
        fi
        if [ -d "${PEER_KEYSTORE}" ] && [ -n "$(ls -A ${PEER_KEYSTORE} 2>/dev/null)" ]; then
            SERVER_KEY=$(ls "${PEER_KEYSTORE}"/* 2>/dev/null | head -1)
            if [ -n "$SERVER_KEY" ]; then
                cp "$SERVER_KEY" "${PEER_TLS_DIR}/server.key" 2>/dev/null
            fi
        fi
    done
    
    printSuccess "TLS certificates generated from MSP certificates"
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
    
    printSuccess "MSP certificates generated successfully"
    
    # Generate TLS certificates using Fabric CA
    generateTLSCerts
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
    echo ""
    printInfo "Network status:"
    docker ps --filter "name=supplychain" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || docker ps --filter "name=supplychain"
    
    echo ""
    printSuccess "Network is running in the background"
    printInfo "To view logs: docker logs <container-name>"
    printInfo "To stop network: ./scripts/network.sh down"
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

