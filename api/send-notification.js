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
    // 从请求体获取ipapi的原始数据
    const { ipapiData, visitTime = new Date().toLocaleString() } = req.body;

    // 配置邮箱SMTP（默认126邮箱）
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.126.com',
      port: process.env.SMTP_PORT || 465,
      secure: true, // 465端口需要开启SSL
      auth: {
        user: process.env.SMTP_USER, // 发送邮箱账号
        pass: process.env.SMTP_PASS  // 邮箱授权码（非登录密码）
      }
    });

    // 构建邮件内容 - 直接使用ipapi的原始数据
    const emailContent = `
访问通知详情:
--------------------------
访问时间: ${visitTime}
IPAPI原始数据: 
${JSON.stringify(ipapiData, null, 2)}
--------------------------
    `.trim();

    // 发送邮件
    await transporter.sendMail({
      from: `"网站访问通知" <${process.env.SMTP_USER}>`,
      to: process.env.TO_EMAIL, // 接收通知的邮箱
      subject: `新访问提醒: ${new Date().toLocaleString()}`,
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