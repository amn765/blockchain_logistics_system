# Hyperledger Fabric Network Setup

This directory contains the configuration and scripts for setting up the Supply Chain blockchain network.

## Prerequisites

Before starting, ensure you have the following installed:

1. **Docker** and **Docker Compose**
   ```bash
   docker --version
   docker-compose --version
   ```

2. **Hyperledger Fabric Binaries**
   Download Fabric binaries (v2.5) and place them in `../bin` directory:
   ```bash
   curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0 1.5.5
   ```
   This will create a `bin` directory with necessary tools.

3. **Go** (for chaincode development)
   ```bash
   go version  # Should be 1.19 or higher
   ```

4. **jq** (for JSON parsing in scripts)
   ```bash
   sudo apt-get install jq  # Ubuntu/Debian
   ```

## Directory Structure

```
blockchain/
├── config/                    # Configuration files
│   ├── configtx.yaml         # Channel and network configuration
│   └── cryptogen.yaml        # Certificate generation configuration
├── scripts/                   # Network management scripts
│   ├── network.sh            # Main network control script
│   ├── createChannel.sh      # Channel creation script
│   ├── deployChaincode.sh    # Chaincode deployment script
│   ├── generateConnectionProfiles.sh  # SDK connection profiles
│   ├── utils.sh              # Utility functions
│   └── envVar.sh             # Environment variables
├── organizations/            # Generated certificates (created by scripts)
├── system-genesis-block/      # Genesis block (created by scripts)
├── channel-artifacts/         # Channel configuration (created by scripts)
└── docker-compose.yml         # Docker Compose configuration
```

## Quick Start

### 1. Generate Network Artifacts

First, generate all necessary certificates and configuration files:

```bash
cd blockchain
./scripts/network.sh generate
```

This will create:
- Organization certificates in `organizations/`
- Genesis block in `system-genesis-block/`
- Channel configuration in `channel-artifacts/`

### 2. Start the Network

```bash
./scripts/network.sh up
```

This will:
- Check prerequisites
- Generate certificates and configs if they don't exist
- Start all Docker containers (Orderer + 3 Peers)

### 3. Create Channel

```bash
./scripts/createChannel.sh supplychainchannel
```

This creates the channel and joins all peers to it.

### 4. Deploy Chaincode

```bash
./scripts/deployChaincode.sh supplychain ../contracts go 1.0 1 InitLedger
```

Parameters:
- Chaincode name: `supplychain`
- Source path: `../contracts`
- Language: `go`
- Version: `1.0`
- Sequence: `1`
- Init function: `InitLedger`

### 5. Generate Connection Profiles

Generate connection profiles for SDK:

```bash
./scripts/generateConnectionProfiles.sh
```

This creates connection JSON files for each organization that can be used by the backend SDK.

## Network Management

### Start Network
```bash
./scripts/network.sh up
```

### Stop Network
```bash
./scripts/network.sh down
```

### Stop Network and Remove Volumes
```bash
./scripts/network.sh down -v
```

### Clean Everything
```bash
./scripts/network.sh clean
```
⚠️ **Warning**: This removes all certificates, configurations, and Docker containers/images.

### Check Network Status
```bash
./scripts/network.sh status
```

## Network Components

### Organizations
- **OrdererMSP**: Orderer organization
- **ManufacturerMSP**: Manufacturer peer organization
- **LogisticsMSP**: Logistics peer organization  
- **RetailerMSP**: Retailer peer organization

### Peers
- `peer0.manufacturer.supplychain.com:7051`
- `peer0.logistics.supplychain.com:9051`
- `peer0.retailer.supplychain.com:11051`

### Orderer
- `orderer.supplychain.com:7050`

### Channel
- `supplychainchannel`

## Troubleshooting

### Check Container Logs
```bash
docker logs orderer.supplychain.com
docker logs peer0.manufacturer.supplychain.com
docker logs peer0.logistics.supplychain.com
docker logs peer0.retailer.supplychain.com
```

### Check Container Status
```bash
docker ps -a | grep supplychain
```

### Clean and Restart
If you encounter issues, try:
```bash
./scripts/network.sh clean
./scripts/network.sh generate
./scripts/network.sh up
```

### Verify Certificates
```bash
ls -la organizations/peerOrganizations/manufacturer.supplychain.com/peers/peer0.manufacturer.supplychain.com/msp/
```

## Connection Profiles

After running `generateConnectionProfiles.sh`, connection profiles are available at:
- `organizations/peerOrganizations/manufacturer.supplychain.com/connection-manufacturer.json`
- `organizations/peerOrganizations/logistics.supplychain.com/connection-logistics.json`
- `organizations/peerOrganizations/retailer.supplychain.com/connection-retailer.json`

These can be used by the backend SDK to connect to the Fabric network.

## Adding New Nodes

You can add new peer nodes to the network **without modifying the main docker-compose.yml** file.

### Option 1: Use docker-compose-extend.yml (Recommended)

1. **Generate certificates** for the new node/organization
2. **Create or edit** `docker-compose-extend.yml` (see `docker-compose-extend.yml.example`)
3. **Start the new node**:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose-extend.yml up -d
   ```

### Option 2: Use addPeer.sh script

```bash
# Add a new peer node
./scripts/addPeer.sh Distributor 0 12051

# Join the peer to channel
./scripts/joinPeerToChannel.sh Distributor 0 supplychainchannel
```

See `docs/ADD_NODE_GUIDE.md` for detailed instructions.

## Notes

- All scripts must be run from the `blockchain` directory
- Make sure scripts have execute permissions: `chmod +x scripts/*.sh`
- The network uses TLS encryption
- Ports are exposed for local development (adjust for production)
- **You don't need to modify docker-compose.yml** to add new nodes - use extend files instead

