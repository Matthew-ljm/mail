const express = require('express');
const path = require('path');
const proxyIp = require('./api/proxy-ip');
const sendIp = require('./api/send-ip');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API路由
app.get('/api/proxy-ip', proxyIp);
app.post('/api/send-ip', sendIp);

// 首页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
