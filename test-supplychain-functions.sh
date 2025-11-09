#!/bin/bash

# === 供应链链码功能测试脚本 ===
# 测试链码部署后的功能正确性

# === 配置项 ===
CC_NAME="supplychain"
CHANNEL_NAME="channel1"
TEST_PRODUCT_ID="test-product-001"
TEST_TRANSACTION_ID="test-tx-001"
TEST_LOGISTICS_ID="test-log-001"

# === 颜色定义 ===
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# === 日志函数 ===
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

# === 检查网络连接 ===
check_network() {
    log_info "检查区块链网络连接..."

    # 设置Org1环境
    export FABRIC_CFG_PATH=$PWD/blockchain_new/test-network/../config/
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/blockchain_new/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=$PWD/blockchain_new/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    export CORE_PEER_ADDRESS=localhost:7051

    # 测试链码是否已部署
    if ! peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name $CC_NAME >/dev/null 2>&1; then
        log_error "链码 $CC_NAME 未在通道 $CHANNEL_NAME 上部署"
        exit 1
    fi

    log_success "区块链网络连接正常"
}

# === 测试1: 初始化账本 ===
test_init_ledger() {
    log_test "测试1: 初始化账本 (InitLedger)"

    local result
    result=$(peer chaincode invoke \
        -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls \
        --cafile "$PWD/blockchain_new/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
        -C $CHANNEL_NAME \
        -n $CC_NAME \
        --peerAddresses localhost:7051 --tlsRootCertFiles "$PWD/blockchain_new/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
        --peerAddresses localhost:9051 --tlsRootCertFiles "$PWD/blockchain_new/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
        --peerAddresses localhost:11051 --tlsRootCertFiles "$PWD/blockchain_new/test-network/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt" \
        -c '{"function":"InitLedger","Args":[]}' \
        --waitForEvent 2>&1)

    if echo "$result" | grep -q "Chaincode invoke successful"; then
        log_success "InitLedger 执行成功"
        return 0
    else
        log_error "InitLedger 执行失败: $result"
        return 1
    fi
}

# === 测试2: 创建产品 ===
test_create_product() {
    log_test "测试2: 创建产品 (CreateProduct)"

    local result
    result=$(peer chaincode invoke \
        -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls \
        --cafile "$PWD/blockchain_new/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
        -C $CHANNEL_NAME \
        -n $CC_NAME \
        --peerAddresses localhost:7051 --tlsRootCertFiles "$PWD/blockchain_new/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
        --peerAddresses localhost:9051 --tlsRootCertFiles "$PWD/blockchain_new/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
        --peerAddresses localhost:11051 --tlsRootCertFiles "$PWD/blockchain_new/test-network/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt" \
        -c "{\"function\":\"CreateProduct\",\"Args\":[\"$TEST_PRODUCT_ID\",\"测试产品\",\"这是一个测试产品\",\"manufacturer\",\"150.00\"]}" \
        --waitForEvent 2>&1)

    if echo "$result" | grep -q "Chaincode invoke successful"; then
        log_success "CreateProduct 执行成功"
        return 0
    else
        log_error "CreateProduct 执行失败: $result"
        return 1
    fi
}

# === 测试3: 读取产品 ===
test_read_product() {
    log_test "测试3: 读取产品 (ReadProduct)"

    local result
    result=$(peer chaincode query \
        -C $CHANNEL_NAME \
        -n $CC_NAME \
        -c "{\"function\":\"ReadProduct\",\"Args\":[\"$TEST_PRODUCT_ID\"]}")

    if echo "$result" | grep -q '"id":"'$TEST_PRODUCT_ID'"' && echo "$result" | grep -q '"name":"测试产品"'; then
        log_success "ReadProduct 执行成功 - 产品信息正确"
        echo "产品信息: $result"
        return 0
    else
        log_error "ReadProduct 执行失败或数据不正确: $result"
        return 1
    fi
}

