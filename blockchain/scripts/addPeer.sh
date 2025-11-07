#!/bin/bash

# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# Script to add a new peer node to the existing network

. scripts/envVar.sh
. scripts/utils.sh

# Get the current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ ! -d "$DIR" ]; then
  DIR="$PWD"
fi
ROOTDIR="$(dirname "$DIR")"

# Parameters
ORG_NAME=${1:-""}
PEER_NUM=${2:-"0"}  # 0 for first peer, 1 for second peer, etc.
PEER_PORT=${3:-""}  # Port for the peer (e.g., 12051)

if [ -z "$ORG_NAME" ]; then
    printError "Organization name is required"
    echo "Usage: $0 <org_name> [peer_num] [peer_port]"
    echo "Example: $0 Distributor 0 12051"
    exit 1
fi

ORG_LOWER=$(echo $ORG_NAME | tr '[:upper:]' '[:lower:]')
ORG_DOMAIN="${ORG_LOWER}.supplychain.com"
PEER_NAME="peer${PEER_NUM}.${ORG_DOMAIN}"
MSP_ID="${ORG_NAME}MSP"

# Auto-assign port if not provided
if [ -z "$PEER_PORT" ]; then
    case "$ORG_NAME" in
        "Manufacturer")
            PEER_PORT=$((7051 + PEER_NUM * 2))
            ;;
        "Logistics")
            PEER_PORT=$((9051 + PEER_NUM * 2))
            ;;
        "Retailer")
            PEER_PORT=$((11051 + PEER_NUM * 2))
            ;;
        *)
            # Default port calculation
            PEER_PORT=$((12051 + PEER_NUM * 2))
            ;;
    esac
fi

CHAINCODE_PORT=$((PEER_PORT + 1))

printInfo "Adding new peer node:"
printInfo "  Organization: ${ORG_NAME}"
printInfo "  Peer Name: ${PEER_NAME}"
printInfo "  Peer Port: ${PEER_PORT}"
printInfo "  Chaincode Port: ${CHAINCODE_PORT}"
printInfo "  MSP ID: ${MSP_ID}"

# Check if certificates exist
CERT_PATH="${ROOTDIR}/organizations/peerOrganizations/${ORG_DOMAIN}/peers/${PEER_NAME}"
if [ ! -d "$CERT_PATH" ]; then
    printError "Certificates not found at ${CERT_PATH}"
    printInfo "Please generate certificates first using cryptogen or Fabric CA"
    exit 1
fi

# Check if docker-compose-extend.yml exists
EXTEND_FILE="${ROOTDIR}/docker-compose-extend.yml"
if [ ! -f "$EXTEND_FILE" ]; then
    printInfo "Creating docker-compose-extend.yml..."
    cat > "$EXTEND_FILE" <<EOF
version: '2.4'

networks:
  supplychain:
    external: true

services:
EOF
fi

# Generate peer service configuration
printInfo "Generating peer service configuration..."

PEER_CONFIG=$(cat <<EOF
  ${PEER_NAME}:
    container_name: ${PEER_NAME}
    image: hyperledger/fabric-peer:2.5
    environment:
      - CORE_PEER_ID=${PEER_NAME}
      - CORE_PEER_ADDRESS=${PEER_NAME}:${PEER_PORT}
      - CORE_PEER_LISTENADDRESS=0.0.0.0:${PEER_PORT}
      - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:${CHAINCODE_PORT}
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.${ORG_DOMAIN}:$((${PEER_PORT} - ${PEER_NUM} * 2))
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=${PEER_NAME}:${PEER_PORT}
      - CORE_PEER_LOCALMSPID=${MSP_ID}
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt
      - CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/msp
    volumes:
      - /var/run/docker.sock:/host/var/run/docker.sock
      - ../organizations/peerOrganizations/${ORG_DOMAIN}/peers/${PEER_NAME}/msp:/etc/hyperledger/fabric/msp
      - ../organizations/peerOrganizations/${ORG_DOMAIN}/peers/${PEER_NAME}/tls:/etc/hyperledger/fabric/tls
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: peer node start
    ports:
      - ${PEER_PORT}:${PEER_PORT}
    networks:
      - supplychain
EOF
)

# Append to docker-compose-extend.yml
echo "$PEER_CONFIG" >> "$EXTEND_FILE"

printSuccess "Peer configuration added to docker-compose-extend.yml"

# Start the new peer
printInfo "Starting new peer node..."
cd "${ROOTDIR}"
docker-compose -f docker-compose.yml -f docker-compose-extend.yml up -d ${PEER_NAME}

if [ $? -eq 0 ]; then
    printSuccess "Peer ${PEER_NAME} started successfully"
    printInfo "Next steps:"
    printInfo "1. Join the peer to channel: ./scripts/joinPeerToChannel.sh ${ORG_NAME} ${PEER_NUM}"
    printInfo "2. Install chaincode on the peer: ./scripts/installChaincodeOnPeer.sh ${ORG_NAME} ${PEER_NUM}"
else
    printError "Failed to start peer ${PEER_NAME}"
    exit 1
fi

