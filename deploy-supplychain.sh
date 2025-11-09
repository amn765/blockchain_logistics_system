#!/bin/bash

# === 配置项 ===
CC_NAME="supplychain"               # 链码名称（不能有大写或特殊字符）
CC_VERSION="1.0"
CC_SEQUENCE=1
CC_INIT_REQUIRED=false              # 如果你的合约有 Init 函数且必须调用，则设为 true
CHANNEL_NAME="channel1"
CHAINCODE_PATH="../../contracts"    # 相对于 blockchain_new/test-network 的路径

cd blockchain_new/test-network || { echo "目录 blockchain_new/test-network 不存在"; exit 1; }

echo "📦 打包链码..."
# 设置正确的环境变量来打包链码
export FABRIC_CFG_PATH=$PWD/../config/
peer lifecycle chaincode package ${CC_NAME}.tar.gz \
  --path ${CHAINCODE_PATH} \
  --lang golang \
  --label ${CC_NAME}_${CC_VERSION}

# === Org1 安装 ===
echo "🏢 在 Org1 Peer 上安装链码..."
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode install ${CC_NAME}.tar.gz

# 获取包 ID（用于后续 approve）
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled --output json | jq -r ".installed_chaincodes[0].package_id")

# === Org2 安装 ===
echo "🏢 在 Org2 Peer 上安装链码..."
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

peer lifecycle chaincode install ${CC_NAME}.tar.gz

# === Org3 安装（因为用了 addOrg3）===
echo "🏢 在 Org3 Peer 上安装链码..."
export CORE_PEER_LOCALMSPID="Org3MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
export CORE_PEER_ADDRESS=localhost:11051

peer lifecycle chaincode install ${CC_NAME}.tar.gz

# === Org1 批准 ===
echo "✅ Org1 批准链码定义..."
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode approveformyorg \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  --channelID $CHANNEL_NAME \
  --name ${CC_NAME} \
  --version ${CC_VERSION} \
  --package-id $PACKAGE_ID \
  --sequence ${CC_SEQUENCE} \
  --init-required=$CC_INIT_REQUIRED

# === Org2 批准 ===
echo "✅ Org2 批准链码定义..."
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

peer lifecycle chaincode approveformyorg \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  --channelID $CHANNEL_NAME \
  --name ${CC_NAME} \
  --version ${CC_VERSION} \
  --package-id $PACKAGE_ID \
  --sequence ${CC_SEQUENCE} \
  --init-required=$CC_INIT_REQUIRED

# === Org3 批准 ===
echo "✅ Org3 批准链码定义..."
export CORE_PEER_LOCALMSPID="Org3MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
export CORE_PEER_ADDRESS=localhost:11051

peer lifecycle chaincode approveformyorg \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  --channelID $CHANNEL_NAME \
  --name ${CC_NAME} \
  --version ${CC_VERSION} \
  --package-id $PACKAGE_ID \
  --sequence ${CC_SEQUENCE} \
  --init-required=$CC_INIT_REQUIRED

# === 检查是否满足提交策略（需多数组织批准）===
echo "🔍 检查链码定义是否可提交..."
peer lifecycle chaincode checkcommitreadiness \
  --channelID $CHANNEL_NAME \
  --name ${CC_NAME} \
  --version ${CC_VERSION} \
  --sequence ${CC_SEQUENCE} \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  --output json \
  --init-required=$CC_INIT_REQUIRED

# === 提交链码定义（任一组织均可提交）===
echo "🚀 提交链码定义到通道..."
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode commit \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  --channelID $CHANNEL_NAME \
  --name ${CC_NAME} \
  --version ${CC_VERSION} \
  --sequence ${CC_SEQUENCE} \
  --init-required=$CC_INIT_REQUIRED \
  --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  --peerAddresses localhost:11051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt"

echo "✅ 链码 ${CC_NAME} 已成功部署到通道 ${CHANNEL_NAME}！"

# === （可选）调用 Init 函数（如果需要）===
# 如果你的合约有 init 函数且 CC_INIT_REQUIRED=true，则取消注释以下部分：
# echo "🔧 初始化链码..."
# peer chaincode invoke \
#   -o localhost:7050 \
#   --ordererTLSHostnameOverride orderer.example.com \
#   --tls \
#   --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
#   -C $CHANNEL_NAME \
#   -n ${CC_NAME} \
#   --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
#   --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
#   --peerAddresses localhost:11051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt" \
#   --isInit \
#   -c '{"function":"InitLedger","Args":[]}'