# === 测试4: 转移产品 ===
test_transfer_product() {
    log_test "测试4: 转移产品 (TransferProduct)"

    local result
    result=$(peer chaincode invoke \
        -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls \
        --cafile "$PWD/blockchain_new/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
        -C $CHANNEL_NAME \
        -n $CC_NAME \
        --peerAddresses localhost:7051 --tlsRootCertFiles "$PWD/blockchain_new/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
        --peerAddresses localhost:9051 --tlsRootCertFiles "$PWD/blockchain_new/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
        --peerAddresses localhost:11051 --tlsRootCertFiles "$PWD/blockchain_new/test-network/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt" \
        -c "{\"function\":\"TransferProduct\",\"Args\":[\"$TEST_PRODUCT_ID\",\"distributor\"]}" \
        --waitForEvent 2>&1)

    if echo "$result" | grep -q "Chaincode invoke successful"; then
        log_success "TransferProduct 执行成功"

        # 验证所有者是否已更改
        local verify_result
        verify_result=$(peer chaincode query \
            -C $CHANNEL_NAME \
            -n $CC_NAME \
            -c "{\"function\":\"ReadProduct\",\"Args\":[\"$TEST_PRODUCT_ID\"]}")

        if echo "$verify_result" | grep -q '"owner":"distributor"'; then
            log_success "产品所有者已成功更改为 distributor"
            return 0
        else
            log_error "产品所有者未正确更改: $verify_result"
            return 1
        fi
    else
        log_error "TransferProduct 执行失败: $result"
        return 1
    fi
}

# === 测试5: 创建交易 ===
test_create_transaction() {
    log_test "测试5: 创建交易 (CreateTransaction)"

    local result
    result=$(peer chaincode invoke \
        -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls \
        --cafile "$PWD/blockchain_new/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
        -C $CHANNEL_NAME \
        -n $CC_NAME \
        --peerAddresses localhost:7051 --tlsRootCertFiles "$PWD/blockchain_new/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
        --peerAddresses localhost:9051 --tlsRootCertFiles "$PWD/blockchain_new/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
        --peerAddresses localhost:11051 --tlsRootCertFiles "$PWD/blockchain_new/test-network/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt" \
        -c "{\"function\":\"CreateTransaction\",\"Args\":[\"$TEST_TRANSACTION_ID\",\"$TEST_PRODUCT_ID\",\"manufacturer\",\"distributor\",\"150.00\",\"CNY\"]}" \
        --waitForEvent 2>&1)

    if echo "$result" | grep -q "Chaincode invoke successful"; then
        log_success "CreateTransaction 执行成功"
        return 0
    else
        log_error "CreateTransaction 执行失败: $result"
        return 1
    fi
}

# === 测试6: 读取交易 ===
test_read_transaction() {
    log_test "测试6: 读取交易 (ReadTransaction)"

    local result
    result=$(peer chaincode query \
        -C $CHANNEL_NAME \
        -n $CC_NAME \
        -c "{\"function\":\"ReadTransaction\",\"Args\":[\"$TEST_TRANSACTION_ID\"]}")

    if echo "$result" | grep -q '"id":"'$TEST_TRANSACTION_ID'"' && echo "$result" | grep -q '"productId":"'$TEST_PRODUCT_ID'"'; then
        log_success "ReadTransaction 执行成功 - 交易信息正确"
        echo "交易信息: $result"
        return 0
    else
        log_error "ReadTransaction 执行失败或数据不正确: $result"
        return 1
    fi
}

# === 测试7: 更新物流记录 ===
test_update_logistics() {
    log_test "测试7: 更新物流记录 (UpdateLogisticsRecord)"

    local result
    result=$(peer chaincode invoke \
        -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls \
        --cafile "$PWD/blockchain_new/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
        -C $CHANNEL_NAME \
        -n $CC_NAME \
        --peerAddresses localhost:7051 --tlsRootCertFiles "$PWD/blockchain_new/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
        --peerAddresses localhost:9051 --tlsRootCertFiles "$PWD/blockchain_new/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
        --peerAddresses localhost:11051 --tlsRootCertFiles "$PWD/blockchain_new/test-network/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt" \
        -c "{\"function\":\"UpdateLogisticsRecord\",\"Args\":[\"$TEST_LOGISTICS_ID\",\"$TEST_PRODUCT_ID\",\"北京仓库\",\"已入库\",\"物流员张三\",\"产品已安全入库\"]}" \
        --waitForEvent 2>&1)

    if echo "$result" | grep -q "Chaincode invoke successful"; then
        log_success "UpdateLogisticsRecord 执行成功"
        return 0
    else
        log_error "UpdateLogisticsRecord 执行失败: $result"
        return 1
    fi
}

