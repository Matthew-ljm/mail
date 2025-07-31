const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const {
      targetUrl,
      device,
      ipInfo,
      timestamp
    } = req.body;

    // 配置邮件 (使用环境变量)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.126.com',
      port: process.env.SMTP_PORT || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // 生成邮件内容
    const mailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2 style="color: #2c3e50;">📡 新的访问记录</h2>
      
      <h3>目标链接</h3>
      <p><a href="${targetUrl}">${targetUrl}</a></p>
      
      <h3>IP信息</h3>
      <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">
        <tr>
          <td><strong>IP地址</strong></td>
          <td>${ipInfo.ip}</td>
        </tr>
        <tr>
          <td><strong>地理位置</strong></td>
          <td>${ipInfo.city}, ${ipInfo.region}, ${ipInfo.country_name}</td>
        </tr>
        <tr>
          <td><strong>运营商</strong></td>
          <td>${ipInfo.org}</td>
        </tr>
        <tr>
          <td><strong>时区</strong></td>
          <td>${ipInfo.timezone || '未知'}</td>
        </tr>
      </table>
      
      <h3>设备信息</h3>
      <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px;">
${JSON.stringify(device, null, 2)}
      </pre>
      
      <p style="color: #999; font-size: 0.8rem;">
        记录时间: ${new Date(timestamp).toLocaleString()}
      </p>
    </div>
    `;

    // 发送邮件
    await transporter.sendMail({
      from: `"访问跟踪系统" <${process.env.SMTP_USER}>`,
      to: process.env.ALERT_EMAIL,
      subject: `新访问: ${ipInfo.ip} → ${targetUrl}`,
      html: mailHtml
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('跟踪错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};