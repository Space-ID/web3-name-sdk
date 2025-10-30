#!/bin/bash

# .four 域名解析示例 - 一键部署脚本

set -e

echo "🚀 开始部署 .four 域名解析示例到 Vercel..."

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装"
    echo "请运行: npm i -g vercel"
    exit 1
fi

# 检查是否已登录 Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 请先登录 Vercel..."
    vercel login
fi

# 确保在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在 four-domain 目录中运行此脚本"
    exit 1
fi

# 清理并重新安装依赖
echo "📦 安装依赖..."
rm -rf node_modules package-lock.json
npm install

# 测试构建
echo "🔨 测试构建..."
npm run build

# 部署到 Vercel
echo "🚀 部署到 Vercel..."
vercel --prod

echo "✅ 部署完成！"
echo ""
echo "🎉 你的 .four 域名解析示例已成功部署！"
echo ""
echo "📋 QA 测试清单："
echo "  1. 测试 farm17bc.four 域名解析"
echo "  2. 测试 币安人生.four 中文域名"
echo "  3. 测试反向解析功能"
echo "  4. 测试错误处理"
echo "  5. 测试响应式设计"
echo ""
echo "🔗 请将部署 URL 分享给 QA 团队进行测试！"
