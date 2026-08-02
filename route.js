const https = require('https');
const AMAP_KEY = process.env.AMAP_KEY;

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => resolve(JSON.parse(buf)));
    }).on('error', reject);
  });
}

async function getGeo(address) {
  const url = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(address)}&key=${AMAP_KEY}`;
  const res = await httpGet(url);
  if (res.status === '1' && res.geocodes && res.geocodes.length > 0) {
    return res.geocodes[0].location;
  }
  return null;
}

async function getRoute(oLoc, dLoc) {
  const url = `https://restapi.amap.com/v3/direction/driving?origin=${oLoc}&destination=${dLoc}&key=${AMAP_KEY}`;
  const res = await httpGet(url);
  if (res.status === '1' && res.route && res.route.paths && res.route.paths.length > 0) {
    const path = res.route.paths[0];
    return {
      distance: (path.distance / 1000).toFixed(2),
      duration: Math.round(path.duration / 60)
    };
  }
  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.end(JSON.stringify({ code: -1, msg: '仅支持POST请求' }));
  }
  const { start, end } = req.body;
  if (!start || !end) {
    return res.end(JSON.stringify({ code: -1, msg: '起点终点不能为空' }));
  }
  try {
    const origin = await getGeo(start);
    const dest = await getGeo(end);
    if (!origin || !dest) {
      return res.end(JSON.stringify({ code: 0, data: null, msg: '地址解析失败' }));
    }
    const routeInfo = await getRoute(origin, dest);
    if (!routeInfo) {
      return res.end(JSON.stringify({ code: 0, data: null, msg: '未找到路线' }));
    }
    return res.end(JSON.stringify({ code: 0, data: routeInfo }));
  } catch (err) {
    return res.end(JSON.stringify({ code: -1, msg: '接口异常' }));
  }
};