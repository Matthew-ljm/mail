module.exports = async function handler(req, res) {
  try {
    // 设置跨域头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    // 多环境兼容获取用户真实IP
    const userIp = 
      req.headers['x-vercel-forwarded-for'] || // Vercel
      req.headers['x-forwarded-for'] || // 反向代理
      req.headers['x-real-ip'] || // Nginx等
      req.socket.remoteAddress; // 直接连接

    // 处理IP格式（去除IPv6前缀）
    const cleanIp = userIp?.split(',')[0]?.replace('::ffff:', '') || '未知IP';

    // 调用IP信息接口（带超时）
    const fetchWithTimeout = async (url, timeout = 5000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, { signal: controller.signal });
        return response.ok ? await response.json() : null;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    // 优先调用ipapi.co，失败则用ipwho.is
    let ipData = await fetchWithTimeout(`https://ipapi.co/${cleanIp}/json/`);
    if (!ipData) {
      ipData = await fetchWithTimeout(`https://ipwho.is/${cleanIp}`);
    }

    // 处理接口返回为空的情况
    if (!ipData || !ipData.ip) {
      ipData = {
        ip: cleanIp,
        country_name: '未知',
        region: '未知',
        city: '未知',
        note: 'IP信息接口无返回，使用原始IP'
      };
    }

    return res.status(200).json(ipData);

  } catch (error) {
    console.error('IP代理接口错误:', error);
    // 错误时至少返回捕获到的IP
    const fallbackIp = req.headers['x-vercel-forwarded-for'] || req.socket.remoteAddress || '未知';
    return res.status(200).json({
      ip: fallbackIp,
      country_name: '未知',
      region: '未知',
      city: '未知',
      error: `服务器获取IP失败: ${error.message}`
    });
  }
};