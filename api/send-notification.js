const nodemailer = require('nodemailer');

// 验证邮箱格式
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

module.exports = async (req, res) => {
  // 设置CORS头
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
    // 验证请求体
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: '无效的请求体' });
    }

    // 解构请求体参数（带默认值）
    const {
      targetUrl = '未指定',
      visitTime = new Date().toLocaleString('zh-CN'),
      browser = '未知',
      os = '未知',
      screen = { width: '未知', height: '未知', pixelRatio: '未知' },
      referrer = '无',
      userAgent = '未知',
      ip = '未知',
      location = { country: '未知', region: '未知', city: '未知' },
      timezone = '未知',
      languages = [],
      cpuCores = '未知'
    } = req.body;

    // 验证邮箱配置
    if (!isValidEmail(process.env.TO_EMAIL)) {
      throw new Error('邮件接收方配置无效');
    }

    // 创建邮件传输器
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.126.com',
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      // 增加超时设置
      connectionTimeout: 5000,
      greetingTimeout: 5000
    });

    // 构建HTML邮件内容
    const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px;">
        新的网站访问通知
      </h2>
      
      <h3 style="color: #3498db; margin-top: 20px;">基本信息</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 120px;">访问时间</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${visitTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">目标URL</td>
          <td style="padding: 8px; border: 1px solid #ddd;">
            <a href="${targetUrl}">${targetUrl}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">来源页面</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${referrer}</td>
        </tr>
      </table>

      <h3 style="color: #3498db;">设备信息</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 120px;">浏览器</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${browser}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">操作系统</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${os}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">屏幕分辨率</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${screen.width} × ${screen.height}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">CPU核心数</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${cpuCores}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">时区</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${timezone}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">语言</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${languages.join(', ')}</td>
        </tr>
      </table>

      <h3 style="color: #3498db;">位置信息</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 120px;">IP地址</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${ip}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">地理位置</td>
          <td style="padding: 8px; border: 1px solid #ddd;">
            ${location.country} > ${location.region} > ${location.city}
          </td>
        </tr>
      </table>

      <h3 style="color: #3498db;">User Agent</h3>
      <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">
        ${userAgent}
      </div>

      <div style="margin-top: 30px; font-size: 12px; color: #95a5a6; text-align: center;">
        此邮件由网站访问跟踪系统自动发送
      </div>
    </div>
    `;

    // 发送邮件
    await transporter.sendMail({
      from: `"网站访问跟踪系统" <${process.env.SMTP_USER}>`,
      to: process.env.TO_EMAIL,
      subject: `[访问跟踪] 来自 ${ip} 的新访问 - ${targetUrl}`,
      html: emailHtml,
      text: `新的网站访问来自IP: ${ip}\n访问URL: ${targetUrl}\n时间: ${visitTime}`
    });

    // 返回成功响应
    return res.status(200).json({ success: true, message: '通知邮件已发送' });

  } catch (error) {
    console.error('邮件发送失败:', error);
    return res.status(500).json({ 
      error: '服务器内部错误',
      message: error.message || '未知错误'
    });
  }
};