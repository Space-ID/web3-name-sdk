# .four 域名解析使用指南

本 SDK 现已支持 `.four` 域名的解析功能，可以将 `.four` 域名解析为对应的以太坊地址。

## 功能特性

- ✅ 支持 `.four` 域名到地址的解析
- ✅ 支持中文域名（如 `币安人生.four`）
- ✅ 集成到 Web3Name 主类中
- ✅ 独立的 FourResolver 类可单独使用
- ✅ 基于 BSC 链上的合约 `0xd2865AFd9684c4b04c25B2205710484b2879d8Ad`

## 使用方法

### 方法一：使用 Web3Name（推荐）

```javascript
import { Web3Name } from '@web3-name-sdk/core'

const web3Name = new Web3Name({ timeout: 10000 })

// 解析 .four 域名
const address1 = await web3Name.getAddress('farm17bc.four')
console.log(address1) // 0x17bc015607Fdf93e7C949e9Ca22f96907cFBeF88

// 支持中文域名
const address2 = await web3Name.getAddress('币安人生.four')
console.log(address2) // 0x924fa68a0FC644485b8df8AbfA0A41C2e7744444
```

### 方法二：使用 FourResolver

```javascript
import { FourResolver } from '@web3-name-sdk/core'

const fourResolver = new FourResolver({ timeout: 10000 })

// 解析 .four 域名
const address = await fourResolver.getAddress('farm17bc.four')
console.log(address) // 0x17bc015607Fdf93e7C949e9Ca22f96907cFBeF88
```

## 技术实现

### 合约信息
- **网络**: BSC (Binance Smart Chain)
- **合约地址**: `0xd2865AFd9684c4b04c25B2205710484b2879d8Ad`
- **方法**: `getDomainInfo(string domain)`

### 返回数据格式
合约返回四个值：
1. `registry` (address): 注册表地址
2. `owner` (address): 域名所有者地址 ⭐ **这是我们需要的地址**
3. `timestamp` (uint256): 时间戳
4. `status` (uint256): 状态标志（1 表示有效）

### 解析逻辑
1. 调用合约的 `getDomainInfo` 方法
2. 检查返回的 `status` 是否为 1（有效）
3. 检查 `owner` 地址是否不为零地址
4. 返回 `owner` 地址作为域名解析结果

## 测试结果

已成功测试的域名：
- `farm17bc.four` → `0x17bc015607Fdf93e7C949e9Ca22f96907cFBeF88`
- `币安人生.four` → `0x924fa68a0FC644485b8df8AbfA0A41C2e7744444`

## 错误处理

- 域名不存在时返回 `null`
- 网络错误时返回 `null` 并记录错误日志
- 支持超时设置，防止长时间等待

## 注意事项

1. **反向解析**: 目前 `.four` 域名系统不支持从地址反向解析到域名
2. **网络**: 解析基于 BSC 网络，确保网络连接正常
3. **中文支持**: 完全支持中文域名，无需特殊处理
4. **缓存**: 建议在生产环境中实现适当的缓存机制以提高性能
