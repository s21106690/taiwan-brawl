#!/bin/bash
# 寶島大亂鬥：一鍵啟動腳本

echo "⚔️  啟動寶島大亂鬥：戰起來！"
echo "================================"

# 啟動後端
echo "🔥 啟動後端伺服器 (port 3001)..."
cd "$(dirname "$0")/backend"
node src/server.js &
BACKEND_PID=$!

sleep 1

# 啟動前端
echo "🎮 啟動前端 (port 3000)..."
cd "$(dirname "$0")/frontend"
npx vite &
FRONTEND_PID=$!

echo ""
echo "✅ 啟動完成！"
echo "   前端：http://localhost:3000"
echo "   後端：http://localhost:3001"
echo ""
echo "按 Ctrl+C 停止所有服務"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '已停止'; exit" INT
wait
