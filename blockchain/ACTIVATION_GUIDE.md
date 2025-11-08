# Fabric网络激活指南

本文档详细说明如何激活项目中的Hyperledger Fabric网络。

## 前置要求

在开始之前，请确保已安装以下工具：

### 1. Docker 和 Docker Compose
```bash
docker --version
docker-compose --version
```

如果未安装，请参考：
- Docker: https://docs.docker.com/get-docker/
- Docker Compose: https://docs.docker.com/compose/install/

### 2. Hyperledger Fabric 二进制文件

下载Fabric二进制文件（v2.5）并放置在项目根目录的 `bin` 目录中：

```bash
# 在项目根目录执行
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0 1.5.0
```

这将在项目根目录创建 `bin` 目录，包含以下工具：
- `configtxgen` - 生成通道配置
- `cryptogen` - 生成证书（如果使用）
- `peer` - Peer节点命令
- `orderer` - Orderer节点命令

**注意**：如果项目已经有 `fabric-samples/bin` 目录，可以创建符号链接：
```bash
cd blockchain_project
ln -s fabric-samples/bin bin
```

### 3. Go 语言（用于链码开发）
```bash
go version  # 应该是 1.19 或更高版本
```

### 4. jq（用于JSON解析）
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq
```

## 激活步骤

### 步骤 1: 进入blockchain目录

```bash
cd blockchain_project/blockchain
```

### 步骤 2: 确保脚本有执行权限

```bash
chmod +x scripts/*.sh
```

### 步骤 3: 检查环境变量和配置

确保以下环境变量已正确设置（脚本会自动处理，但可以手动检查）：

```bash
# 查看环境变量配置
cat scripts/envVar.sh
```

### 步骤 4: 启动网络

使用 `network.sh` 脚本启动网络：

```bash
./scripts/network.sh up
```

这个命令会：
1. ✅ 检查前置要求（Docker、Fabric工具等）
2. ✅ 检查并分配端口（如果端口被占用会自动寻找可用端口）
3. ✅ 生成证书（如果不存在）
4. ✅ 生成创世区块（如果不存在）
5. ✅ 生成通道配置（如果不存在）
6. ✅ 启动所有Docker容器（Orderer + 3个Peer节点）

**预期输出**：
```
INFO: Starting the network...
INFO: Checking port availability...
INFO: Generating certificates using cryptogen...
SUCCESS: Certificates generated successfully
INFO: Generating genesis block...
SUCCESS: Genesis block generated successfully
INFO: Generating channel configuration transaction...
SUCCESS: Channel configuration transaction generated successfully
INFO: Starting Docker containers...
SUCCESS: Network started successfully
```

### 步骤 5: 验证网络状态

检查容器是否正常运行：

```bash
# 查看网络状态
./scripts/network.sh status

# 或者使用docker命令
docker ps --filter "name=supplychain"
```

应该看到以下容器在运行：
- `orderer.supplychain.com`
- `peer0.manufacturer.supplychain.com`
- `peer0.logistics.supplychain.com`
- `peer0.retailer.supplychain.com`

### 步骤 6: 创建通道

创建名为 `supplychainchannel` 的通道：

```bash
./scripts/createChannel.sh supplychainchannel
```

### 步骤 7: 部署链码

部署供应链链码：

```bash
./scripts/deployChaincode.sh supplychain ../contracts go 1.0 1 InitLedger
```

参数说明：
- `supplychain` - 链码名称
- `../contracts` - 链码源代码路径
- `go` - 链码语言
- `1.0` - 链码版本
- `1` - 序列号
- `InitLedger` - 初始化函数名

### 步骤 8: 生成连接配置文件（可选）

为SDK生成连接配置文件：

```bash
./scripts/generateConnectionProfiles.sh
```

这将在以下位置创建连接配置文件：
- `organizations/peerOrganizations/manufacturer.supplychain.com/connection-manufacturer.json`
- `organizations/peerOrganizations/logistics.supplychain.com/connection-logistics.json`
- `organizations/peerOrganizations/retailer.supplychain.com/connection-retailer.json`

## 快速启动（一键启动）

如果你想一次性完成所有步骤，可以使用以下命令序列：

```bash
cd blockchain_project/blockchain

# 1. 确保脚本可执行
chmod +x scripts/*.sh

# 2. 启动网络
./scripts/network.sh up

# 3. 等待网络就绪（约10-15秒）
sleep 15

# 4. 创建通道
./scripts/createChannel.sh supplychainchannel

# 5. 部署链码
./scripts/deployChaincode.sh supplychain ../contracts go 1.0 1 InitLedger

# 6. 生成连接配置
./scripts/generateConnectionProfiles.sh
```

## 网络管理命令

### 查看网络状态
```bash
./scripts/network.sh status
```

### 停止网络
```bash
./scripts/network.sh down
```

### 停止网络并删除卷（清理数据）
```bash
./scripts/network.sh down -v
```

### 完全清理（删除所有容器、镜像和生成的文件）
```bash
./scripts/network.sh clean
```

⚠️ **警告**：`clean` 命令会删除所有证书、配置文件和Docker容器/镜像。

## 故障排查

### 问题 1: 端口被占用

如果遇到端口占用问题，脚本会自动寻找可用端口。检查 `.env` 文件查看实际使用的端口：

```bash
cat .env
```

### 问题 2: 证书生成失败

确保 `cryptogen` 工具在PATH中：
```bash
which cryptogen
# 如果找不到，确保 bin 目录在PATH中
export PATH=$PATH:$(pwd)/../bin
```

### 问题 3: Docker容器启动失败

查看容器日志：
```bash
docker logs orderer.supplychain.com
docker logs peer0.manufacturer.supplychain.com
docker logs peer0.logistics.supplychain.com
docker logs peer0.retailer.supplychain.com
```

### 问题 4: 通道创建失败

确保所有容器都在运行：
```bash
docker ps --filter "name=supplychain"
```

检查通道配置是否存在：
```bash
ls -la channel-artifacts/
```

### 问题 5: 链码部署失败

检查链码源代码路径是否正确：
```bash
ls -la ../contracts/
```

确保链码文件存在且可编译。

## 网络组件信息

### 组织（Organizations）
- **OrdererMSP**: Orderer组织
- **ManufacturerMSP**: 制造商Peer组织
- **LogisticsMSP**: 物流Peer组织
- **RetailerMSP**: 零售商Peer组织

### Peer节点
- `peer0.manufacturer.supplychain.com:7051` (默认端口)
- `peer0.logistics.supplychain.com:9051` (默认端口)
- `peer0.retailer.supplychain.com:11051` (默认端口)

### Orderer节点
- `orderer.supplychain.com:7050` (默认端口)

### 通道
- `supplychainchannel`

## 验证网络是否正常工作

运行以下命令验证网络：

```bash
# 1. 检查所有容器状态
docker ps --filter "name=supplychain"

# 2. 检查Orderer日志（应该没有错误）
docker logs orderer.supplychain.com | tail -20

# 3. 检查Peer日志（应该没有错误）
docker logs peer0.manufacturer.supplychain.com | tail -20

# 4. 检查通道是否创建成功
docker exec peer0.manufacturer.supplychain.com peer channel list
```

## 下一步

网络激活成功后，你可以：

1. **启动后端服务**：
   ```bash
   cd ../backend
   npm install
   npm start
   ```

2. **启动前端应用**：
   ```bash
   cd ../frontend
   npm install
   npm start
   ```

3. **测试链码功能**：使用Fabric CLI或SDK调用链码函数

## 注意事项

- 所有脚本必须在 `blockchain` 目录下执行
- 确保Docker服务正在运行
- 首次启动可能需要几分钟时间来下载Docker镜像
- 如果修改了配置文件，可能需要清理并重新生成网络
- 生产环境部署时，请修改默认端口和安全配置

