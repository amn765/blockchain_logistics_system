/*
 * Supply Chain Smart Contract
 * 物流与资金流转追踪智能合约
 */

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"strconv"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing supply chain
type SmartContract struct {
	contractapi.Contract
}

// Product represents a product in the supply chain
type Product struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Owner       string `json:"owner"`
	Status      string `json:"status"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
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
}

// InitLedger initializes the ledger with sample data
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	products := []Product{
		{
			ID:          "product1",
			Name:        "示例产品",
			Description: "这是一个示例产品",
			Owner:       "manufacturer",
			Status:      "created",
			CreatedAt:   "2024-01-01T00:00:00Z",
			UpdatedAt:   "2024-01-01T00:00:00Z",
		},
	}

	for _, product := range products {
		productJSON, err := json.Marshal(product)
		if err != nil {
			return err
		}

		err = ctx.GetStub().PutState(product.ID, productJSON)
		if err != nil {
			return fmt.Errorf("failed to put product: %v", err)
		}
	}

	return nil
}

// CreateProduct creates a new product
func (s *SmartContract) CreateProduct(ctx contractapi.TransactionContextInterface, id string, name string, description string, owner string) error {
	exists, err := s.ProductExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("the product %s already exists", id)
	}

	product := Product{
		ID:          id,
		Name:        name,
		Description: description,
		Owner:       owner,
		Status:      "created",
		CreatedAt:   ctx.GetStub().GetTxTimestamp().String(),
		UpdatedAt:   ctx.GetStub().GetTxTimestamp().String(),
	}

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, productJSON)
}

// TransferProduct transfers ownership of a product
func (s *SmartContract) TransferProduct(ctx contractapi.TransactionContextInterface, id string, newOwner string) error {
	product, err := s.ReadProduct(ctx, id)
	if err != nil {
		return err
	}

	product.Owner = newOwner
	product.UpdatedAt = ctx.GetStub().GetTxTimestamp().String()

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, productJSON)
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
		return nil, err
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
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var products []*Product
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var product Product
		err = json.Unmarshal(queryResponse.Value, &product)
		if err != nil {
			return nil, err
		}
		products = append(products, &product)
	}

	return products, nil
}

// CreateTransaction creates a new financial transaction
func (s *SmartContract) CreateTransaction(ctx contractapi.TransactionContextInterface, id string, productId string, from string, to string, amountStr string, currency string) error {
	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil {
		return fmt.Errorf("invalid amount: %s", amountStr)
	}

	transaction := Transaction{
		ID:        id,
		ProductID: productId,
		From:      from,
		To:        to,
		Amount:    amount,
		Currency:  currency,
		Status:    "pending",
		Timestamp: ctx.GetStub().GetTxTimestamp().String(),
	}

	transactionJSON, err := json.Marshal(transaction)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("tx_"+id, transactionJSON)
}

// UpdateLogisticsRecord updates logistics information for a product
func (s *SmartContract) UpdateLogisticsRecord(ctx contractapi.TransactionContextInterface, id string, productId string, location string, status string, handler string, notes string) error {
	record := LogisticsRecord{
		ID:        id,
		ProductID: productId,
		Location:  location,
		Status:    status,
		Timestamp: ctx.GetStub().GetTxTimestamp().String(),
		Handler:   handler,
		Notes:     notes,
	}

	recordJSON, err := json.Marshal(record)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("log_"+id, recordJSON)
}

func main() {
	supplyChainContract := new(SmartContract)

	cc, err := contractapi.NewChaincode(supplyChainContract)
	if err != nil {
		log.Panicf("Error create supply chain chaincode: %v", err)
	}

	if err := cc.Start(); err != nil {
		log.Panicf("Error starting supply chain chaincode: %v", err)
	}
}
