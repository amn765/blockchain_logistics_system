// backend/fabricMock.js
// 这是一个模拟的 Fabric Contract 对象
// 它模仿 submitTransaction 和 evaluateTransaction 的行为

const contract = {
    /**
     * 模拟查询交易 (例如 GetAllProducts)
     * @param {string} functionName 调用的链码函数名
     * @returns {Promise<Buffer>} 返回一个 Buffer，就像真实的 Fabric SDK 一样
     */
    evaluateTransaction: async (functionName, ...args) => {
        console.log(`[FabricMock] evaluateTransaction: ${functionName}(${args.join(', ')})`);

        let resultData = [];

        switch (functionName) {
            case 'GetAllProducts':
                // 返回一个模拟的产品列表，匹配 server.js 中此 API 的逻辑
                resultData = [
                    { ID: "product1", Name: "模拟产品A", Owner: "manufacturer", Status: "created" },
                    { ID: "product2", Name: "模拟产品B", Owner: "logistics", Status: "shipped" }
                ];
                break;
            case 'ReadProduct':
                // 返回一个模拟的单一产品
                resultData = { ID: args[0] || "product1", Name: "模拟产品A", Owner: "manufacturer", Status: "created" };
                break;
            default:
                resultData = { message: "Mock data for " + functionName };
        }

        // Fabric SDK 返回的是 Buffer
        return Buffer.from(JSON.stringify(resultData));
    },

    /**
     * 模拟提交交易 (例如 CreateProduct)
     * @param {string} functionName 调用的链码函数名
     * @returns {Promise<void>} 提交交易通常不返回数据
     */
    submitTransaction: async (functionName, ...args) => {
        console.log(`[FabricMock] submitTransaction: ${functionName}(${args.join(', ')})`);
        
        // 模拟交易成功
        // 这些函数基于你的 supplychain.go
        switch (functionName) {
            case 'CreateProduct':
            case 'TransferProduct':
            case 'CreateTransaction':
            case 'UpdateLogisticsRecord':
                return Promise.resolve(); // 模拟成功
            default:
                return Promise.reject(new Error(`[FabricMock] Unknown function: ${functionName}`));
        }
    }
};

module.exports = contract;