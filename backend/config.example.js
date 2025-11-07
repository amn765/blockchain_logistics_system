// 配置文件示例
module.exports = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/supplychain'
  },
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'ZJU_2025Fall_SupplyChain_SecretKey',
    expire: process.env.JWT_EXPIRE || '24h'
  },
  fabric: {
    networkPath: process.env.FABRIC_NETWORK_PATH || '../blockchain',
    channel: process.env.FABRIC_CHANNEL || 'supplychainchannel',
    chaincode: process.env.FABRIC_CHAINCODE || 'supplychain',
    org: process.env.FABRIC_ORG || 'manufacturer',
    user: process.env.FABRIC_USER || 'appUser'
  }
};

