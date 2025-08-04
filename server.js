require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const proxyIp = require('./api/proxy-ip.js');
const sendNotification = require('./api/send-notification.js');

app.get('/api/proxy-ip', proxyIp);
app.post('/api/send-notification', sendNotification);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});