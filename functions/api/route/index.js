const AMAP_KEY = process.env.AMAP_KEY;

async function httpGet(url) {
  try {
    const resp = await fetch(url);
    return await resp.json();
  } catch (e) {
    return null;
  }
}

async function getGeo(address) {
  const url = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(address)}&key=${AMAP_KEY}`;
  const res = await httpGet(url);
  if (res && res.status === '1' && res.geocodes && res.geocodes.length > 0) {
    return res.geocodes[0].location;
  }
  return null;
}

async function getRoute(oLoc, dLoc) {
  const url = `https://restapi.amap.com/v3/direction/driving?origin=${oLoc}&destination=${dLoc}&key=${AMAP_KEY}`;
  const res = await httpGet(url);
  if (res && res.status === '1' && res.route && res.route.paths && res.route.paths.length > 0) {
    return res.route.paths[0];
  }
  return null;
}

export async function onRequest({ request }) {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    const body = await request.json();
    const { startAddr, endAddr } = body;
    if (!startAddr || !endAddr) {
      return new Response(JSON.stringify({ code: -1, msg: "缺少起点或终点地址" }), { headers });
    }

    const oLoc = await getGeo(startAddr);
    const dLoc = await getRoute(endAddr);
    if (!oLoc || !dLoc) {
      return new Response(JSON.stringify({ code: -2, msg: "地址解析失败" }), { headers });
    }

    const pathInfo = await getRoute(oLoc, dLoc);
    if (!pathInfo) {
      return new Response(JSON.stringify({ code: -3, msg: "路线计算失败" }), { headers });
    }

    const result = {
      start: startAddr,
      end: endAddr,
      distance: pathInfo.distance,
      duration: pathInfo.duration
    };
    return new Response(JSON.stringify({ code: 0, data: result }), { headers });
  } catch (err) {
    return new Response(JSON.stringify({ code: -99, msg: "服务异常", error: err.message }), { headers });
  }
}
