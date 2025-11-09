# 链码部署指南

## 前置条件

1. **网络已启动**
   ```bash
   cd blockchain_project/blockchain
   ./scripts/network.sh up
   ```

2. **通道已创建**
   ```bash
   ./scripts/createChannel.sh supplychainchannel
   ```

3. **Go 环境已配置**
   ```bash
   go version  # 需要 >= 1.19
   ```

## 步骤 1: 安装依赖

```bash
cd blockchain_project/contracts
go mod tidy
```

这将下载以下依赖：
- `github.com/hyperledger/fabric-chaincode-go`
- `github.com/hyperledger/fabric-contract-api-go`

## 步骤 2: 验证链码编译

```bash
go build -o supplychain
```

如果编译成功，说明链码代码没有问题。

## 步骤 3: 部署链码

```bash
cd ../blockchain
./scripts/deployChaincode.sh supplychain ../contracts go 1.0 1 InitLedger
```

参数说明：
- `supplychain`: 链码名称
- `../contracts`: 链码源码路径（相对于 blockchain 目录）
- `go`: 链码语言
- `1.0`: 链码版本
- `1`: 序列号（每次更新链码需要递增）
- `InitLedger`: 初始化函数名

## 步骤 4: 测试链码

### 查询所有产品（初始化后的数据）
```bash
# 设置环境变量
export CORE_PEER_LOCALMSPID=ManufacturerMSP
export CORE_PEER_ADDRESS=peer0.manufacturer.supplychain.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=./organizations/peerOrganizations/manufacturer.supplychain.com/peers/peer0.manufacturer.supplychain.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=./organizations/peerOrganizations/manufacturer.supplychain.com/users/Admin@manufacturer.supplychain.com/msp
export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=./organizations/ordererOrganizations/supplychain.com/orderers/orderer.supplychain.com/tls/ca.crt

# 查询所有产品
peer chaincode query -C supplychainchannel -n supplychain -c '{"function":"GetAllProducts","Args":[]}'
```

### 创建新产品
```bash
peer chaincode invoke -C supplychainchannel -n supplychain \
  --peerAddresses peer0.manufacturer.supplychain.com:7051 \
  --tlsRootCertFiles ./organizations/peerOrganizations/manufacturer.supplychain.com/peers/peer0.manufacturer.supplychain.com/tls/ca.crt \
  -c '{"function":"CreateProduct","Args":["product3","新产品","产品描述","manufacturer","150.0"]}'
```

### 查询单个产品
```bash
peer chaincode query -C supplychainchannel -n supplychain -c '{"function":"ReadProduct","Args":["product1"]}'
```

### 转移产品所有权
```bash
peer chaincode invoke -C supplychainchannel -n supplychain \
  --peerAddresses peer0.manufacturer.supplychain.com:7051 \
  --tlsRootCertFiles ./organizations/peerOrganizations/manufacturer.supplychain.com/peers/peer0.manufacturer.supplychain.com/tls/ca.crt \
  -c '{"function":"TransferProduct","Args":["product1","logistics"]}'
```

### 创建交易
```bash
peer chaincode invoke -C supplychainchannel -n supplychain \
  --peerAddresses peer0.manufacturer.supplychain.com:7051 \
  --tlsRootCertFiles ./organizations/peerOrganizations/manufacturer.supplychain.com/peers/peer0.manufacturer.supplychain.com/tls/ca.crt \
  -c '{"function":"CreateTransaction","Args":["tx1","product1","manufacturer","logistics","100.0","USD"]}'
```

### 更新物流记录
```bash
peer chaincode invoke -C supplychainchannel -n supplychain \
  --peerAddresses peer0.logistics.supplychain.com:9051 \
  --tlsRootCertFiles ./organizations/peerOrganizations/logistics.supplychain.com/peers/peer0.logistics.supplychain.com/tls/ca.crt \
  -c '{"function":"UpdateLogisticsRecord","Args":["log1","product1","北京仓库","运输中","张三","正在运输"]}'
```

### 查询物流历史
```bash
peer chaincode query -C supplychainchannel -n supplychain -c '{"function":"GetLogisticsHistory","Args":["product1"]}'
```

### 查询产品历史
```bash
peer chaincode query -C supplychainchannel -n supplychain -c '{"function":"GetHistoryForProduct","Args":["product1"]}'
```

## 底层 API 使用说明

本链码展示了如何使用 `fabric-chaincode-go` 的底层 API：

### 1. 获取交易信息
```go
txID := ctx.GetStub().GetTxID()
timestamp := ctx.GetStub().GetTxTimestamp()
```

### 2. 状态操作
```go
// 写入状态
ctx.GetStub().PutState(key, value)

// 读取状态
value, err := ctx.GetStub().GetState(key)
```

### 3. 范围查询
```go
resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
defer resultsIterator.Close()
```

### 4. CouchDB 富查询
```go
queryString := `{"selector": {"owner": "manufacturer"}}`
resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
```

### 5. 历史记录查询
```go
historyIterator, err := ctx.GetStub().GetHistoryForKey(key)
defer historyIterator.Close()
```

### 6. 设置事件
```go
err := ctx.GetStub().SetEvent("EventName", []byte("event data"))
```

## 故障排查

### 1. 链码编译失败
- 检查 Go 版本：`go version`
- 检查依赖：`go mod tidy`
- 检查代码语法错误

### 2. 链码安装失败
- 检查网络是否运行：`docker ps`
- 检查路径是否正确
- 检查证书是否存在

### 3. 链码调用失败
- 检查通道是否创建
- 检查链码是否已提交
- 检查参数格式是否正确
- 查看 peer 日志：`docker logs peer0.manufacturer.supplychain.com`

### 4. 查询返回空结果
- 检查数据是否已初始化
- 检查键名是否正确
- 检查 CouchDB 索引（如果使用富查询）

## 更新链码

如果需要更新链码：

1. 修改链码代码
2. 重新编译验证
3. 使用新的序列号部署：
   ```bash
   ./scripts/deployChaincode.sh supplychain ../contracts go 1.1 2 InitLedger
   ```
   注意：版本号（1.1）和序列号（2）都需要更新

## 注意事项

1. **事件监听**: 链码会发出事件，可以通过 SDK 监听这些事件
2. **CouchDB 索引**: 如果使用富查询，建议创建索引以提高性能
3. **状态键命名**: 使用前缀区分不同类型的数据（如 `tx_`、`log_`）
4. **错误处理**: 所有方法都应该返回适当的错误信息
5. **事务性**: 确保相关操作在同一个事务中完成

