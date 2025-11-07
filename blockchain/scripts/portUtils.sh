#!/bin/bash

# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# Port management utilities

# Function to check if a port is available
checkPortAvailable() {
    local port=$1
    
    # Check if port is in use
    if command -v netstat >/dev/null 2>&1; then
        netstat -tuln | grep -q ":$port " && return 1
    elif command -v ss >/dev/null 2>&1; then
        ss -tuln | grep -q ":$port " && return 1
    elif command -v lsof >/dev/null 2>&1; then
        lsof -i :$port >/dev/null 2>&1 && return 1
    else
        # Fallback: try to bind to the port
        (echo >/dev/tcp/localhost/$port) >/dev/null 2>&1 && return 1
    fi
    
    # Check Docker containers
    docker ps --format '{{.Ports}}' | grep -q ":$port->" && return 1
    
    return 0
}

# Function to find an available port
findAvailablePort() {
    local start_port=${1:-7000}
    local end_port=${2:-13000}
    local port=$start_port
    
    while [ $port -le $end_port ]; do
        if checkPortAvailable $port; then
            echo $port
            return 0
        fi
        port=$((port + 1))
    done
    
    echo ""
    return 1
}

# Function to allocate ports for a new peer
allocatePeerPorts() {
    local org_name=$1
    local peer_num=${2:-0}
    local base_port=${3:-""}
    
    # Load .env file if exists
    if [ -f "${ROOTDIR}/.env" ]; then
        source "${ROOTDIR}/.env"
    fi
    
    # If base_port not provided, find available port
    if [ -z "$base_port" ]; then
        case "$org_name" in
            "Manufacturer")
                base_port=${MANUFACTURER_PEER_PORT:-7051}
                ;;
            "Logistics")
                base_port=${LOGISTICS_PEER_PORT:-9051}
                ;;
            "Retailer")
                base_port=${RETAILER_PEER_PORT:-11051}
                ;;
            *)
                # Find available port starting from default
                base_port=$(findAvailablePort 12000 13000)
                if [ -z "$base_port" ]; then
                    printError "No available port found"
                    return 1
                fi
                ;;
        esac
        
        # Adjust for peer number
        if [ $peer_num -gt 0 ]; then
            local increment=${PORT_INCREMENT:-2}
            base_port=$((base_port + peer_num * increment))
        fi
    fi
    
    # Check if port is available
    if ! checkPortAvailable $base_port; then
        printWarning "Port $base_port is in use, finding alternative..."
        base_port=$(findAvailablePort $base_port 13000)
        if [ -z "$base_port" ]; then
            printError "No available port found"
            return 1
        fi
    fi
    
    local chaincode_port=$((base_port + 1))
    
    # Check chaincode port
    if ! checkPortAvailable $chaincode_port; then
        printWarning "Chaincode port $chaincode_port is in use, finding alternative..."
        chaincode_port=$(findAvailablePort $chaincode_port 13000)
        if [ -z "$chaincode_port" ]; then
            printError "No available chaincode port found"
            return 1
        fi
    fi
    
    echo "$base_port $chaincode_port"
    return 0
}

# Function to load ports from .env or use defaults
loadPorts() {
    local env_file="${ROOTDIR}/.env"
    
    if [ -f "$env_file" ]; then
        source "$env_file"
        printInfo "Loaded ports from .env file"
    else
        printWarning ".env file not found, using default ports"
        # Set defaults
        export ORDERER_PORT=${ORDERER_PORT:-7050}
        export MANUFACTURER_PEER_PORT=${MANUFACTURER_PEER_PORT:-7051}
        export MANUFACTURER_CHAINCODE_PORT=${MANUFACTURER_CHAINCODE_PORT:-7052}
        export LOGISTICS_PEER_PORT=${LOGISTICS_PEER_PORT:-9051}
        export LOGISTICS_CHAINCODE_PORT=${LOGISTICS_CHAINCODE_PORT:-9052}
        export RETAILER_PEER_PORT=${RETAILER_PEER_PORT:-11051}
        export RETAILER_CHAINCODE_PORT=${RETAILER_CHAINCODE_PORT:-11052}
    fi
}

