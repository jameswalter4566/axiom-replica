// Cloudflare Worker - Full reverse proxy for Axiom
// Deploy this to Cloudflare Workers

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const workerHost = url.host;

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

    // Proxy everything to axiom.trade
    const targetUrl = `https://axiom.trade${url.pathname}${url.search}`;
    const targetHost = 'axiom.trade';

    // Clone the request with new URL and headers
    const modifiedHeaders = new Headers(request.headers);
    modifiedHeaders.set('Host', targetHost);
    modifiedHeaders.set('Origin', 'https://axiom.trade');
    modifiedHeaders.set('Referer', 'https://axiom.trade/');

    // Remove Cloudflare headers
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
      const contentType = response.headers.get('content-type') || '';

      // For HTML pages, modify to bypass hostname checks
      if (contentType.includes('text/html')) {
        let html = await response.text();

        // Remove CSP nonce attributes
        html = html.replace(/ nonce="[^"]*"/g, '');

        // Inject very early script to spoof hostname before any other JS runs
        const earlyScript = `
<script>
// Run BEFORE any other scripts
(function() {
  'use strict';

  // Store original values
  const realHostname = location.hostname;
  const realHost = location.host;
  const realOrigin = location.origin;
  const realHref = location.href;

  // Create getters that return spoofed values
  const spoofedHostname = 'axiom.trade';
  const spoofedHost = 'axiom.trade';
  const spoofedOrigin = 'https://axiom.trade';

  // Override location getters using defineProperty on the prototype
  try {
    const locationProto = Object.getPrototypeOf(window.location);

    // Try to override using getter
    Object.defineProperty(locationProto, 'hostname', {
      get: function() { return spoofedHostname; },
      configurable: true
    });
    Object.defineProperty(locationProto, 'host', {
      get: function() { return spoofedHost; },
      configurable: true
    });
    Object.defineProperty(locationProto, 'origin', {
      get: function() { return spoofedOrigin; },
      configurable: true
    });
  } catch(e) {
    console.log('Could not override location prototype');
  }

  // Also try to override window.location entirely
  try {
    const fakeLocation = {
      hostname: spoofedHostname,
      host: spoofedHost,
      origin: spoofedOrigin,
      href: realHref.replace(realHostname, spoofedHostname),
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      protocol: 'https:',
      port: '',
      assign: function(url) { window.location.assign(url); },
      replace: function(url) { window.location.replace(url); },
      reload: function() { window.location.reload(); },
      toString: function() { return this.href; }
    };

    // Try setting window.location
    Object.defineProperty(window, 'location', {
      value: fakeLocation,
      writable: false,
      configurable: false
    });
  } catch(e) {
    console.log('Could not override window.location');
  }

  // Block navigation to homepage
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(state, title, url) {
    if (url === '/' || url === '') {
      console.log('Blocked pushState to root');
      return;
    }
    return originalPushState.apply(this, arguments);
  };

  history.replaceState = function(state, title, url) {
    if (url === '/' || url === '') {
      console.log('Blocked replaceState to root');
      return;
    }
    return originalReplaceState.apply(this, arguments);
  };

  console.log('Hostname spoof script loaded');
})();
</script>
`;

        // Insert the early script right after <head>
        html = html.replace('<head>', '<head>' + earlyScript);

        // Create response headers without CSP
        const newHeaders = new Headers();
        for (const [key, value] of response.headers.entries()) {
          if (!key.toLowerCase().includes('content-security-policy')) {
            newHeaders.set(key, value);
          }
        }
        newHeaders.set('Access-Control-Allow-Origin', '*');

        return new Response(html, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      }

      // For other content, just proxy through
      const modifiedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
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
