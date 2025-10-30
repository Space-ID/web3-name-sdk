# .four 域名解析示例

这是一个展示如何使用 Web3Name SDK 解析 `.four` 域名的 React 示例应用。

## 功能特性

- ✅ **正向解析**: 将 `.four` 域名解析为以太坊地址
- ✅ **反向解析**: 将以太坊地址解析为 `.four` 域名
- ✅ **中文域名支持**: 完全支持中文字符的域名
- ✅ **双解析器**: 支持 FourResolver 和 Web3Name 两种解析方式
- ✅ **实时测试**: 提供预设测试用例和自定义输入
- ✅ **响应式设计**: 适配桌面和移动设备

## 预设测试用例

1. **farm17bc.four** - 英文域名测试
   - 域名: `farm17bc.four`
   - 地址: `0x17bc015607Fdf93e7C949e9Ca22f96907cFBeF88`

2. **币安人生.four** - 中文域名测试
   - 域名: `币安人生.four`
   - 地址: `0x924fa68a0FC644485b8df8AbfA0A41C2e7744444`

3. **自定义域名** - 输入任意 `.four` 域名或地址

## 快速开始

### 1. 安装依赖

```bash
cd examples/four-domain
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 打开浏览器

访问 `http://localhost:5173` 查看示例应用。

## 使用方法

### 正向解析（域名 → 地址）

1. 选择解析器类型（FourResolver 或 Web3Name）
2. 选择测试用例或输入自定义域名
3. 选择 "域名 → 地址 (getAddress)" 方法
4. 设置超时时间
5. 点击运行按钮

### 反向解析（地址 → 域名）

1. 选择解析器类型
2. 选择测试用例或输入自定义地址
3. 选择 "地址 → 域名 (getName)" 方法
4. 设置超时时间
5. 点击运行按钮

## 技术实现

### 解析器对比

| 特性 | FourResolver | Web3Name |
|------|-------------|----------|
| 直接调用 | ✅ | ❌ |
| 集成方式 | 独立使用 | 统一接口 |
| 性能 | 更快 | 稍慢 |
| 扩展性 | 单一 TLD | 多 TLD 支持 |

### 核心代码示例

```typescript
import { FourResolver, Web3Name } from '@web3-name-sdk/core'

// 使用 FourResolver
const fourResolver = new FourResolver({ timeout: 10000 })
const address = await fourResolver.getAddress('farm17bc.four')
const domain = await fourResolver.getName('0x17bc015607Fdf93e7C949e9Ca22f96907cFBeF88')

// 使用 Web3Name
const web3Name = new Web3Name({ timeout: 10000 })
const address2 = await web3Name.getAddress('farm17bc.four')
const domain2 = await web3Name.getDomainName({ 
  address: '0x17bc015607Fdf93e7C949e9Ca22f96907cFBeF88',
  queryTldList: ['four']
})
```

## 网络信息

- **区块链**: BSC (Binance Smart Chain)
- **合约地址**: `0xd2865AFd9684c4b04c25B2205710484b2879d8Ad`
- **合约方法**: 
  - `getDomainInfo(string)` - 获取域名信息
  - `getDomainByCA(address)` - 通过地址获取域名

## 故障排除

### 常见问题

1. **解析超时**
   - 检查网络连接
   - 增加超时时间
   - 确认 BSC 网络可访问

2. **域名格式错误**
   - 确保域名以 `.four` 结尾
   - 检查中文字符编码

3. **地址格式错误**
   - 确保地址是有效的以太坊地址格式 (0x + 40位十六进制)

### 调试建议

1. 打开浏览器开发者工具查看控制台日志
2. 检查网络请求是否成功
3. 验证输入格式是否正确

## 开发

### 项目结构

```
four-domain/
├── src/
│   ├── App.tsx          # 主应用组件
│   ├── App.css          # 样式文件
│   ├── main.tsx         # 入口文件
│   └── vite-env.d.ts    # TypeScript 声明
├── public/              # 静态资源
├── package.json         # 项目配置
└── README.md           # 说明文档
```

### 构建生产版本

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

## 许可证

本示例遵循项目主许可证。