# Function to save ports to .env
savePortsToEnv() {
    local env_file="${ROOTDIR}/.env"
    
    cat > "$env_file" <<EOF
# Environment variables for Fabric network ports
# Auto-generated - modify as needed

# Orderer port
ORDERER_PORT=${ORDERER_PORT:-7050}

# Manufacturer organization ports
MANUFACTURER_PEER_PORT=${MANUFACTURER_PEER_PORT:-7051}
MANUFACTURER_CHAINCODE_PORT=${MANUFACTURER_CHAINCODE_PORT:-7052}

# Logistics organization ports
LOGISTICS_PEER_PORT=${LOGISTICS_PEER_PORT:-9051}
LOGISTICS_CHAINCODE_PORT=${LOGISTICS_CHAINCODE_PORT:-9052}

# Retailer organization ports
RETAILER_PEER_PORT=${RETAILER_PEER_PORT:-11051}
RETAILER_CHAINCODE_PORT=${RETAILER_CHAINCODE_PORT:-11052}

# Port range for dynamic allocation
PORT_START=${PORT_START:-7000}
PORT_END=${PORT_END:-13000}

# Port increment for multiple peers in same org
PORT_INCREMENT=${PORT_INCREMENT:-2}
EOF
    
    printSuccess "Ports saved to .env file"
}

# Function to check all required ports
checkAllPorts() {
    printInfo "Checking port availability..."
    
    loadPorts
    
    local all_available=true
    
    # Check orderer port
    if checkPortAvailable $ORDERER_PORT; then
        printSuccess "Orderer port $ORDERER_PORT is available"
    else
        printError "Orderer port $ORDERER_PORT is in use"
        all_available=false
    fi
    
    # Check manufacturer ports
    if checkPortAvailable $MANUFACTURER_PEER_PORT; then
        printSuccess "Manufacturer peer port $MANUFACTURER_PEER_PORT is available"
    else
        printError "Manufacturer peer port $MANUFACTURER_PEER_PORT is in use"
        all_available=false
    fi
    
    if checkPortAvailable $MANUFACTURER_CHAINCODE_PORT; then
        printSuccess "Manufacturer chaincode port $MANUFACTURER_CHAINCODE_PORT is available"
    else
        printError "Manufacturer chaincode port $MANUFACTURER_CHAINCODE_PORT is in use"
        all_available=false
    fi
    
    # Check logistics ports
    if checkPortAvailable $LOGISTICS_PEER_PORT; then
        printSuccess "Logistics peer port $LOGISTICS_PEER_PORT is available"
    else
        printError "Logistics peer port $LOGISTICS_PEER_PORT is in use"
        all_available=false
    fi
    
    if checkPortAvailable $LOGISTICS_CHAINCODE_PORT; then
        printSuccess "Logistics chaincode port $LOGISTICS_CHAINCODE_PORT is available"
    else
        printError "Logistics chaincode port $LOGISTICS_CHAINCODE_PORT is in use"
        all_available=false
    fi
    
    # Check retailer ports
    if checkPortAvailable $RETAILER_PEER_PORT; then
        printSuccess "Retailer peer port $RETAILER_PEER_PORT is available"
    else
        printError "Retailer peer port $RETAILER_PEER_PORT is in use"
        all_available=false
    fi
    
    if checkPortAvailable $RETAILER_CHAINCODE_PORT; then
        printSuccess "Retailer chaincode port $RETAILER_CHAINCODE_PORT is available"
    else
        printError "Retailer chaincode port $RETAILER_CHAINCODE_PORT is in use"
        all_available=false
    fi
    
    if [ "$all_available" = true ]; then
        printSuccess "All ports are available!"
        return 0
    else
        printError "Some ports are in use. Please modify .env file or stop conflicting services."
        return 1
    fi
}

