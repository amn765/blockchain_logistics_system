#!/bin/bash

# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# Environment variables for the network

export FABRIC_CFG_PATH=${PWD}/config

# Channel name
export CHANNEL_NAME=supplychainchannel

# Chaincode name
export CC_NAME=supplychain
export CC_SRC_PATH=../contracts
export CC_SRC_LANGUAGE=go
export CC_VERSION=1.0
export CC_SEQUENCE=1
export CC_INIT_FCN="InitLedger"
export CC_END_POLICY="NA"
export CC_COLL_CONFIG="NA"
export DELAY=3
export MAX_RETRY=5
export VERBOSE=false

# Organization MSP IDs
export ORDERER_MSP=OrdererMSP
export MANUFACTURER_MSP=ManufacturerMSP
export LOGISTICS_MSP=LogisticsMSP
export RETAILER_MSP=RetailerMSP

# Organization domains
export ORDERER_DOMAIN=supplychain.com
export MANUFACTURER_DOMAIN=manufacturer.supplychain.com
export LOGISTICS_DOMAIN=logistics.supplychain.com
export RETAILER_DOMAIN=retailer.supplychain.com

# Load ports from .env file or use defaults
if [ -f "${PWD}/.env" ]; then
    source "${PWD}/.env"
fi

# Port configuration (with defaults)
export ORDERER_PORT=${ORDERER_PORT:-7050}
export MANUFACTURER_PEER_PORT=${MANUFACTURER_PEER_PORT:-7051}
export MANUFACTURER_CHAINCODE_PORT=${MANUFACTURER_CHAINCODE_PORT:-7052}
export LOGISTICS_PEER_PORT=${LOGISTICS_PEER_PORT:-9051}
export LOGISTICS_CHAINCODE_PORT=${LOGISTICS_CHAINCODE_PORT:-9052}
export RETAILER_PEER_PORT=${RETAILER_PEER_PORT:-11051}
export RETAILER_CHAINCODE_PORT=${RETAILER_CHAINCODE_PORT:-11052}

# Peer addresses (using dynamic ports)
export PEER0_MANUFACTURER=peer0.manufacturer.supplychain.com:${MANUFACTURER_PEER_PORT}
export PEER0_LOGISTICS=peer0.logistics.supplychain.com:${LOGISTICS_PEER_PORT}
export PEER0_RETAILER=peer0.retailer.supplychain.com:${RETAILER_PEER_PORT}

# Orderer address (using dynamic port)
export ORDERER_ADDRESS=orderer.supplychain.com:${ORDERER_PORT}
