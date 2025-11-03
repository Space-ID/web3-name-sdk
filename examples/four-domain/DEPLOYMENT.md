# .four 域名解析示例 - Vercel 部署指南

## 快速部署

### 方法一：通过 Vercel CLI（推荐）

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **在项目目录中部署**
   ```bash
   cd examples/four-domain
   vercel
   ```

4. **按照提示配置**
   - Set up and deploy? `Y`
   - Which scope? 选择你的账户
   - Link to existing project? `N`
   - What's your project's name? `four-domain-resolver`
   - In which directory is your code located? `./`

5. **生产部署**
   ```bash
   vercel --prod
   ```

### 方法二：通过 Vercel Dashboard

1. **准备 Git 仓库**
   ```bash
   cd examples/four-domain
   git init
   git add .
   git commit -m "Initial commit: .four domain resolver example"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **在 Vercel Dashboard 中**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "New Project"
   - 导入你的 Git 仓库
   - 配置构建设置（通常会自动检测）

## 构建配置

项目已包含以下配置文件：

### `vercel.json`
```json
{
  "name": "four-domain-resolver",
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

### 环境变量（如需要）
如果需要配置环境变量，在 Vercel Dashboard 中：
1. 进入项目设置
2. 点击 "Environment Variables"
3. 添加所需变量

## 部署后验证

部署完成后，你会得到一个类似这样的 URL：
- `https://four-domain-resolver.vercel.app`
- `https://four-domain-resolver-<hash>.vercel.app`

### 测试功能

1. **正向解析测试**
   - 选择 "farm17bc.four" 测试用例
   - 点击 "域名 → 地址 (getAddress)"
   - 应该返回: `0x17bc015607Fdf93e7C949e9Ca22f96907cFBeF88`

2. **中文域名测试**
   - 选择 "币安人生.four" 测试用例
   - 点击 "域名 → 地址 (getAddress)"
   - 应该返回: `0x924fa68a0FC644485b8df8AbfA0A41C2e7744444`

3. **反向解析测试**
   - 选择任一测试用例
   - 点击 "地址 → 域名 (getName)"
   - 应该返回对应的域名

## QA 测试指南

### 测试场景

1. **基础功能测试**
   - [ ] 正向解析：域名转地址
   - [ ] 反向解析：地址转域名
   - [ ] 中文域名支持
   - [ ] 错误处理（无效域名/地址）

2. **解析器对比测试**
   - [ ] FourResolver 直接调用
   - [ ] Web3Name 集成调用
   - [ ] 结果一致性验证

3. **性能测试**
   - [ ] 解析速度（通常 < 1秒）
   - [ ] 超时处理
   - [ ] 网络错误处理

4. **用户体验测试**
   - [ ] 响应式设计（移动端/桌面端）
   - [ ] 加载状态显示
   - [ ] 错误信息清晰
   - [ ] 结果展示友好

### 测试数据

**有效域名测试：**
- `farm17bc.four` → `0x17bc015607Fdf93e7C949e9Ca22f96907cFBeF88`
- `币安人生.four` → `0x924fa68a0FC644485b8df8AbfA0A41C2e7744444`

**无效域名测试：**
- `nonexistent.four` → 应返回 "未找到结果"
- `invalid-format` → 应显示格式错误

**地址格式测试：**
- 有效地址：`0x17bc015607Fdf93e7C949e9Ca22f96907cFBeF88`
- 无效地址：`0xinvalid` → 应显示格式错误

## 故障排除

### 常见部署问题

1. **构建失败**
   ```bash
   # 本地测试构建
   npm run build
   ```

2. **依赖问题**
   ```bash
   # 清理并重新安装
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **内存不足**
   - 在 `vercel.json` 中增加内存限制
   ```json
   {
     "functions": {
       "app/api/**/*.js": {
         "memory": 1024
       }
     }
   }
   ```

### 运行时问题

1. **网络超时**
   - 检查 BSC 网络连接
   - 增加超时时间设置

2. **合约调用失败**
   - 验证合约地址：`0xd2865AFd9684c4b04c25B2205710484b2879d8Ad`
   - 检查 BSC 网络状态

## 更新部署

### 自动部署
如果使用 Git 集成，推送到主分支会自动触发部署：
```bash
git add .
git commit -m "Update: description of changes"
git push origin main
```

### 手动部署
```bash
vercel --prod
```

## 监控和日志

1. **访问日志**
   - Vercel Dashboard → Project → Functions
   - 查看实时日志和错误信息

2. **性能监控**
   - Vercel Analytics（如已启用）
   - 监控页面加载时间和用户交互

## 自定义域名（可选）

1. 在 Vercel Dashboard 中添加自定义域名
2. 配置 DNS 记录
3. 等待 SSL 证书自动配置

---

**部署完成后，请将 URL 分享给 QA 团队进行测试！** 🚀
