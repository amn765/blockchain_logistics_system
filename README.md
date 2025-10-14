# 物流与资金流转追踪系统

基于联盟链技术的物流与资金流转追踪平台，实现供应链的可追溯性和资金流转的透明化。

## 项目架构

```
supply-chain-tracker/
├── frontend/          # React前端应用
├── backend/           # Node.js后端服务
├── blockchain/        # 联盟链网络配置
├── contracts/         # 智能合约
└── docs/             # 项目文档
```

## 技术栈

### 前端 (Frontend)
- **React 18** - 用户界面框架
- **TypeScript** - 类型安全的JavaScript
- **Material-UI** - UI组件库
- **React Router** - 前端路由管理
- **Axios** - HTTP客户端
- **Web3.js** - 区块链交互库

### 后端 (Backend)
- **Node.js** - JavaScript运行环境
- **Express.js** - Web应用框架
- **MongoDB** - 文档数据库
- **JWT** - 用户认证
- **Socket.io** - 实时通信

### 区块链 (Blockchain)
- **Hyperledger Fabric 2.x** - 企业级联盟链平台
- **Go** - 智能合约开发语言
- **Docker** - 容器化部署
- **Kubernetes** - 容器编排 (可选)

### 智能合约 (Smart Contracts)
- **Chaincode** - Fabric智能合约
- **物流追踪合约** - 记录商品流转信息
- **资金流转合约** - 管理交易和支付记录

### 开发工具
- **Git** - 版本控制
- **Docker Compose** - 本地开发环境
- **Postman** - API测试
- **VS Code** - 代码编辑器

## 核心功能

### 物流追踪
- 商品入库登记
- 物流节点追踪
- 供应链可视化
- 质量追溯

### 资金流转
- 交易记录管理
- 支付状态追踪
- 财务报表生成
- 多方结算

### 用户管理
- 多角色权限控制
- 企业用户注册
- 身份验证

## 快速开始

### 环境要求
- Node.js 16+
- Docker & Docker Compose
- Go 1.19+
- MongoDB

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd supply-chain-tracker
   ```

2. **启动区块链网络**
   ```bash
   cd blockchain
   ./network.sh up
   ```

3. **安装后端依赖**
   ```bash
   cd backend
   npm install
   ```

4. **启动后端服务**
   ```bash
   npm start
   ```

5. **安装前端依赖**
   ```bash
   cd frontend
   npm install
   ```

6. **启动前端应用**
   ```bash
   npm start
   ```

## 部署说明

- 开发环境: 使用Docker Compose进行本地部署
- 生产环境: 使用Kubernetes进行集群部署
- 区块链网络: 支持多组织联盟链部署

## 许可证

本项目采用MIT许可证。
