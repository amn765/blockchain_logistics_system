/*
 * Supply Chain Smart Contract
 * 物流与资金流转追踪智能合约
 * 
 * 使用 fabric-contract-api-go (高层抽象) 和 fabric-chaincode-go (底层 API)
 */

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing supply chain
type SmartContract struct {
	contractapi.Contract
}

// Product represents a product in the supply chain
type Product struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Owner       string  `json:"owner"`
	Status      string  `json:"status"`
	Price       float64 `json:"price"`
	CreatedAt   string  `json:"createdAt"`
	UpdatedAt   string  `json:"updatedAt"`
}

// Transaction represents a financial transaction
type Transaction struct {
	ID        string  `json:"id"`
	ProductID string  `json:"productId"`
	From      string  `json:"from"`
	To        string  `json:"to"`
	Amount    float64 `json:"amount"`
	Currency  string  `json:"currency"`
	Status    string  `json:"status"`
	Timestamp string  `json:"timestamp"`
	TxID      string  `json:"txId"`
}

// LogisticsRecord represents logistics information
type LogisticsRecord struct {
	ID        string `json:"id"`
	ProductID string `json:"productId"`
	Location  string `json:"location"`
	Status    string `json:"status"`
	Timestamp string `json:"timestamp"`
	Handler   string `json:"handler"`
	Notes     string `json:"notes"`
	TxID      string `json:"txId"`
}

// InitLedger initializes the ledger with sample data
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	products := []Product{
		{
			ID:          "product1",
			Name:        "示例产品1",
			Description: "这是一个示例产品",
			Owner:       "manufacturer",
			Status:      "created",
			Price:       100.0,
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
		{
			ID:          "product2",
			Name:        "示例产品2",
			Description: "另一个示例产品",
			Owner:       "manufacturer",
			Status:      "created",
			Price:       200.0,
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
	}

	for _, product := range products {
		productJSON, err := json.Marshal(product)
		if err != nil {
			return fmt.Errorf("failed to marshal product: %v", err)
		}

		err = ctx.GetStub().PutState(product.ID, productJSON)
		if err != nil {
			return fmt.Errorf("failed to put product %s: %v", product.ID, err)
		}
	}

	return nil
}

// CreateProduct creates a new product
func (s *SmartContract) CreateProduct(ctx contractapi.TransactionContextInterface, id string, name string, description string, owner string, priceStr string) error {
	exists, err := s.ProductExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("the product %s already exists", id)
	}

	price, err := strconv.ParseFloat(priceStr, 64)
	if err != nil {
		return fmt.Errorf("invalid price: %s", priceStr)
	}

	// 使用底层 API 获取交易信息
	txID := ctx.GetStub().GetTxID()
	timestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}

	product := Product{
		ID:          id,
		Name:        name,
		Description: description,
		Owner:       owner,
		Status:      "created",
		Price:       price,
		CreatedAt:   timestamp.AsTime().Format(time.RFC3339),
		UpdatedAt:   timestamp.AsTime().Format(time.RFC3339),
	}

	productJSON, err := json.Marshal(product)
	if err != nil {
		return fmt.Errorf("failed to marshal product: %v", err)
	}

	// 使用底层 API 写入状态
	err = ctx.GetStub().PutState(id, productJSON)
	if err != nil {
		return fmt.Errorf("failed to put product: %v", err)
	}

	// 使用底层 API 设置事件
	eventPayload := fmt.Sprintf("Product created: %s by %s", id, owner)
	err = ctx.GetStub().SetEvent("ProductCreated", []byte(eventPayload))
	if err != nil {
		return fmt.Errorf("failed to set event: %v", err)
	}

	log.Printf("Product %s created in transaction %s", id, txID)
	return nil
}

