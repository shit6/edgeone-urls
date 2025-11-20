export async function handleRequest(
  server_address: string = "::1",
  server_methods: string = "GET",
  server_headers: Headers | null = null,
  server_message: BodyInit | null = null,
  origin_address: string | null = null,
  redirect_flags: boolean = true,
  contents_flags: boolean = true
): Promise<Response> {
  try {
    const url_json = new URL(server_address);
    let url_path = decodeURIComponent(url_json.href);
    
    // 补全协议处理函数
    const ensureProtocol = (url: string, protocol: string) => {
      return url.startsWith('http') ? url : `${protocol}//${url}`;
    };
    url_path = ensureProtocol(url_path, url_json.protocol);

    // 初始化 headers
    const filteredHeaders = server_headers 
      ? filterHeaders(server_headers, o => !o.startsWith('cf')) 
      : new Headers();

    const remote_data = new Request(url_json, {
      headers: filteredHeaders,
      method: server_methods,
      redirect: 'manual',
      body: server_methods === "POST" ? server_message : null
    });

    // 路径匹配逻辑
    const pathsToRedirect = ['/rest/', '/api/', '/emby/Videos/', '/emby/videos/', '/emby/Items/'];
    if (pathsToRedirect.some(path => url_json.pathname.includes(path))) {
      return new Response(null, {
        status: 302,
        headers: {'Location': url_path}
      });
    }

    const origin_request = await fetch(remote_data);
    const origin_arrayBuffer = await origin_request.arrayBuffer();
    const origin_body_buffer = new TextDecoder().decode(origin_arrayBuffer); // 替代 Buffer

    // 修复重定向逻辑（原 response 变量未定义）
    if (redirect_flags && [301, 302, 303, 307, 308].includes(origin_request.status)) {
      const location = origin_request.headers.get('Location');
      return new Response(null, {
        status: origin_request.status,
        headers: {'Location': location || url_path}
      });
    }

    // 构建响应
    const return_data = new Response(origin_body_buffer, {
      status: origin_request.status,
      statusText: origin_request.statusText,
      headers: origin_request.headers
    });

    setNoCacheHeaders(return_data.headers);
    setCorsHeaders(return_data.headers);
    return return_data;
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 辅助函数类型定义
function filterHeaders(headers: Headers, predicate: (key: string) => boolean): Headers {
  const filtered = new Headers();
  headers.forEach((value, key) => {
    if (predicate(key)) filtered.append(key, value);
  });
  return filtered;
}

function setNoCacheHeaders(headers: Headers): void {
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
}

function setCorsHeaders(headers: Headers): void {
  headers.set('Access-Control-Allow-Origin', '*'); // 后续建议限制为具体域名
}
