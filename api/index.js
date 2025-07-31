const nodemailer = require('nodemailer');

// 处理跨域
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持POST请求' });
  }

  try {
    const { 
      targetUrl, visitTime, browser, os, screen, referrer, userAgent, ip, location 
    } = req.body;

    // 1. 配置SMTP（126邮箱）
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.126.com',
      port: process.env.SMTP_PORT || 465,
      secure: true, // 465端口需要开启
      auth: {
        user: process.env.SMTP_USER, // 你的126邮箱（如xxx@126.com）
        pass: process.env.SMTP_PASS  // 126邮箱授权码（不是登录密码）
      }
    });

    // 2. 构建邮件内容
    const emailContent = `
      访问通知:
      时间: ${visitTime}
      访问页面: ${targetUrl}
      IP地址: ${ip}
      位置: ${location.country} - ${location.region} - ${location.city}
      浏览器: ${browser}
      操作系统: ${os}
      屏幕分辨率: ${screen.width}x${screen.height}
      引用页: ${referrer}
      User-Agent: ${userAgent}
    `.trim();

    // 3. 发送邮件
    await transporter.sendMail({
      from: `"访问通知" <${process.env.SMTP_USER}>`,
      to: process.env.TO_EMAIL, // 接收通知的邮箱
      subject: `新访问: ${targetUrl}`,
      text: emailContent
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('发送失败:', error); // 查看Vercel日志获取详细错误
    return res.status(500).json({ error: '服务器内部错误', details: error.message });
  }
};