#!/bin/bash

# 使用 Node.js 18.18.0 或更高版本
NODE_VERSION=18.18.0

# 顯示當前環境信息
echo "Current Node version: $(node -v)"
echo "Current npm version: $(npm -v)"

# 安裝依賴
npm ci

# 構建應用
npm run build

# 將 _redirects 文件複製到構建目錄
if [ -d "dist" ]; then
  cp public/_redirects dist/
  echo "Build completed and _redirects copied to dist"
else
  echo "Warning: dist directory not found"
fi 