// TransferProduct transfers ownership of a product
func (s *SmartContract) TransferProduct(ctx contractapi.TransactionContextInterface, id string, newOwner string) error {
	product, err := s.ReadProduct(ctx, id)
	if err != nil {
		return err
	}

	oldOwner := product.Owner
	product.Owner = newOwner
	timestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	product.UpdatedAt = timestamp.AsTime().Format(time.RFC3339)

	productJSON, err := json.Marshal(product)
	if err != nil {
		return fmt.Errorf("failed to marshal product: %v", err)
	}

	err = ctx.GetStub().PutState(id, productJSON)
	if err != nil {
		return fmt.Errorf("failed to update product: %v", err)
	}

	// 设置转移事件
	eventPayload := fmt.Sprintf("Product %s transferred from %s to %s", id, oldOwner, newOwner)
	err = ctx.GetStub().SetEvent("ProductTransferred", []byte(eventPayload))
	if err != nil {
		return fmt.Errorf("failed to set event: %v", err)
	}

	return nil
}

// ReadProduct returns the product stored in the world state with given id
func (s *SmartContract) ReadProduct(ctx contractapi.TransactionContextInterface, id string) (*Product, error) {
	productJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if productJSON == nil {
		return nil, fmt.Errorf("the product %s does not exist", id)
	}

	var product Product
	err = json.Unmarshal(productJSON, &product)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal product: %v", err)
	}

	return &product, nil
}

// ProductExists returns true when product with given ID exists in world state
func (s *SmartContract) ProductExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	productJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return productJSON != nil, nil
}

// GetAllProducts returns all products found in world state
func (s *SmartContract) GetAllProducts(ctx contractapi.TransactionContextInterface) ([]*Product, error) {
	// 使用底层 API 进行范围查询
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, fmt.Errorf("failed to get state by range: %v", err)
	}
	defer resultsIterator.Close()

	var products []*Product
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate query results: %v", err)
		}

		// 跳过非产品记录（交易和物流记录）
		if string(queryResponse.Key)[:3] == "tx_" || string(queryResponse.Key)[:4] == "log_" {
			continue
		}

		var product Product
		err = json.Unmarshal(queryResponse.Value, &product)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal product: %v", err)
		}
		products = append(products, &product)
	}

	return products, nil
}

// QueryProductsByOwner queries products by owner (compatible with leveldb)
func (s *SmartContract) QueryProductsByOwner(ctx contractapi.TransactionContextInterface, owner string) ([]*Product, error) {
	// 使用范围查询遍历所有记录，兼容 leveldb
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, fmt.Errorf("failed to get state by range: %v", err)
	}
	defer resultsIterator.Close()

	var products []*Product
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate query results: %v", err)
		}

		// 跳过非产品记录（交易和物流记录）
		if string(queryResponse.Key)[:3] == "tx_" || string(queryResponse.Key)[:4] == "log_" {
			continue
		}

		var product Product
		err = json.Unmarshal(queryResponse.Value, &product)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal product: %v", err)
		}

		// 只返回指定owner的产品
		if product.Owner == owner {
			products = append(products, &product)
		}
	}

	return products, nil
}

// CreateTransaction creates a new financial transaction
func (s *SmartContract) CreateTransaction(ctx contractapi.TransactionContextInterface, id string, productId string, from string, to string, amountStr string, currency string) error {
	// 验证产品存在
	exists, err := s.ProductExists(ctx, productId)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("product %s does not exist", productId)
	}

	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil {
		return fmt.Errorf("invalid amount: %s", amountStr)
	}

	// 使用底层 API 获取交易信息
	txID := ctx.GetStub().GetTxID()
	timestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}

	transaction := Transaction{
		ID:        id,
		ProductID: productId,
		From:      from,
		To:        to,
		Amount:    amount,
		Currency:  currency,
		Status:    "pending",
		Timestamp: timestamp.AsTime().Format(time.RFC3339),
		TxID:      txID,
	}

	transactionJSON, err := json.Marshal(transaction)
	if err != nil {
		return fmt.Errorf("failed to marshal transaction: %v", err)
	}

	// 使用复合键存储交易
	transactionKey := fmt.Sprintf("tx_%s", id)
	err = ctx.GetStub().PutState(transactionKey, transactionJSON)
	if err != nil {
		return fmt.Errorf("failed to put transaction: %v", err)
	}

	// 设置交易事件
	eventPayload := fmt.Sprintf("Transaction %s created: %s -> %s, Amount: %s %s", id, from, to, amountStr, currency)
	err = ctx.GetStub().SetEvent("TransactionCreated", []byte(eventPayload))
	if err != nil {
		return fmt.Errorf("failed to set event: %v", err)
	}

	return nil
}

