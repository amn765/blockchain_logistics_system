# 快速开始指南

## 系统要求

- **Go**: 1.18 或更高版本（推荐 1.19+）
- **Hyperledger Fabric**: 2.5.x
- **Docker**: 已安装并运行

## 快速部署步骤

### 1. 检查 Go 版本

```bash
go version
```

如果版本低于 1.18，请升级 Go：
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install golang-go

# 或从官网下载最新版本
# https://go.dev/dl/
```

### 2. 安装依赖

```bash
cd blockchain_project/contracts
go mod download
```

如果遇到版本问题，可以尝试：
```bash
go mod tidy
go get -u ./...
```

### 3. 验证编译

```bash
go build -o supplychain
```

如果编译成功，会生成 `supplychain` 可执行文件（虽然链码不需要这个文件，但可以验证代码正确性）。

### 4. 确保网络运行

```bash
cd ../blockchain_new
./scripts/network.sh up
```

### 5. 创建通道（如果尚未创建）

```bash
./scripts/createChannel.sh supplychainchannel
```

### 6. 部署链码

```bash
./scripts/deployChaincode.sh supplychain ../contracts go 1.0 1 InitLedger
```

## 常见问题

### Q: go mod tidy 失败，提示需要 Go 1.19
**A**: 升级 Go 到 1.19 或更高版本，或者修改 `go.mod` 中的版本号（但可能遇到兼容性问题）。

### Q: 链码编译失败
**A**: 
1. 检查 Go 版本
2. 运行 `go mod tidy` 更新依赖
3. 检查代码语法错误

### Q: 链码部署失败
**A**:
1. 检查网络是否运行：`docker ps`
2. 检查通道是否创建
3. 检查路径是否正确
4. 查看 peer 日志：`docker logs peer0.manufacturer.supplychain.com`

### Q: 如何更新链码？
**A**: 修改代码后，使用新的版本号和序列号重新部署：
```bash
./scripts/deployChaincode.sh supplychain ../contracts go 1.1 2 InitLedger
```

## 测试链码

部署成功后，可以使用以下命令测试：

```bash
# 设置环境变量（在 blockchain 目录下）
export CORE_PEER_LOCALMSPID=ManufacturerMSP
export CORE_PEER_ADDRESS=peer0.manufacturer.supplychain.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=./organizations/peerOrganizations/manufacturer.supplychain.com/peers/peer0.manufacturer.supplychain.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=./organizations/peerOrganizations/manufacturer.supplychain.com/users/Admin@manufacturer.supplychain.com/msp
export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=./organizations/ordererOrganizations/supplychain.com/orderers/orderer.supplychain.com/tls/ca.crt

# 查询所有产品
peer chaincode query -C supplychainchannel -n supplychain -c '{"function":"GetAllProducts","Args":[]}'
```

## 下一步

- 查看 `README.md` 了解链码功能
- 查看 `DEPLOYMENT.md` 了解详细部署步骤
- 查看链码代码了解如何使用底层 API