# === 测试8: 获取所有产品 ===
test_get_all_products() {
    log_test "测试8: 获取所有产品 (GetAllProducts)"

    local result
    result=$(peer chaincode query \
        -C $CHANNEL_NAME \
        -n $CC_NAME \
        -c '{"function":"GetAllProducts","Args":[]}')

    if echo "$result" | grep -q '"id"' && echo "$result" | grep -q '"name"'; then
        log_success "GetAllProducts 执行成功"
        echo "产品列表: $result"
        return 0
    else
        log_error "GetAllProducts 执行失败: $result"
        return 1
    fi
}

# === 测试9: 按所有者查询产品 ===
test_query_by_owner() {
    log_test "测试9: 按所有者查询产品 (QueryProductsByOwner)"

    local result
    result=$(peer chaincode query \
        -C $CHANNEL_NAME \
        -n $CC_NAME \
        -c '{"function":"QueryProductsByOwner","Args":["distributor"]}')

    if echo "$result" | grep -q '"owner":"distributor"'; then
        log_success "QueryProductsByOwner 执行成功 - 找到 distributor 的产品"
        echo "Distributor的产品: $result"
        return 0
    else
        log_error "QueryProductsByOwner 执行失败或未找到产品: $result"
        return 1
    fi
}

# === 测试10: 获取物流历史 ===
test_get_logistics_history() {
    log_test "测试10: 获取物流历史 (GetLogisticsHistory)"

    local result
    result=$(peer chaincode query \
        -C $CHANNEL_NAME \
        -n $CC_NAME \
        -c "{\"function\":\"GetLogisticsHistory\",\"Args\":[\"$TEST_PRODUCT_ID\"]}")

    if echo "$result" | grep -q '"productId":"'$TEST_PRODUCT_ID'"' || echo "$result" | grep -q '\[\]'; then
        log_success "GetLogisticsHistory 执行成功"
        echo "物流历史: $result"
        return 0
    else
        log_error "GetLogisticsHistory 执行失败: $result"
        return 1
    fi
}

# === 测试11: 获取产品历史 ===
test_get_product_history() {
    log_test "测试11: 获取产品历史 (GetHistoryForProduct)"

    local result
    result=$(peer chaincode query \
        -C $CHANNEL_NAME \
        -n $CC_NAME \
        -c "{\"function\":\"GetHistoryForProduct\",\"Args\":[\"$TEST_PRODUCT_ID\"]}")

    if echo "$result" | grep -q '"id":"'$TEST_PRODUCT_ID'"' || echo "$result" | grep -q '\[\]'; then
        log_success "GetHistoryForProduct 执行成功"
        echo "产品历史: $result"
        return 0
    else
        log_error "GetHistoryForProduct 执行失败: $result"
        return 1
    fi
}

# === 主测试函数 ===
main() {
    echo "=========================================="
    echo "  供应链链码功能测试工具"
    echo "=========================================="

    local passed=0
    local failed=0

    # 切换到项目根目录
    cd /home/anmin/blockchain_project || {
        log_error "无法切换到项目目录"
        exit 1
    }

    # 检查网络连接
    check_network || exit 1

    echo ""
    echo "开始执行功能测试..."
    echo "=========================================="

    # 执行所有测试
    tests=(
        "test_init_ledger:初始化账本"
        "test_create_product:创建产品"
        "test_read_product:读取产品"
        "test_transfer_product:转移产品"
        "test_create_transaction:创建交易"
        "test_read_transaction:读取交易"
        "test_update_logistics:更新物流记录"
        "test_get_all_products:获取所有产品"
        "test_query_by_owner:按所有者查询"
        "test_get_logistics_history:获取物流历史"
        "test_get_product_history:获取产品历史"
    )

    for test_info in "${tests[@]}"; do
        IFS=':' read -r test_func test_name <<< "$test_info"
        echo ""
        if $test_func; then
            ((passed++))
        else
            ((failed++))
        fi
    done

    echo ""
    echo "=========================================="
    echo "测试结果总结:"
    echo "✅ 通过: $passed"
    echo "❌ 失败: $failed"
    echo "总计: $((passed + failed))"
    echo "=========================================="

    if [ $failed -eq 0 ]; then
        log_success "所有测试通过！链码功能正常"
        exit 0
    else
        log_error "部分测试失败，请检查链码功能"
        exit 1
    fi
}

# 执行主函数
main "$@"