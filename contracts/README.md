# Supply Chain Chaincode

供应链链码项目，使用 Go 语言编写，基于 Hyperledger Fabric。

## 技术栈

- **fabric-chaincode-go**: Fabric 官方最原始、最底层的 Go 语言 Chaincode 开发库
- **fabric-contract-api-go**: 基于 fabric-chaincode-go 的高层抽象，提供更简洁、更面向对象的开发模式

## 项目结构

```
contracts/
├── supplychain.go    # 主链码文件
├── go.mod           # Go 模块依赖文件
└── README.md        # 项目说明文档
```

## 功能特性

### 1. 产品管理
- `CreateProduct`: 创建新产品
- `ReadProduct`: 读取产品信息
- `TransferProduct`: 转移产品所有权
- `GetAllProducts`: 获取所有产品
- `QueryProductsByOwner`: 按所有者查询产品
- `GetHistoryForProduct`: 获取产品历史记录

### 2. 交易管理
- `CreateTransaction`: 创建金融交易
- `CompleteTransaction`: 完成交易
- `ReadTransaction`: 读取交易信息

### 3. 物流管理
- `UpdateLogisticsRecord`: 更新物流记录
- `GetLogisticsHistory`: 获取产品物流历史

## 底层 API 使用示例

本链码展示了如何使用 `fabric-chaincode-go` 的底层 API：

1. **GetTxID()**: 获取交易 ID
2. **GetTxTimestamp()**: 获取交易时间戳
3. **GetStateByRange()**: 范围查询
4. **GetQueryResult()**: CouchDB 富查询
5. **GetHistoryForKey()**: 获取键的历史记录
6. **SetEvent()**: 设置链码事件
7. **PutState()**: 写入状态
8. **GetState()**: 读取状态

## 安装依赖

```bash
cd contracts
go mod tidy
```

## 构建链码

```bash
go build -o supplychain
```

## 部署链码

使用项目提供的部署脚本：

```bash
cd blockchain
./scripts/deployChaincode.sh supplychain ../contracts go 1.0 1 InitLedger
```

参数说明：
- `supplychain`: 链码名称
- `../contracts`: 链码源码路径
- `go`: 链码语言
- `1.0`: 链码版本
- `1`: 序列号
- `InitLedger`: 初始化函数名

## 调用链码

### 创建产品
```bash
peer chaincode invoke -C supplychainchannel -n supplychain -c '{"function":"CreateProduct","Args":["product3","新产品","产品描述","manufacturer","150.0"]}'
```

### 查询产品
```bash
peer chaincode query -C supplychainchannel -n supplychain -c '{"function":"ReadProduct","Args":["product1"]}'
```

### 转移产品
```bash
peer chaincode invoke -C supplychainchannel -n supplychain -c '{"function":"TransferProduct","Args":["product1","logistics"]}'
```

### 创建交易
```bash
peer chaincode invoke -C supplychainchannel -n supplychain -c '{"function":"CreateTransaction","Args":["tx1","product1","manufacturer","logistics","100.0","USD"]}'
```

### 更新物流记录
```bash
peer chaincode invoke -C supplychainchannel -n supplychain -c '{"function":"UpdateLogisticsRecord","Args":["log1","product1","北京仓库","运输中","张三","正在运输"]}'
```

## 事件监听

链码会发出以下事件：
- `ProductCreated`: 产品创建
- `ProductTransferred`: 产品转移
- `TransactionCreated`: 交易创建
- `TransactionCompleted`: 交易完成
- `LogisticsUpdated`: 物流更新

## 注意事项

1. 确保 Go 版本 >= 1.19
2. 确保网络已启动并创建了通道
3. 链码需要在所有组织的 peer 节点上安装
4. 使用 CouchDB 作为状态数据库以支持富查询

