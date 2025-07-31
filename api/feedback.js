const nodemailer = require('nodemailer');
const FormData = require('form-data');
const Mailgun = require('mailgun.js');
const fs = require('fs');
const path = require('path');
const os = require('os');
const multiparty = require('multiparty');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  try {
    const formData = new multiparty.Form();
    const data = await new Promise((resolve, reject) => {
      formData.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const { name, email, message, contactMe } = data.fields;
    const images = data.files.images || [];

    const tempDir = path.join(os.tmpdir(), 'feedback-images');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const attachments = [];
    for (const image of images) {
      const tempPath = path.join(tempDir, image.originalFilename);
      fs.renameSync(image.path, tempPath);
      attachments.push({
        filename: image.originalFilename,
        path: tempPath,
        cid: image.originalFilename
      });
    }

    const emailContent = `
      <h2>用户反馈</h2>
      <p><strong>姓名/昵称:</strong> ${name}</p>
      <p><strong>邮箱地址:</strong> ${email}</p>
      <p><strong>反馈内容:</strong> ${message}</p>
      <p><strong>是否希望联系:</strong> ${contactMe ? '是' : '否'}</p>
      ${attachments.length > 0 ? '<p><strong>附件:</strong> ' + attachments.length + '张图片</p>' : ''}
    `;

    const transporter = nodemailer.createTransport({
      host: 'smtp.126.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"反馈系统" <${process.env.EMAIL_USER}>`,
      to: 'huifeidexiaogougou@126.com',
      subject: '用户反馈 - ' + name,
      html: emailContent,
      attachments: attachments
    };

    await transporter.sendMail(mailOptions);

    for (const attachment of attachments) {
      try {
        fs.unlinkSync(attachment.path);
      } catch (err) {
        console.error('删除临时文件失败:', err);
      }
    }

    return res.status(200).json({ success: true, message: '反馈已收到，邮件已发送' });
  } catch (error) {
    console.error('处理反馈时出错:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};