export default async function handler(request) {
  const AMAP_KEY = process.env.AMAP_KEY;
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (request.method === "OPTIONS") {
    return new Response(JSON.stringify({code:0}), { status:200, headers });
  }

  if (!AMAP_KEY) {
    return new Response(JSON.stringify({code:-1,msg:"未配置AMAP_KEY环境变量"}), { headers });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({code:-1,msg:"仅支持POST请求"}), { headers });
  }

  try {
    const body = await request.json();
    const {startAddr, endAddr} = body;
    if (!startAddr || !endAddr) {
      return new Response(JSON.stringify({code:-1,msg:"缺少startAddr或endAddr参数"}), { headers });
    }

    const url = `https://restapi.amap.com/v3/direction/driving?origin=${encodeURIComponent(startAddr)}&destination=${encodeURIComponent(endAddr)}&key=${AMAP_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "1") {
      return new Response(JSON.stringify({code:-1,msg:"地址查询失败："+data.info}), { headers });
    }

    const route = data.route.paths[0];
    const result = {
      distance: route.distance,
      duration: route.duration
    };
    return new Response(JSON.stringify({code:0,data:result}), { headers });
  } catch (err) {
    return new Response(JSON.stringify({code:-1,msg:"服务器异常"}), { headers });
  }
}
