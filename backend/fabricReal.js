// backend/fabric-contract-template.js
// 供应链合约模板 - 真实调用链上合约
// submitTransaction: CreateProduct, TransferProduct, CreateTransaction, UpdateLogisticsRecord
// evaluateTransaction: GetAllProducts, ReadProduct

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

class RealFabricContract {
    constructor() {
        this.gateway = null;
        this.contract = null;
        this.connected = false;

        // 配置路径 - 强制使用 Linux 路径格式
        const projectRoot = '/home/anmin/blockchain_project';
        this.networkPath = `${projectRoot}/blockchain_new/test-network`;
        this.connectionProfilePath = `${projectRoot}/blockchain_new/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json`;
        this.walletPath = `${projectRoot}/blockchain_new/test-network/organizations/peerOrganizations/org1.example.com/wallet`;

        console.log('[RealFabricContract] networkPath:', this.networkPath);
        console.log('[RealFabricContract] connectionProfilePath:', this.connectionProfilePath);
        console.log('[RealFabricContract] walletPath:', this.walletPath);
        console.log('[RealFabricContract] 初始化完成');
    }

    /**
     * 连接到 Fabric 网络
     */
    async connect() {
        try {
            console.log('[RealFabricContract] 开始连接到 Fabric 网络...');

            if (!fs.existsSync(this.connectionProfilePath)) {
                throw new Error(`连接配置文件不存在: ${this.connectionProfilePath}`);
            }

            // 创建钱包目录（如果不存在）
            if (!fs.existsSync(this.walletPath)) {
                fs.mkdirSync(this.walletPath, { recursive: true });
                console.log('[RealFabricContract] 创建钱包目录:', this.walletPath);
            }

            const wallet = await Wallets.newFileSystemWallet(this.walletPath);

            // 使用明确的身份标签 'org1-admin'
            const identityLabel = 'org1-admin';
            let identity = await wallet.get(identityLabel);

            if (!identity) {
                console.log(`[RealFabricContract] 钱包中无 '${identityLabel}' 身份，正在导入 Admin 身份...`);
                await this.importAdminIdentity(wallet, identityLabel);
                identity = await wallet.get(identityLabel); // 重新获取确认
            }

            if (!identity) {
                throw new Error(`无法获取身份 '${identityLabel}'，请检查证书导入流程`);
            }

            // 读取并解析连接配置文件为 JSON 对象（关键修复！）
            const ccpBuffer = fs.readFileSync(this.connectionProfilePath);
            const ccp = JSON.parse(ccpBuffer.toString());

            // 创建网关并连接
            this.gateway = new Gateway();

            const connectionOptions = {
                wallet: wallet,
                identity: identityLabel,
                discovery: {
                    enabled: true,   // 启用服务发现（推荐）
                    asLocalhost: true // 本地开发环境
                }
            };

            await this.gateway.connect(ccp, connectionOptions);

            // 获取网络和合约
            const network = await this.gateway.getNetwork('channel1');
            this.contract = network.getContract('supplychain');

            this.connected = true;
            console.log('[RealFabricContract] ✅ 成功连接到 Fabric 网络');

        } catch (error) {
            console.error('[RealFabricContract] ❌ 连接失败:', error.message);
            this.connected = false;
            throw error;
        }
    }

    /**
     * 导入 Admin 身份到钱包（接收 wallet 实例和标签）
     */
    async importAdminIdentity(wallet, identityLabel) {
        try {
            console.log('[RealFabricContract] 导入 Admin 身份到钱包...');

            const adminUserDir = `${this.networkPath}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com`;
            const certDir = `${adminUserDir}/msp/signcerts`;
            const keyDir = `${adminUserDir}/msp/keystore`;

            if (!fs.existsSync(certDir)) {
                throw new Error(`证书目录不存在: ${certDir}`);
            }
            if (!fs.existsSync(keyDir)) {
                throw new Error(`私钥目录不存在: ${keyDir}`);
            }

            const certFiles = fs.readdirSync(certDir);
            const keyFiles = fs.readdirSync(keyDir);

            if (certFiles.length === 0) {
                throw new Error('signcerts 目录中未找到证书文件');
            }
            if (keyFiles.length === 0) {
                throw new Error('keystore 目录中未找到私钥文件');
            }

            // 通常只有一个文件，取第一个
            const certPath = path.join(certDir, certFiles[0]);
            const keyPath = path.join(keyDir, keyFiles[0]);

            console.log('[RealFabricContract] 使用证书文件:', certPath);
            console.log('[RealFabricContract] 使用私钥文件:', keyPath);

            const certificate = fs.readFileSync(certPath, 'utf8');
            const privateKey = fs.readFileSync(keyPath, 'utf8');

            const identity = {
                credentials: {
                    certificate: certificate,
                    privateKey: privateKey,
                },
                mspId: 'Org1MSP',
                type: 'X.509',
            };

            await wallet.put(identityLabel, identity);
            console.log('[RealFabricContract] ✅ Admin 身份导入成功');

        } catch (error) {
            console.error('[RealFabricContract] ❌ Admin 身份导入失败:', error.message);
            throw error;
        }
    }

    /**
     * 断开连接
     */
    async disconnect() {
        try {
            if (this.gateway) {
                this.gateway.disconnect();
                this.gateway = null;
                this.contract = null;
                this.connected = false;
                console.log('[RealFabricContract] ✅ 连接已断开');
            }
        } catch (error) {
            console.error('[RealFabricContract] ❌ 断开连接失败:', error.message);
        }
    }

    /**
     * 提交交易到区块链
     */
    async submitTransaction(functionName, ...args) {
        try {
            if (!this.connected || !this.contract) {
                throw new Error('Fabric 客户端未连接，请先调用 connect()');
            }

            console.log(`[RealFabricContract] submitTransaction: ${functionName}(${args.map(arg => JSON.stringify(arg)).join(', ')})`);

            let resultBuffer;
            switch (functionName) {
                case 'CreateProduct':
                    resultBuffer = await this.contract.submitTransaction('CreateProduct', ...args);
                    console.log(`[RealFabricContract] ✅ CreateProduct 执行成功`);
                    break;
                case 'TransferProduct':
                    resultBuffer = await this.contract.submitTransaction('TransferProduct', ...args);
                    console.log(`[RealFabricContract] ✅ TransferProduct 执行成功`);
                    break;
                case 'CreateTransaction':
                    resultBuffer = await this.contract.submitTransaction('CreateTransaction', ...args);
                    console.log(`[RealFabricContract] ✅ CreateTransaction 执行成功`);
                    break;
                case 'UpdateLogisticsRecord':
                    resultBuffer = await this.contract.submitTransaction('UpdateLogisticsRecord', ...args);
                    console.log(`[RealFabricContract] ✅ UpdateLogisticsRecord 执行成功`);
                    break;
                default:
                    throw new Error(`[RealFabricContract] 不支持的函数: ${functionName}`);
            }

            return resultBuffer;

        } catch (error) {
            console.error(`[RealFabricContract] ❌ submitTransaction ${functionName} 失败:`, error.message);
            throw error;
        }
    }
}

// 创建并导出单例实例
const contract = new RealFabricContract();
module.exports = contract;