// CompleteTransaction completes a financial transaction
func (s *SmartContract) CompleteTransaction(ctx contractapi.TransactionContextInterface, id string) error {
	transactionKey := fmt.Sprintf("tx_%s", id)
	transactionJSON, err := ctx.GetStub().GetState(transactionKey)
	if err != nil {
		return fmt.Errorf("failed to read transaction: %v", err)
	}
	if transactionJSON == nil {
		return fmt.Errorf("transaction %s does not exist", id)
	}

	var transaction Transaction
	err = json.Unmarshal(transactionJSON, &transaction)
	if err != nil {
		return fmt.Errorf("failed to unmarshal transaction: %v", err)
	}

	if transaction.Status == "completed" {
		return fmt.Errorf("transaction %s is already completed", id)
	}

	transaction.Status = "completed"
	timestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	transaction.Timestamp = timestamp.AsTime().Format(time.RFC3339)

	transactionJSON, err = json.Marshal(transaction)
	if err != nil {
		return fmt.Errorf("failed to marshal transaction: %v", err)
	}

	err = ctx.GetStub().PutState(transactionKey, transactionJSON)
	if err != nil {
		return fmt.Errorf("failed to update transaction: %v", err)
	}

	// 设置完成事件
	eventPayload := fmt.Sprintf("Transaction %s completed", id)
	err = ctx.GetStub().SetEvent("TransactionCompleted", []byte(eventPayload))
	if err != nil {
		return fmt.Errorf("failed to set event: %v", err)
	}

	return nil
}

// ReadTransaction returns a transaction by ID
func (s *SmartContract) ReadTransaction(ctx contractapi.TransactionContextInterface, id string) (*Transaction, error) {
	transactionKey := fmt.Sprintf("tx_%s", id)
	transactionJSON, err := ctx.GetStub().GetState(transactionKey)
	if err != nil {
		return nil, fmt.Errorf("failed to read transaction: %v", err)
	}
	if transactionJSON == nil {
		return nil, fmt.Errorf("transaction %s does not exist", id)
	}

	var transaction Transaction
	err = json.Unmarshal(transactionJSON, &transaction)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal transaction: %v", err)
	}

	return &transaction, nil
}

// UpdateLogisticsRecord updates logistics information for a product
func (s *SmartContract) UpdateLogisticsRecord(ctx contractapi.TransactionContextInterface, id string, productId string, location string, status string, handler string, notes string) error {
	// 验证产品存在
	exists, err := s.ProductExists(ctx, productId)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("product %s does not exist", productId)
	}

	// 使用底层 API 获取交易信息
	txID := ctx.GetStub().GetTxID()
	timestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}

	record := LogisticsRecord{
		ID:        id,
		ProductID: productId,
		Location:  location,
		Status:    status,
		Timestamp: timestamp.AsTime().Format(time.RFC3339),
		Handler:   handler,
		Notes:     notes,
		TxID:      txID,
	}

	recordJSON, err := json.Marshal(record)
	if err != nil {
		return fmt.Errorf("failed to marshal logistics record: %v", err)
	}

	// 使用复合键存储物流记录
	recordKey := fmt.Sprintf("log_%s", id)
	err = ctx.GetStub().PutState(recordKey, recordJSON)
	if err != nil {
		return fmt.Errorf("failed to put logistics record: %v", err)
	}

	// 设置物流事件
	eventPayload := fmt.Sprintf("Logistics record %s updated: Product %s at %s", id, productId, location)
	err = ctx.GetStub().SetEvent("LogisticsUpdated", []byte(eventPayload))
	if err != nil {
		return fmt.Errorf("failed to set event: %v", err)
	}

	return nil
}

