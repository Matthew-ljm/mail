import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // 设置响应头
    res.setHeader('Content-Type', 'application/json');
    
    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: '只允许POST请求',
            status: 405
        });
    }

    try {
        const { ipData, email } = req.body;
        
        // 验证必要参数
        if (!ipData || !email) {
            return res.status(400).json({
                error: '缺少必要参数: ipData或email',
                status: 400
            });
        }

        // 检查环境变量是否配置
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            return res.status(500).json({
                error: '邮件服务未配置',
                message: '请检查EMAIL_USER和EMAIL_PASSWORD环境变量',
                status: 500
            });
        }

        // 创建邮件传输器 - 优化了配置以解决认证问题
        const transporter = nodemailer.createTransport({
            host: 'smtp.126.com',
            port: 465,
            secure: true, // 使用SSL
            tls: {
                rejectUnauthorized: false // 解决可能的证书问题
            },
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            logger: true, // 启用日志便于调试
            debug: true // 启用调试模式
        });

        // 验证邮件配置
        await transporter.verify();

        // 发送邮件
        const info = await transporter.sendMail({
            from: `"IP信息服务" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '您的IP信息',
            text: `IP信息详情:\n\n${JSON.stringify(ipData, null, 2)}`,
            html: `
                <h2>IP信息详情</h2>
                <pre>${JSON.stringify(ipData, null, 2)}</pre>
                <p>时间: ${new Date().toLocaleString()}</p>
            `
        });

        console.log('邮件发送成功: %s', info.messageId);

        // 返回成功响应
        return res.status(200).json({
            success: true,
            message: '邮件已成功发送',
            messageId: info.messageId,
            status: 200
        });
        
    } catch (error) {
        console.error('邮件发送失败:', error);
        // 提供更详细的错误信息
        let errorMessage = '邮件发送失败';
        if (error.code === 'EAUTH') {
            errorMessage = '邮箱认证失败，请检查账号和授权码';
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = '无法连接到邮件服务器，请检查SMTP配置';
        }
        
        return res.status(500).json({
            error: errorMessage,
            message: error.message,
            code: error.code,
            status: 500
        });
    }
}
