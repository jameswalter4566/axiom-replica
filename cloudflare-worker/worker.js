// Cloudflare Worker to proxy requests to Axiom APIs
// Deploy this to Cloudflare Workers

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    let targetUrl;
    let targetHost;

    // Route based on path prefix
    if (url.pathname.startsWith('/translate/')) {
      const path = url.pathname.replace('/translate', '');
      targetUrl = `https://translate.axiom.trade${path}${url.search}`;
      targetHost = 'translate.axiom.trade';
    } else if (url.pathname.startsWith('/cluster/')) {
      // Extract cluster number from path like /cluster/3/...
      const match = url.pathname.match(/^\/cluster\/(\d+|asia2)\/(.*)/);
      if (match) {
        const clusterNum = match[1];
        const restPath = match[2];
        const clusterHost = clusterNum === 'asia2' ? 'cluster-asia2.axiom.trade' : `cluster${clusterNum}.axiom.trade`;
        targetUrl = `https://${clusterHost}/${restPath}${url.search}`;
        targetHost = clusterHost;
      }
    } else if (url.pathname.startsWith('/socket8/')) {
      const path = url.pathname.replace('/socket8', '');
      targetUrl = `https://socket8.axiom.trade${path}${url.search}`;
      targetHost = 'socket8.axiom.trade';
    } else if (url.pathname.startsWith('/reporting/')) {
      const path = url.pathname.replace('/reporting', '');
      targetUrl = `https://reporting.axiom.trade${path}${url.search}`;
      targetHost = 'reporting.axiom.trade';
    } else if (url.pathname.startsWith('/tx-pro/')) {
      const path = url.pathname.replace('/tx-pro', '');
      targetUrl = `https://tx-pro.axiom.trade${path}${url.search}`;
      targetHost = 'tx-pro.axiom.trade';
    } else if (url.pathname.startsWith('/tx-custom/')) {
      const path = url.pathname.replace('/tx-custom', '');
      targetUrl = `https://tx-custom.axiom.trade${path}${url.search}`;
      targetHost = 'tx-custom.axiom.trade';
    } else if (url.pathname.startsWith('/cdn/')) {
      const path = url.pathname.replace('/cdn', '');
      targetUrl = `https://axiomtrading.sfo3.cdn.digitaloceanspaces.com${path}${url.search}`;
      targetHost = 'axiomtrading.sfo3.cdn.digitaloceanspaces.com';
    } else {
      // Default: return 404
      return new Response('Not Found', { status: 404 });
    }

    // Clone the request with new URL and headers
    const modifiedHeaders = new Headers(request.headers);
    modifiedHeaders.set('Host', targetHost);
    modifiedHeaders.set('Origin', 'https://axiom.trade');
    modifiedHeaders.set('Referer', 'https://axiom.trade/');

    // Remove headers that might cause issues
    modifiedHeaders.delete('cf-connecting-ip');
    modifiedHeaders.delete('cf-ray');
    modifiedHeaders.delete('cf-visitor');
    modifiedHeaders.delete('cf-ipcountry');

    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: modifiedHeaders,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
      redirect: 'follow',
    });

    try {
      const response = await fetch(modifiedRequest);

      // Clone the response and add CORS headers
      const modifiedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      // Add CORS headers to allow browser access
      modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
      modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      modifiedResponse.headers.set('Access-Control-Allow-Headers', '*');

      return modifiedResponse;
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