// GetLogisticsHistory returns all logistics records for a product (compatible with leveldb)
func (s *SmartContract) GetLogisticsHistory(ctx contractapi.TransactionContextInterface, productId string) ([]*LogisticsRecord, error) {
	// 使用范围查询遍历所有记录，兼容 leveldb
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, fmt.Errorf("failed to get state by range: %v", err)
	}
	defer resultsIterator.Close()

	var records []*LogisticsRecord
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate query results: %v", err)
		}

		// 只处理物流记录
		if string(queryResponse.Key)[:4] != "log_" {
			continue
		}

		var record LogisticsRecord
		err = json.Unmarshal(queryResponse.Value, &record)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal logistics record: %v", err)
		}

		// 只返回指定productId的物流记录
		if record.ProductID == productId {
			records = append(records, &record)
		}
	}

	return records, nil
}

// GetHistoryForProduct returns the complete history of a product using GetHistoryForKey
// 这个函数展示了如何使用底层 API 获取键的历史记录
func (s *SmartContract) GetHistoryForProduct(ctx contractapi.TransactionContextInterface, productId string) ([]*Product, error) {
	// 使用底层 API 获取历史记录
	historyIterator, err := ctx.GetStub().GetHistoryForKey(productId)
	if err != nil {
		return nil, fmt.Errorf("failed to get history for product %s: %v", productId, err)
	}
	defer historyIterator.Close()

	var history []*Product
	for historyIterator.HasNext() {
		historyResponse, err := historyIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate history: %v", err)
		}

		var product Product
		err = json.Unmarshal(historyResponse.Value, &product)
		if err != nil {
			// 如果值被删除，跳过
			if historyResponse.IsDelete {
				continue
			}
			return nil, fmt.Errorf("failed to unmarshal product: %v", err)
		}

		history = append(history, &product)
	}

	return history, nil
}

// GetProductHistoryWithTxInfo returns product history with transaction information
// 这个函数展示了如何使用底层 API 获取更详细的历史信息
func (s *SmartContract) GetProductHistoryWithTxInfo(ctx contractapi.TransactionContextInterface, productId string) ([]map[string]interface{}, error) {
	historyIterator, err := ctx.GetStub().GetHistoryForKey(productId)
	if err != nil {
		return nil, fmt.Errorf("failed to get history: %v", err)
	}
	defer historyIterator.Close()

	var history []map[string]interface{}
	for historyIterator.HasNext() {
		historyResponse, err := historyIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate history: %v", err)
		}

		var product Product
		if !historyResponse.IsDelete {
			err = json.Unmarshal(historyResponse.Value, &product)
			if err != nil {
				return nil, fmt.Errorf("failed to unmarshal product: %v", err)
			}
		}

		historyEntry := map[string]interface{}{
			"txId":      historyResponse.TxId,
			"timestamp": historyResponse.Timestamp,
			"isDelete":  historyResponse.IsDelete,
			"product":   product,
		}

		history = append(history, historyEntry)
	}

	return history, nil
}

// 注意：contractapi 会自动处理函数路由，不需要手动实现 Invoke 方法
// 所有公开的方法（首字母大写）都会自动暴露为链码函数
// 如果需要使用底层 API，可以直接在方法中使用 ctx.GetStub() 访问 shim.ChaincodeStubInterface

func main() {
	supplyChainContract := new(SmartContract)

	cc, err := contractapi.NewChaincode(supplyChainContract)
	if err != nil {
		log.Panicf("Error creating supply chain chaincode: %v", err)
	}

	if err := cc.Start(); err != nil {
		log.Panicf("Error starting supply chain chaincode: %v", err)
	}
}
