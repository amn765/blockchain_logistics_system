// src/api/http.ts
// 当前使用 mock 返回，后端 ready 后把实现改为 axios 实际调用
export const api = {
  auth: {
    login: async (email: string, password: string) => {
      // mock 登录：若邮箱非空直接返回 token
      if (email && password) {
        return { 
          token: "mock-jwt-token", 
          user: { 
            id: "mock-user-id",
            email: email, 
            name: "Demo Company",
            role: "manufacturer",
            companyId: "mock-company-id"
          } 
        };
      }
      throw new Error("Invalid credentials");
    },

    register: async (userData: {
      companyName: string;
      contactPerson: string;
      email: string;
      password: string;
      licenseNumber: string;
      companyType: string;
    }) => {
      // mock 注册：如果邮箱非空就返回成功
      if (userData.email && userData.password) {
        return {
          token: "mock-jwt-token-for-registration",
          user: {
            id: "mock-user-id",
            email: userData.email,
            name: userData.companyName,
            role: "manufacturer",
            companyId: "mock-company-id"
          }
        };
      }
      throw new Error("Registration failed");
    },
  },

  dashboard: {
    summary: async () => {
      // mock 仪表盘数据
      return {
        totalShipments: 128,
        activeOrders: 42,
        pendingPayments: 5,
        onChainTxCount: 314,
      };
    },
    
    // 新增：获取最近交易记录
    recentTransactions: async () => {
      // mock 最近15条交易数据
      return [
        { 
          id: "TX001", 
          amount: 12000, 
          type: "income", 
          from: "A公司", 
          to: "本公司", 
          status: "completed", 
          date: "2025-01-15 10:30:00",
          description: "货款收入"
        },
        { 
          id: "TX002", 
          amount: 5400, 
          type: "expense", 
          from: "本公司", 
          to: "B物流", 
          status: "pending", 
          date: "2025-01-14 16:20:00",
          description: "物流费用"
        },
        { 
          id: "TX003", 
          amount: 8300, 
          type: "income", 
          from: "C公司", 
          to: "本公司", 
          status: "completed", 
          date: "2025-01-14 09:15:00",
          description: "商品销售"
        },
        { 
          id: "TX004", 
          amount: 3200, 
          type: "expense", 
          from: "本公司", 
          to: "D供应商", 
          status: "completed", 
          date: "2025-01-13 14:45:00",
          description: "原材料采购"
        },
        { 
          id: "TX005", 
          amount: 15600, 
          type: "income", 
          from: "E公司", 
          to: "本公司", 
          status: "completed", 
          date: "2025-01-12 11:20:00",
          description: "项目结算"
        },
        // ... 可以继续添加更多mock数据直到15条
      ];
    },
  },

  logistics: {
    list: async () => {
      return [
        { 
          id: "SKU-001", 
          name: "商品A", 
          status: "in_transit", 
          lastLocation: "上海", 
          updatedAt: "2025-01-20",
          currentActor: "物流公司A"
        },
        { 
          id: "SKU-002", 
          name: "商品B", 
          status: "delivered", 
          lastLocation: "北京", 
          updatedAt: "2025-01-18",
          currentActor: "收货方"
        },
        { 
          id: "SKU-003", 
          name: "商品C", 
          status: "in_transit", 
          lastLocation: "广州", 
          updatedAt: "2025-01-19",
          currentActor: "物流公司B"
        },
        { 
          id: "SKU-004", 
          name: "商品D", 
          status: "pending", 
          lastLocation: "深圳仓库", 
          updatedAt: "2025-01-17",
          currentActor: "仓库管理员"
        },
      ];
    },
    detail: async (id: string) => {
      return {
        id,
        history: [
          { node: "仓库A", time: "2025-01-10", action: "入库" },
          { node: "杭州物流", time: "2025-01-12", action: "出库" },
          { node: "上海中转", time: "2025-01-15", action: "中转" },
        ],
      };
    },
  },
  
  products: {
    // 创建商品批次
    create: async (productData: {
      sku: string;
      batchNo: string;
      quantity: number;
      productionDate: string;
      metadata?: {
        origin?: string;
        temperatureRecord?: string;
        gcReportId?: string;
      }
    }) => {
      // mock 创建批次
      return {
        productId: `p-${Date.now()}`,
        ledgerTxId: `tx-${Date.now()}`,
        status: "PENDING",
        qrCodeData: `PRODUCT-${productData.sku}-${productData.batchNo}`
      };
    },

    // 文件上传（用于质检报告）
    uploadFile: async (file: File) => {
      // mock 文件上传
      return {
        fileId: `file-${Date.now()}`,
        fileName: file.name,
        url: "https://example.com/files/" + file.name
      };
    }
  },
  
  finance: {
    transactions: async () => {
      return [
        { 
          id: "TX001",
          txId: "0xabc123",
          fromCompanyId: "A", 
          toCompanyId: "B", 
          payer: "A公司", 
          payee: "B公司", 
          amount: 12000, 
          currency: "CNY", 
          status: "CONFIRMED", 
          reference: "INV-202501001",
          ledgerTxId: "tx-abc123",
          date: "2025-01-15",
          createdAt: "2025-01-15T10:30:00Z"
        },
        { 
          id: "TX002",
          txId: "0xdef456",
          fromCompanyId: "C", 
          toCompanyId: "B", 
          payer: "C公司", 
          payee: "B公司", 
          amount: 5400, 
          currency: "CNY", 
          status: "PENDING", 
          reference: "INV-202501002",
          ledgerTxId: "tx-def456",
          date: "2025-01-14",
          createdAt: "2025-01-14T16:20:00Z"
        },
        { 
          id: "TX003",
          txId: "0xghi789", 
          fromCompanyId: "B", 
          toCompanyId: "D", 
          payer: "B公司", 
          payee: "D公司", 
          amount: 8300, 
          currency: "CNY", 
          status: "FAILED", 
          reference: "INV-202501003",
          ledgerTxId: "tx-ghi789",
          date: "2025-01-13",
          createdAt: "2025-01-13T09:15:00Z",
          failureReason: "余额不足"
        },
      ];
    },
    
    // 新增：发起支付
    createTransaction: async (transactionData: {
      toCompanyId: string;
      amount: number;
      currency: string;
      reference: string;
      notes?: string;
    }) => {
      // mock 发起支付
      return {
        transactionId: `t-${Date.now()}`,
        txId: `0x${Date.now().toString(16)}`,
        ledgerTxId: `tx-${Date.now()}`,
        status: "PENDING",
        ...transactionData,
        payer: "当前公司",
        payee: "目标公司",
        date: new Date().toISOString().split('T')[0]
      };
    },

    // 新增：获取交易详情
    getTransactionDetail: async (id: string) => {
      // mock 交易详情
      return {
        id,
        txId: `0x${id}`,
        fromCompanyId: "current-company",
        toCompanyId: "target-company", 
        payer: "当前公司",
        payee: "目标公司",
        amount: 10000,
        currency: "CNY",
        status: "PENDING",
        reference: "INV-202501005",
        ledgerTxId: `tx-${id}`,
        date: new Date().toISOString().split('T')[0],
        notes: "测试交易",
        progress: [
          { step: "发起", status: "completed", time: new Date().toISOString() },
          { step: "验证", status: "completed", time: new Date().toISOString() },
          { step: "上链", status: "in_progress", time: null },
          { step: "确认", status: "pending", time: null }
        ]
      };
    }
  },
  
  logisticsEvents: {
    // 添加物流事件
    addEvent: async (productId: string, eventData: {
      type: string;
      location: string;
      actor: string;
      timestamp: string;
      notes?: string;
    }) => {
      // mock 添加物流事件
      return {
        eventId: `event-${Date.now()}`,
        ledgerTxId: `tx-${Date.now()}`,
        status: "PENDING",
        productId,
        ...eventData
      };
    },

    // 获取物流事件历史
    getEvents: async (productId: string) => {
      // mock 事件历史数据
      return [
        {
          id: "event-1",
          type: "received",
          location: "上海仓库",
          actor: "仓库管理员A",
          timestamp: "2025-01-10T08:00:00Z",
          notes: "商品入库"
        },
        {
          id: "event-2", 
          type: "shipped",
          location: "上海物流中心",
          actor: "物流公司B",
          timestamp: "2025-01-12T10:30:00Z",
          notes: "发往北京"
        },
        {
          id: "event-3",
          type: "in_transit",
          location: "南京中转站", 
          actor: "物流公司B",
          timestamp: "2025-01-14T14:15:00Z",
          notes: "中转处理"
        }
      ];
    }
  },
  
  trace: {
    search: async (query: string) => {
      // mock 溯源数据
      if (query.includes('SKU-001') || query.includes('BATCH-2025') || query.includes('ORDER-001')) {
        return {
          product: {
            id: "SKU-001",
            name: "高端智能手机",
            batchNo: "BATCH-20250115-001",
            sku: "SKU-001",
            quantity: 100,
            productionDate: "2025-01-10",
            status: "in_transit",
            reference: "ORDER-20250115-001"
          },
          events: [
            {
              id: "event-1",
              type: "received",
              location: "上海仓库",
              actor: "仓库管理员A",
              timestamp: "2025-01-10T08:00:00Z",
              notes: "商品入库质检"
            },
            {
              id: "event-2",
              type: "shipped", 
              location: "上海物流中心",
              actor: "物流公司B",
              timestamp: "2025-01-12T10:30:00Z",
              notes: "发往北京，物流单号：SF123456789"
            },
            {
              id: "event-3",
              type: "in_transit",
              location: "南京中转站",
              actor: "物流公司B", 
              timestamp: "2025-01-14T14:15:00Z",
              notes: "中转处理"
            }
          ],
          transactions: [
            {
              id: "TX-001",
              txId: "0xabc123",
              amount: 1200000,
              currency: "CNY",
              fromCompany: "A公司",
              toCompany: "B公司", 
              status: "CONFIRMED",
              reference: "ORDER-20250115-001",
              timestamp: "2025-01-12T11:00:00Z",
              description: "货款支付"
            },
            {
              id: "TX-002",
              txId: "0xdef456",
              amount: 50000,
              currency: "CNY", 
              fromCompany: "B公司",
              toCompany: "物流公司B",
              status: "CONFIRMED",
              reference: "ORDER-20250115-001",
              timestamp: "2025-01-12T15:30:00Z",
              description: "运费支付"
            }
          ]
        };
      }
      
      // 另一个测试用例
      if (query.includes('SKU-002') || query.includes('BATCH-2024') || query.includes('ORDER-002')) {
        return {
          product: {
            id: "SKU-002",
            name: "笔记本电脑",
            batchNo: "BATCH-20241220-001", 
            sku: "SKU-002",
            quantity: 50,
            productionDate: "2024-12-15",
            status: "delivered",
            reference: "ORDER-20241220-001"
          },
          events: [
            {
              id: "event-4",
              type: "received",
              location: "深圳工厂",
              actor: "质检员C",
              timestamp: "2024-12-18T09:00:00Z",
              notes: "生产完成入库"
            },
            {
              id: "event-5",
              type: "shipped",
              location: "深圳仓库",
              actor: "物流公司C",
              timestamp: "2024-12-20T14:20:00Z", 
              notes: "发往上海"
            },
            {
              id: "event-6",
              type: "delivered",
              location: "上海客户仓库",
              actor: "收货员D",
              timestamp: "2024-12-22T16:00:00Z",
              notes: "客户签收完成"
            }
          ],
          transactions: [
            {
              id: "TX-003", 
              txId: "0xghi789",
              amount: 800000,
              currency: "CNY",
              fromCompany: "C公司",
              toCompany: "D公司",
              status: "CONFIRMED",
              reference: "ORDER-20241220-001", 
              timestamp: "2024-12-20T10:00:00Z",
              description: "预付款"
            },
            {
              id: "TX-004",
              txId: "0xjkl012", 
              amount: 400000,
              currency: "CNY",
              fromCompany: "C公司",
              toCompany: "D公司",
              status: "CONFIRMED",
              reference: "ORDER-20241220-001",
              timestamp: "2024-12-23T09:30:00Z",
              description: "尾款结算"
            }
          ]
        };
      }
      
      throw new Error("未找到相关溯源信息");
    }
  },
  users: {
    // 获取当前用户信息
    getCurrent: async () => {
      // 从localStorage获取用户信息，或者返回mock数据
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          id: user.id || "user-1",
          name: user.name || "Demo用户",
          email: user.email || "demo@company.com",
          companyName: user.companyName || "Demo科技有限公司",
          role: "企业用户",
          createdAt: "2025-01-01",
          companyType: user.companyType || "生产厂商"
        };
      }
      
      // 默认mock数据
      return {
        id: "user-1",
        name: "张三",
        email: "zhang@company.com",
        companyName: "ABC科技有限公司", 
        role: "企业用户",
        createdAt: "2025-01-01",
        companyType: "生产厂商"
      };
    }
  },
  
};
