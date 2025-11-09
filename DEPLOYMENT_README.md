# 区块链供应链系统部署指南

## 📋 概述

本项目包含了一个完整的 Hyperledger Fabric 供应链管理系统，包括：

- ✅ **智能合约**: Go 语言编写的供应链链码
- ✅ **测试脚本**: 完整的测试套件（11个测试用例）
- ✅ **网络环境**: 3组织区块链网络配置（Org1、Org2、Org3）
- ✅ **部署脚本**: 自动化的链码部署工具
- ✅ **前后端应用**: React前端 + Node.js后端API

## 🚀 快速开始

### 1. 下载获得fabric-samples文件夹

```bash
mkdir fabric-samples && cd fabric-samples

curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/bootstrap.sh

chmod +x bootstrap.sh
./bootstrap.sh 2.5.9 1.5.5

cd ..
mv fabric-samples blockchain_new
```

### 2. 启动区块链网络

```bash
cd blockchain_new/test-network
./network.sh up createChannel -c channel1
cd addOrg3
./addOrg3.sh up -c channel1
cd ../../..
```

### 3. 部署供应链链码

```bash
# 设置Fabric环境变量
export PATH="$PATH:$(pwd)/bin:$(pwd)/blockchain_new/bin"
export FABRIC_CFG_PATH="$(pwd)/config"

# 运行部署脚本
./deploy-supplychain.sh
```

脚本会自动完成链码的打包、安装、批准和提交过程。

### 4. 运行功能测试

```bash
./test-supplychain-functions.sh
```

### 5. 启动应用服务（可选）

```bash
# 启动后端API服务
cd backend
npm install
npm start

# 启动前端应用
cd ../frontend
npm install
npm run dev
```

## 📁 项目结构

```
blockchain_project/
├── contracts/                      # 智能合约源码
│   ├── supplychain.go             # 主链码文件
│   ├── go.mod                     # Go 模块定义
│   ├── go.sum                     # Go 依赖校验文件
│   ├── vendor/                    # 依赖包
│   └── README.md                  # 合约说明文档
├── bin/                           # Fabric 二进制文件
├── config/                        # Fabric 配置文件
├── blockchain_new/                # Fabric 示例和工具
│   ├── test-network/              # 网络配置和脚本
│   ├── bin/                       # Fabric CLI 工具
│   └── config/                    # 网络配置文件
├── organizations/                 # 组织证书和配置
├── deploy-supplychain-qwen.sh     # 完整自动化部署脚本
├── deploy-supplychain-simple.sh   # 简化打包脚本
├── test-supplychain-functions.sh  # 功能测试脚本
├── backend/                       # Node.js 后端API
│   ├── routes/                    # API 路由
│   ├── models/                    # 数据模型
│   └── server.js                  # 服务器入口
├── frontend/                      # React 前端应用
│   ├── src/                       # 源代码
│   └── public/                    # 静态资源
└── DEPLOYMENT_README.md           # 本文档
```

## 🔧 脚本功能

### deploy-supplychain-qwen.sh
- ✅ 自动化链码部署流程
- ✅ 自动打包、安装、批准和提交
- ✅ 支持多组织环境（Org1、Org2、Org3）
- ✅ 错误处理和状态反馈

### deploy-supplychain-simple.sh
- ✅ 检查前提条件和网络状态
- ✅ 打包链码并生成部署包
- ✅ 提供手动部署指令和步骤

### test-supplychain-functions.sh
- ✅ 自动检测链码部署状态
- ✅ 执行11个完整功能测试用例
- ✅ 验证所有供应链核心功能

## 📊 供应链功能特性

### 产品管理
- 创建产品记录
- 查询产品信息
- 更新产品状态
- 转移产品所有权

### 交易管理
- 创建交易记录
- 更新交易状态
- 按条件查询交易

### 数据追溯
- 完整的产品历史记录
- 物流跟踪信息
- 所有操作的审计日志

## 🎯 部署验证

部署成功后，您应该看到：

1. **网络状态**:
   ```bash
   docker ps --filter "name=peer\|orderer" --format "{{.Names}}"
   # 应该显示4个容器
   ```

2. **链码状态**:
   ```bash
   cd blockchain_new/test-network
   ./network.sh cc list -c channel1
   # 应该显示 supplychain 已提交
   ```

3. **测试结果**:
   ```bash
   cd /path/to/blockchain_project
   ./test-supplychain-functions.sh
   # 应该显示 "总计: 11 ✅ 通过: 11 ❌ 失败: 0"
   ```

## 🔧 故障排除

### 网络无法启动
```bash
# 清理并重新启动
cd blockchain_new/test-network
./network.sh down
./network.sh up createChannel -c channel1
```

### 链码部署失败
```bash
# 方法1：使用自动化部署脚本
cd /path/to/blockchain_project
export PATH="$PATH:$(pwd)/bin:$(pwd)/blockchain_new/bin"
export FABRIC_CFG_PATH="$(pwd)/config"
./deploy-supplychain-qwen.sh

# 方法2：使用简化脚本重新打包
./deploy-supplychain-simple.sh
# 然后按照输出的指令手动部署
```

### 测试失败
```bash
# 检查链码是否正确部署
cd blockchain_new/test-network
./network.sh cc list -c channel1
```

## 📈 业务价值

这个供应链区块链系统提供了：

- **透明度**: 所有参与方可以实时查看产品状态
- **不可篡改**: 区块链保证数据完整性
- **自动化**: 智能合约自动执行业务逻辑
- **可追溯**: 完整的产品生命周期记录
- **信任建立**: 消除信息不对称

## 🎉 总结

### 推荐部署流程：

1. **快速部署**：运行 `./deploy-supplychain-qwen.sh` 实现一键自动化部署
2. **完整验证**：运行 `./test-supplychain-functions.sh` 验证所有功能
3. **应用启动**：启动前后端应用体验完整功能

### 脚本选择指南：

- **新手推荐**：`./deploy-supplychain-qwen.sh` - 全自动部署，无需手动干预
- **学习用途**：`./deploy-supplychain-simple.sh` - 了解每个部署步骤
- **开发调试**：`./test-supplychain-functions.sh` - 详细的功能验证

这套系统为供应链管理提供了区块链技术的完整解决方案，包括智能合约、自动化测试、多组织网络配置和完整的前后端应用！
