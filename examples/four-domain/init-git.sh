#!/bin/bash

# 初始化 Git 仓库用于 Vercel 部署

set -e

echo "📝 初始化 Git 仓库..."

# 初始化 Git 仓库
git init

# 添加 .gitignore
cat > .gitignore << EOF
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production build
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# Stores VSCode versions used for testing VSCode extensions
.vscode-test
EOF

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: .four domain resolver example

Features:
- Forward resolution: domain → address
- Reverse resolution: address → domain
- Chinese domain support
- Dual resolver support (FourResolver & Web3Name)
- Responsive design
- Real-time testing interface

Ready for Vercel deployment!"

echo "✅ Git 仓库初始化完成！"
echo ""
echo "🔗 接下来的步骤："
echo "  1. 在 GitHub/GitLab 创建新仓库"
echo "  2. 添加远程仓库: git remote add origin <repo-url>"
echo "  3. 推送代码: git push -u origin main"
echo "  4. 在 Vercel 中导入仓库进行部署"
echo ""
echo "或者直接使用 Vercel CLI:"
echo "  ./deploy.sh"
