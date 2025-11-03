// src/services/blockchain.ts
// 这里只是示例占位。实际与 Hyperledger Fabric 通信一般由后端 Gateway/REST 提供。
// 如果你有链上 REST 接口，可以在 api/http.ts 中调用后端，再由后端调用 Fabric。
import Web3 from "web3";

const web3 = new Web3(); // 默认不连接。仅示例。

export const chain = {
  getTx: async (txHash: string) => {
    // 如果你使用 Fabric 的 REST gateway，请在后端实现并通过 axios 调用
    // 这里只是示例返回空
    return { txHash, status: "unknown" };
  },
  // 如果需要本地示例：web3.eth.getTransaction(txHash) ...
};

