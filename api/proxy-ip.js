export default async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    // 关键：从请求头中获取用户真实IP（Vercel环境专用）
    const userIp = req.headers['x-vercel-forwarded-for'] || 
                   req.headers['x-forwarded-for'] || 
                   req.socket.remoteAddress;

    // 调用IP信息接口时，显式传入用户IP
    const response = await fetch(`https://ipapi.co/${userIp}/json/`);
    const data = await response.json();

    // 如果获取失败， fallback 到直接返回用户IP
    if (!data.ip) {
      data.ip = userIp;
      data.country = 'CN'; // 可手动补充默认值
      data.timezone = 'Asia/Shanghai';
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('获取IP信息失败:', error);
    return res.status(200).json({
      ip: req.headers['x-vercel-forwarded-for'] || '未知',
      country: 'CN',
      timezone: 'Asia/Shanghai',
      error: 'IP信息获取失败，但已捕获用户IP'
    });
  }
}