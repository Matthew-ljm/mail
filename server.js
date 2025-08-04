require('dotenv').config(); // 加载环境变量
const express = require('express');
const path = require('path');
const proxyIp = require('./api/proxy-ip');
const sendNotification = require('./api/send-notification'); // 修正路由对应关系

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.static(path.join(__dirname))); // 修正静态文件路径（指向根目录）

// API路由（修正路由与文件对应关系）
app.get('/api/proxy-ip', proxyIp);
app.post('/api/send-notification', sendNotification); // 统一路由名称

// 首页（修正文件路径）
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});