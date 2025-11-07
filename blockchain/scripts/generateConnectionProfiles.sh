#!/bin/bash

# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# Script to generate connection profiles for SDK

# Get the current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ ! -d "$DIR" ]; then
  DIR="$PWD"
fi
ROOTDIR="$(dirname "$DIR")"

. scripts/envVar.sh
. scripts/utils.sh

printInfo "Generating connection profiles..."

# Generate connection profile for Manufacturer
generateManufacturerProfile() {
    printInfo "Generating connection profile for Manufacturer..."
    
    cat > ${ROOTDIR}/organizations/peerOrganizations/${MANUFACTURER_DOMAIN}/connection-manufacturer.json <<EOF
{
    "name": "supplychain-network",
    "version": "1.0.0",
    "client": {
        "organization": "Manufacturer",
        "connection": {
            "timeout": {
                "peer": {
                    "endorser": "300"
                }
            }
        }
    },
    "organizations": {
        "Manufacturer": {
            "mspid": "${MANUFACTURER_MSP}",
            "peers": [
                "peer0.${MANUFACTURER_DOMAIN}"
            ],
            "certificateAuthorities": [
                "ca.${MANUFACTURER_DOMAIN}"
            ]
        }
    },
    "orderers": {
        "orderer.${ORDERER_DOMAIN}": {
            "url": "grpc://localhost:7050",
            "tlsCACerts": {
                "path": "${ROOTDIR}/organizations/ordererOrganizations/${ORDERER_DOMAIN}/orderers/orderer.${ORDERER_DOMAIN}/msp/tlscacerts/tlsca.${ORDERER_DOMAIN}-cert.pem"
            }
        }
    },
    "peers": {
        "peer0.${MANUFACTURER_DOMAIN}": {
            "url": "grpc://localhost:7051",
            "tlsCACerts": {
                "path": "${ROOTDIR}/organizations/peerOrganizations/${MANUFACTURER_DOMAIN}/peers/peer0.${MANUFACTURER_DOMAIN}/tls/ca.crt"
            },
            "grpcOptions": {
                "ssl-target-name-override": "peer0.${MANUFACTURER_DOMAIN}",
                "hostnameOverride": "peer0.${MANUFACTURER_DOMAIN}"
            }
        }
    },
    "channels": {
        "${CHANNEL_NAME}": {
            "orderers": [
                "orderer.${ORDERER_DOMAIN}"
            ],
            "peers": {
                "peer0.${MANUFACTURER_DOMAIN}": {
                    "endorsingPeer": true,
                    "chaincodeQuery": true,
                    "ledgerQuery": true,
                    "eventSource": true
                }
            }
        }
    }
}
EOF
    
    printSuccess "Connection profile for Manufacturer generated"
}

# Generate connection profile for Logistics
generateLogisticsProfile() {
    printInfo "Generating connection profile for Logistics..."
    
    cat > ${ROOTDIR}/organizations/peerOrganizations/${LOGISTICS_DOMAIN}/connection-logistics.json <<EOF
{
    "name": "supplychain-network",
    "version": "1.0.0",
    "client": {
        "organization": "Logistics",
        "connection": {
            "timeout": {
                "peer": {
                    "endorser": "300"
                }
            }
        }
    },
    "organizations": {
        "Logistics": {
            "mspid": "${LOGISTICS_MSP}",
            "peers": [
                "peer0.${LOGISTICS_DOMAIN}"
            ],
            "certificateAuthorities": [
                "ca.${LOGISTICS_DOMAIN}"
            ]
        }
    },
    "orderers": {
        "orderer.${ORDERER_DOMAIN}": {
            "url": "grpc://localhost:7050",
            "tlsCACerts": {
                "path": "${ROOTDIR}/organizations/ordererOrganizations/${ORDERER_DOMAIN}/orderers/orderer.${ORDERER_DOMAIN}/msp/tlscacerts/tlsca.${ORDERER_DOMAIN}-cert.pem"
            }
        }
    },
    "peers": {
        "peer0.${LOGISTICS_DOMAIN}": {
            "url": "grpc://localhost:9051",
            "tlsCACerts": {
                "path": "${ROOTDIR}/organizations/peerOrganizations/${LOGISTICS_DOMAIN}/peers/peer0.${LOGISTICS_DOMAIN}/tls/ca.crt"
            },
            "grpcOptions": {
                "ssl-target-name-override": "peer0.${LOGISTICS_DOMAIN}",
                "hostnameOverride": "peer0.${LOGISTICS_DOMAIN}"
            }
        }
    },
    "channels": {
        "${CHANNEL_NAME}": {
            "orderers": [
                "orderer.${ORDERER_DOMAIN}"
            ],
            "peers": {
                "peer0.${LOGISTICS_DOMAIN}": {
                    "endorsingPeer": true,
                    "chaincodeQuery": true,
                    "ledgerQuery": true,
                    "eventSource": true
                }
            }
        }
    }
}
EOF
    
    printSuccess "Connection profile for Logistics generated"
}

# Generate connection profile for Retailer
generateRetailerProfile() {
    printInfo "Generating connection profile for Retailer..."
    
    cat > ${ROOTDIR}/organizations/peerOrganizations/${RETAILER_DOMAIN}/connection-retailer.json <<EOF
{
    "name": "supplychain-network",
    "version": "1.0.0",
    "client": {
        "organization": "Retailer",
        "connection": {
            "timeout": {
                "peer": {
                    "endorser": "300"
                }
            }
        }
    },
    "organizations": {
        "Retailer": {
            "mspid": "${RETAILER_MSP}",
            "peers": [
                "peer0.${RETAILER_DOMAIN}"
            ],
            "certificateAuthorities": [
                "ca.${RETAILER_DOMAIN}"
            ]
        }
    },
    "orderers": {
        "orderer.${ORDERER_DOMAIN}": {
            "url": "grpc://localhost:7050",
            "tlsCACerts": {
                "path": "${ROOTDIR}/organizations/ordererOrganizations/${ORDERER_DOMAIN}/orderers/orderer.${ORDERER_DOMAIN}/msp/tlscacerts/tlsca.${ORDERER_DOMAIN}-cert.pem"
            }
        }
    },
    "peers": {
        "peer0.${RETAILER_DOMAIN}": {
            "url": "grpc://localhost:11051",
            "tlsCACerts": {
                "path": "${ROOTDIR}/organizations/peerOrganizations/${RETAILER_DOMAIN}/peers/peer0.${RETAILER_DOMAIN}/tls/ca.crt"
            },
            "grpcOptions": {
                "ssl-target-name-override": "peer0.${RETAILER_DOMAIN}",
                "hostnameOverride": "peer0.${RETAILER_DOMAIN}"
            }
        }
    },
    "channels": {
        "${CHANNEL_NAME}": {
            "orderers": [
                "orderer.${ORDERER_DOMAIN}"
            ],
            "peers": {
                "peer0.${RETAILER_DOMAIN}": {
                    "endorsingPeer": true,
                    "chaincodeQuery": true,
                    "ledgerQuery": true,
                    "eventSource": true
                }
            }
        }
    }
}
EOF
    
    printSuccess "Connection profile for Retailer generated"
}

# Main execution
generateManufacturerProfile
generateLogisticsProfile
generateRetailerProfile

printSuccess "All connection profiles generated successfully!"

