import { Email } from "@mui/icons-material";
import axios from "axios";

const API_BASE_URL = "http://localhost:3001/api";

// 创建一个axios实例，用于添加认证token
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// 添加请求拦截器，自动添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// src/api/http.ts
// 当前使用 mock 返回，后端 ready 后把实现改为 axios 实际调用
export const api = {
  auth: {
    login: async (email: string, password: string) => {
      try {
        // 发起一个 POST 请求到你的后端 /api/auth/login 路由
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: email,
          password: password
        });

        // 保存token到localStorage
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        // 返回后端传回的真实数据 (token 和 user)
        return response.data;

      } catch (error: any) {
        // 如果登录失败 (例如 401)，抛出错误
        // 登录组件 会捕获这个错误
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(error.response.data.message || '登录失败');
        }
        throw new Error('网络连接错误');
      }
    },

    register: async (userData: {
      companyName: string;
      contactPerson: string;
      email: string;
      password: string;
      licenseNumber: string;
      companyType: string;
    }) => {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, {
          email: userData.email,
          password: userData.password,
          companyName: userData.companyName,
          contactPerson: userData.contactPerson,
          licenseNumber: userData.licenseNumber,
          companyType: userData.companyType,
        })

        // 保存token到localStorage
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        return response.data;
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(error.response.data.message || '注册失败');
        }
        throw new Error('网络连接错误');
      }
    },
  },

  dashboard: {
    summary: async () => {
      try {
        const response = await apiClient.get('/dashboard/summary');
        const data = response.data.data;

        return {
          transit: data.products?.transiting || 0,
          activeOrders: data.products?.activeduct || 0,
          delivered: data.products?.delivered || 0,
          onChainTxCount: data.transactions?.total || 0,          
        }
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(error.response.data.error || '获取仪表盘数据失败');
        }
        throw new Error('网络连接错误');
      }
    },
    
    // 新增：获取最近交易记录
    recentTransactions: async () => {
      try {
        const response = await apiClient.get('/dashboard/transactions');
        const transactions = response.data.data;

        return transactions.map((transaction: any) => ({
          id: transaction.id,
          amount: transaction.amount,
          type: transaction.from === "本公司" ? "expense" : "income",
          from: transaction.from,
          to: transaction.to,
          status: transaction.status === "CONFIRMED" ? "completed" : 
                 transaction.status === "PENDING" ? "pending" : "failed",
          date: new Date(transaction.timestamp).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }).replace(/\//g, '-'),
          description: transaction.notes || '交易记录'
        }));
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(error.response.data.error || '获取交易记录失败');
        }
        throw new Error('网络连接错误');
      }
    },
  },

  logistics: {
    list: async () => {
      try {
        // 这里需要根据实际的API进行调整
        // 由于后端没有直接提供获取物流列表的接口，我们可以通过获取产品列表来实现
        const response = await apiClient.get('/products');
        console.log(response)
        return response.data.map((product: any) => ({
          id: product.id,
          name: product.name,
          status: product.status,
          lastLocation: product.currentLocation,
          updatedAt: product.updatedAt,
          currentActor: product.currentActor
        }));
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(error.response.data.error || '获取物流列表失败');
        }
        throw new Error('网络连接错误');
      }
    },
    detail: async (id: string) => {
      try {
        // 获取产品的物流记录
        const response = await apiClient.get(`/trace/search?query=${id}`);
        
        if (response.data.data && response.data.data.length > 0) {
          const productData = response.data.data[0];
          // 映射物流记录到前端期望的结构
          return {
            id: productData.product.id,
            history: productData.logisticsRecords.map((record: any) => ({
              node: record.location,
              time: record.timestamp,
              action: record.status
            }))
          };
        }
        
        throw new Error('产品未找到');
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(error.response.data.error || '获取物流详情失败');
        }
        throw new Error('网络连接错误');
      }
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
      try {
        const response = await apiClient.post('/products', {
          ...productData,
          reference: productData.batchNo // 使用批次号作为reference
        });
        
        return response.data;
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(error.response.data.error || '创建产品失败');
        }
        throw new Error('网络连接错误');
      }
    },

    // 文件上传（用于质检报告）
    uploadFile: async (file: File) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await apiClient.post('/products/upload-file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        return response.data;
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(error.response.data.error || '文件上传失败');
        }
        throw new Error('网络连接错误');
      }
    },
    
    // 获取所有产品
    getAll: async () => {
      try {
        const response = await apiClient.get('/products');
        return response.data;
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(error.response.data.error || '获取产品列表失败');
        }
        throw new Error('网络连接错误');
      }
    }
  },
  
  finance: {
    // 获取交易列表
    transactions: async () => {
      try {
        const response = await apiClient.get('/finance/transactions');
        return response.data.map((tx: any) => ({
          id: tx.id,
          txId: tx.txId || '',
          ledgerTxId: tx.ledgerTxId || '',
          fromCompanyId: tx.from,
          toCompanyId: tx.to,
          payer: tx.from,
          payee: tx.to,
          amount: tx.amount,
          currency: tx.currency,
          status: tx.status,
          reference: tx.reference,
          date: tx.timestamp ? tx.timestamp.split('T')[0] : '',
          createdAt: tx.timestamp,
          notes: tx.notes || ''
        }));
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(error.response.data.message || '获取交易列表失败');
        }
        throw new Error('网络连接错误');
      }
    },

    // 确认收款
    confirmTransaction: async (id: string) => {
      try {
        const response = await apiClient.post(`/finance/transactions/${id}/confirm`);
        const tx = response.data.transaction; // 注意：后端返回 { message, transaction }
        return {
          id: tx.id,
          txId: tx.txId || '',
          ledgerTxId: tx.ledgerTxId || '',
          fromCompanyId: tx.from,
          toCompanyId: tx.to,
          payer: tx.from,
          payee: tx.to,
          amount: tx.amount,
          currency: tx.currency,
          status: tx.status,
          reference: tx.reference,
          date: tx.timestamp ? tx.timestamp.split('T')[0] : '',
          notes: tx.notes || ''
        };
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(error.response.data.message || '确认交易失败');
        }
        throw new Error('网络连接错误');
      }
    },

    // 创建交易
    createTransaction: async (transactionData: {
      toCompanyId: string;
      amount: number;
      currency: string;
      reference: string;
      notes?: string;
    }) => {
      try {
        const response = await apiClient.post('/transactions', transactionData);
        const data = response.data;
        
        // 映射后端返回的数据结构到前端期望的结构
        return {
          transactionId: data.transactionId,
          txId: data.txId,
          ledgerTxId: data.ledgerTxId,
          status: data.status,
          ...transactionData,
          payer: "当前公司",
          payee: transactionData.toCompanyId,
          date: new Date().toISOString().split('T')[0]
        };
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(error.response.data.error || '创建交易失败');
        }
        throw new Error('网络连接错误');
      }
    },

    // 获取单笔交易详情
    getTransactionDetail: async (id: string) => {
      try {
        const response = await apiClient.get('/finance/transactions');
        const tx = response.data.find((t: any) => t.id === id);
        if (!tx) throw new Error('交易未找到');
        return {
          id: tx.id,
          txId: tx.txId || '',
          ledgerTxId: tx.ledgerTxId || '',
          fromCompanyId: tx.from,
          toCompanyId: tx.to,
          payer: tx.from,
          payee: tx.to,
          amount: tx.amount,
          currency: tx.currency,
          status: tx.status,
          reference: tx.reference,
          date: tx.timestamp ? tx.timestamp.split('T')[0] : '',
          notes: tx.notes || '',
          progress: [
            { step: "发起", status: "completed", time: tx.timestamp },
            { step: "验证", status: "completed", time: tx.timestamp },
            { step: "上链", status: tx.status === "CONFIRMED" ? "completed" : "pending", time: tx.timestamp },
            { step: "确认", status: tx.status === "CONFIRMED" ? "completed" : "pending", time: null }
          ]
        };
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(error.response.data.message || '获取交易详情失败');
        }
        throw new Error('网络连接错误');
      }
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
      try {
        const response = await apiClient.post('/logistics', {
          productId,
          ...eventData
        });
        
        return response.data;
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(error.response.data.error || '添加物流事件失败');
        }
        throw new Error('网络连接错误');
      }
    },

    // 获取物流事件历史
    getEvents: async (productId: string) => {
      try {
        // 这里需要根据实际的API进行调整
        // 目前后端没有提供专门获取物流事件历史的接口
        // 我们可以通过溯源查询接口来获取相关信息
        const response = await apiClient.get(`/trace/search?query=${productId}`);
        
        if (response.data.data && response.data.data.length > 0) {
          const productData = response.data.data[0];
          return productData.logisticsRecords.map((record: any) => ({
            id: record.id,
            type: record.status,
            location: record.location,
            actor: record.handler,
            timestamp: record.timestamp,
            notes: record.notes
          }));
        }
        
        return [];
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(error.response.data.error || '获取物流事件历史失败');
        }
        throw new Error('网络连接错误');
      }
    }
  },
  
  trace: {
    search: async (query: string) => {
      try {
        const response = await apiClient.get(`/trace/search?query=${query}`);
        
        if (response.data.data && response.data.data.length > 0) {
          const productData = response.data.data[0];
          
          return {
            product: {
              id: productData.product.id,
              name: productData.product.name,
              batchNo: productData.product.batchNo,
              sku: productData.product.sku,
              quantity: productData.product.quantity,
              productionDate: productData.product.productionDate,
              status: productData.product.status,
              reference: productData.product.reference
            },
            events: productData.logisticsRecords.map((record: any) => ({
              id: record.id,
              type: record.status,
              location: record.location,
              actor: record.handler,
              timestamp: record.timestamp,
              notes: record.notes
            })),
            transactions: productData.transactions.map((transaction: any) => ({
              id: transaction.id,
              txId: transaction.txId,
              amount: transaction.amount,
              currency: transaction.currency,
              fromCompany: transaction.from,
              toCompany: transaction.to,
              status: transaction.status,
              reference: transaction.reference,
              timestamp: transaction.timestamp,
              description: transaction.notes
            }))
          };
        }
        
        throw new Error("未找到相关溯源信息");
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(error.response.data.error || '溯源查询失败');
        }
        throw new Error('网络连接错误');
      }
    }
  },
  
  users: {
    // 获取当前用户信息
    getCurrent: async () => {
      try {
        const response = await apiClient.get('/users/current');
        return response.data.data;
      } catch (error: any) {
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
    }
  },
  
};
/*
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

*/