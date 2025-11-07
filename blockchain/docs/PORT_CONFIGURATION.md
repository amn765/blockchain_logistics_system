# 动态端口配置指南

## 概述

为了避免端口冲突，现在所有端口都通过环境变量配置，支持动态分配和自动检测。

## 快速开始

### 1. 创建 .env 文件

```bash
cd blockchain
cp .env.example .env
```

### 2. 检查端口可用性

```bash
./scripts/checkPorts.sh
```

这会检查所有端口是否可用，如果端口被占用，会自动寻找可用端口。

### 3. 启动网络

```bash
./scripts/network.sh up
```

启动时会自动检查端口，如果发现冲突会自动分配可用端口。

## 端口配置方式

### 方式1：使用 .env 文件（推荐）

编辑 `blockchain/.env` 文件：

```bash
# Orderer port
ORDERER_PORT=7050

# Manufacturer organization ports
MANUFACTURER_PEER_PORT=7051
MANUFACTURER_CHAINCODE_PORT=7052

# Logistics organization ports
LOGISTICS_PEER_PORT=9051
LOGISTICS_CHAINCODE_PORT=9052

# Retailer organization ports
RETAILER_PEER_PORT=11051
RETAILER_CHAINCODE_PORT=11052
```

### 方式2：自动检测和分配

如果端口被占用，脚本会自动寻找可用端口：

```bash
./scripts/checkPorts.sh
```

### 方式3：环境变量

也可以直接设置环境变量：

```bash
export ORDERER_PORT=8000
export MANUFACTURER_PEER_PORT=8001
./scripts/network.sh up
```

## 端口冲突处理

### 自动处理

当运行 `./scripts/network.sh up` 时：
1. 自动检查所有端口是否可用
2. 如果端口被占用，自动寻找可用端口
3. 将新端口保存到 `.env` 文件

### 手动处理

1. **检查端口占用**：
   ```bash
   ./scripts/checkPorts.sh
   ```

2. **修改 .env 文件**：
   ```bash
   # 编辑 .env 文件，修改端口号
   nano .env
   ```

3. **查看端口占用情况**：
   ```bash
   # Linux/Mac
   lsof -i :7050
   netstat -tuln | grep 7050
   
   # Windows
   netstat -ano | findstr :7050
   ```

## 文件说明

### `.env.example`
- 端口配置模板文件
- 包含所有默认端口配置
- 复制为 `.env` 后可以自定义修改

### `scripts/portUtils.sh`
- 端口管理工具函数
- 提供端口检测、分配等功能

### `scripts/checkPorts.sh`
- 端口检查脚本
- 检查所有端口可用性
- 显示当前端口配置

### `docker-compose.yml`
- 使用环境变量 `${PORT_NAME:-default}` 格式
- 支持从 `.env` 文件读取端口配置
- 如果 `.env` 不存在，使用默认值

## 默认端口

| 服务 | 默认端口 | 环境变量 |
|------|---------|---------|
| Orderer | 7050 | `ORDERER_PORT` |
| Manufacturer Peer | 7051 | `MANUFACTURER_PEER_PORT` |
| Manufacturer Chaincode | 7052 | `MANUFACTURER_CHAINCODE_PORT` |
| Logistics Peer | 9051 | `LOGISTICS_PEER_PORT` |
| Logistics Chaincode | 9052 | `LOGISTICS_CHAINCODE_PORT` |
| Retailer Peer | 11051 | `RETAILER_PEER_PORT` |
| Retailer Chaincode | 11052 | `RETAILER_CHAINCODE_PORT` |

## 添加新节点时的端口配置

使用 `addPeer.sh` 脚本添加新节点时，会自动分配端口：

```bash
# 自动分配端口
./scripts/addPeer.sh Distributor 0

# 指定端口
./scripts/addPeer.sh Distributor 0 12051
```

脚本会：
1. 检查指定端口是否可用
2. 如果不可用，自动寻找可用端口
3. 分配链码端口（peer_port + 1）

## 注意事项

1. **.env 文件不应提交到 Git**
   - 已在 `.gitignore` 中排除
   - 每个环境可以有不同的端口配置

2. **端口范围**
   - 默认范围：7000-13000
   - 可在 `.env` 中修改 `PORT_START` 和 `PORT_END`

3. **Docker Compose 环境变量**
   - Docker Compose 会自动读取 `.env` 文件
   - 环境变量优先级：命令行 > .env 文件 > 默认值

4. **端口冲突检测**
   - 检测系统端口占用
   - 检测 Docker 容器端口占用
   - 支持多种检测方式（netstat/ss/lsof）

## 故障排查

### 端口仍被占用

1. 检查是否有其他 Fabric 网络在运行：
   ```bash
   docker ps | grep fabric
   ```

2. 停止冲突的服务：
   ```bash
   docker-compose down
   ```

3. 手动修改 `.env` 文件使用其他端口

### 端口检测失败

如果端口检测工具不可用，可以：
1. 手动检查端口
2. 直接修改 `.env` 文件
3. 使用环境变量覆盖

## 示例

### 示例1：使用自定义端口

```bash
# 1. 创建 .env 文件
cat > .env <<EOF
ORDERER_PORT=8000
MANUFACTURER_PEER_PORT=8001
MANUFACTURER_CHAINCODE_PORT=8002
LOGISTICS_PEER_PORT=9001
LOGISTICS_CHAINCODE_PORT=9002
RETAILER_PEER_PORT=10001
RETAILER_CHAINCODE_PORT=10002
EOF

# 2. 检查端口
./scripts/checkPorts.sh

# 3. 启动网络
./scripts/network.sh up
```

### 示例2：自动处理端口冲突

```bash
# 直接启动，自动处理冲突
./scripts/network.sh up

# 如果端口被占用，脚本会：
# 1. 检测冲突
# 2. 自动分配新端口
# 3. 保存到 .env 文件
# 4. 继续启动
```

## 总结

✅ **端口不再写死** - 全部使用环境变量  
✅ **自动冲突检测** - 启动时自动检查  
✅ **自动端口分配** - 冲突时自动寻找可用端口  
✅ **灵活配置** - 支持 .env 文件和环境变量  
✅ **向后兼容** - 不配置时使用默认端口

