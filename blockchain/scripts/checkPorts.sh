#!/bin/bash

# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# Script to check and configure ports

. scripts/utils.sh
. scripts/portUtils.sh

# Get the current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ ! -d "$DIR" ]; then
  DIR="$PWD"
fi
ROOTDIR="$(dirname "$DIR")"

printInfo "Port Configuration Tool"
printInfo "======================"

# Check if .env exists
if [ ! -f "${ROOTDIR}/.env" ]; then
    printInfo "Creating .env file from template..."
    cp "${ROOTDIR}/.env.example" "${ROOTDIR}/.env" 2>/dev/null || {
        printWarning ".env.example not found, creating default .env"
        savePortsToEnv
    }
fi

# Load current ports
loadPorts

# Check all ports
printInfo ""
printInfo "Checking port availability..."
checkAllPorts

if [ $? -eq 0 ]; then
    printSuccess ""
    printSuccess "All ports are available!"
    printInfo ""
    printInfo "Current port configuration:"
    printInfo "  Orderer: ${ORDERER_PORT}"
    printInfo "  Manufacturer Peer: ${MANUFACTURER_PEER_PORT}"
    printInfo "  Manufacturer Chaincode: ${MANUFACTURER_CHAINCODE_PORT}"
    printInfo "  Logistics Peer: ${LOGISTICS_PEER_PORT}"
    printInfo "  Logistics Chaincode: ${LOGISTICS_CHAINCODE_PORT}"
    printInfo "  Retailer Peer: ${RETAILER_PEER_PORT}"
    printInfo "  Retailer Chaincode: ${RETAILER_CHAINCODE_PORT}"
    printInfo ""
    printInfo "To modify ports, edit ${ROOTDIR}/.env file"
else
    printError ""
    printError "Some ports are in use!"
    printInfo ""
    printInfo "Options:"
    printInfo "1. Stop conflicting services"
    printInfo "2. Modify ${ROOTDIR}/.env file to use different ports"
    printInfo "3. Run this script again to auto-allocate available ports"
    exit 1
fi

