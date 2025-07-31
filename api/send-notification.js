const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // 处理跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持POST请求' });
  }

  try {
    // 从请求体获取数据，并设置默认值防止未定义
    const { 
      targetUrl = '未指定', 
      visitTime = new Date().toLocaleString(), 
      browser = '未知', 
      os = '未知', 
      screen = { width: '未知', height: '未知', pixelRatio: '未知' }, 
      referrer = '无', 
      userAgent = '未知', 
      ip = '未知', 
      location = { country: '未知', region: '未知', city: '未知' } 
    } = req.body;

    // 配置126邮箱SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.126.com',
      port: process.env.SMTP_PORT || 465,
      secure: true, // 465端口需要开启SSL
      auth: {
        user: process.env.SMTP_USER, // 你的126邮箱（如xxx@126.com）
        pass: process.env.SMTP_PASS  // 126邮箱授权码（非登录密码）
      }
    });

    // 构建邮件内容
    const emailContent = `
访问通知详情:
--------------------------
访问时间: ${visitTime}
目标页面: ${targetUrl}
IP地址: ${ip}
地理位置: ${location.country} - ${location.region} - ${location.city}
浏览器: ${browser}
操作系统: ${os}
屏幕信息: ${screen.width}x${screen.height} (DPR: ${screen.pixelRatio})
引用页面: ${referrer}
User-Agent: ${userAgent}
--------------------------
    `.trim();

    // 发送邮件
    await transporter.sendMail({
      from: `"网站访问通知" <${process.env.SMTP_USER}>`,
      to: process.env.TO_EMAIL, // 接收通知的邮箱
      subject: `新访问提醒: ${targetUrl}`,
      text: emailContent
    });

    // 返回成功响应
    return res.status(200).json({ success: true, message: '通知已发送' });

  } catch (error) {
    console.error('邮件发送失败:', error);
    return res.status(500).json({ 
      error: '服务器内部错误', 
      details: error.message || '未知错误' 
    });
  }
};