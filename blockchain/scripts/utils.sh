#!/bin/bash

# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# This is a collection of bash functions used by the network.sh script

# imports
. scripts/envVar.sh

# get the current directory
# if executed inside a subdirectory or returns the wrong path, adjust accordingly
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ ! -d "$DIR" ]; then
  DIR="$PWD"
fi
ROOTDIR="$(dirname "$DIR")"

# Set environment variables
export FABRIC_CFG_PATH=${ROOTDIR}/config

# Set PATH to include necessary binaries
# Check multiple possible locations for bin directory
if [ -d "${ROOTDIR}/../bin" ]; then
    export PATH=${ROOTDIR}/../bin:$PATH
elif [ -d "${ROOTDIR}/../fabric-samples/bin" ]; then
    export PATH=${ROOTDIR}/../fabric-samples/bin:$PATH
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print colored output
printInfo() {
    echo -e "${BLUE}INFO${NC}: $1"
}

printSuccess() {
    echo -e "${GREEN}SUCCESS${NC}: $1"
}

printError() {
    echo -e "${RED}ERROR${NC}: $1"
}

printWarning() {
    echo -e "${YELLOW}WARNING${NC}: $1"
}

# Check if required binaries exist
checkPrereqs() {
    printInfo "Checking prerequisites..."
    
    # Determine bin directory location
    BIN_DIR=""
    if [ -d "${ROOTDIR}/../bin" ] && [ -f "${ROOTDIR}/../bin/configtxgen" ]; then
        BIN_DIR="${ROOTDIR}/../bin"
    elif [ -d "${ROOTDIR}/../fabric-samples/bin" ] && [ -f "${ROOTDIR}/../fabric-samples/bin/configtxgen" ]; then
        BIN_DIR="${ROOTDIR}/../fabric-samples/bin"
    fi
    
    if [ -z "$BIN_DIR" ]; then
        printError "Binaries directory not found. Please download Fabric binaries first."
        printError "Expected locations:"
        printError "  - ${ROOTDIR}/../bin"
        printError "  - ${ROOTDIR}/../fabric-samples/bin"
        exit 1
    fi
    
    # Update PATH if needed
    if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
        export PATH="$BIN_DIR:$PATH"
    fi
    
    if [ ! -f "$BIN_DIR/configtxgen" ]; then
        printError "configtxgen not found in $BIN_DIR. Please download Fabric binaries."
        exit 1
    fi
    
    if [ ! -f "$BIN_DIR/cryptogen" ]; then
        printError "cryptogen not found in $BIN_DIR. Please download Fabric binaries."
        exit 1
    fi
    
    printInfo "Using binaries from: $BIN_DIR"
    
    if ! command -v docker &> /dev/null; then
        printError "Docker is not installed or not in PATH."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! command -v docker compose &> /dev/null; then
        printError "Docker Compose is not installed or not in PATH."
        exit 1
    fi
    
    printSuccess "All prerequisites met!"
}

# Clean up generated files
clean() {
    printInfo "Cleaning up generated files..."
    
    if [ -d "${ROOTDIR}/organizations" ]; then
        rm -rf "${ROOTDIR}/organizations"
        printSuccess "Removed organizations directory"
    fi
    
    if [ -d "${ROOTDIR}/system-genesis-block" ]; then
        rm -rf "${ROOTDIR}/system-genesis-block"
        printSuccess "Removed system-genesis-block directory"
    fi
    
    if [ -d "${ROOTDIR}/channel-artifacts" ]; then
        rm -rf "${ROOTDIR}/channel-artifacts"
        printSuccess "Removed channel-artifacts directory"
    fi
    
    if [ -d "${ROOTDIR}/../bin" ]; then
        printWarning "Binaries directory exists. Remove manually if needed."
    fi
}

# Create directories
createDirs() {
    printInfo "Creating necessary directories..."
    
    mkdir -p "${ROOTDIR}/organizations/ordererOrganizations"
    mkdir -p "${ROOTDIR}/organizations/peerOrganizations"
    mkdir -p "${ROOTDIR}/system-genesis-block"
    mkdir -p "${ROOTDIR}/channel-artifacts"
    
    printSuccess "Directories created"
}

