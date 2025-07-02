const http = require('http');
const httpProxy = require('http-proxy');

// Create a proxy server
const proxy = httpProxy.createProxyServer({});

// Create server that forwards port 443 to port 5000
const server = http.createServer((req, res) => {
  proxy.web(req, res, {
    target: 'http://localhost:5000'
  });
});

// Handle WebSocket connections
server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head, {
    target: 'http://localhost:5000'
  });
});

server.listen(443, '0.0.0.0', () => {
  console.log('Proxy server listening on port 443, forwarding to port 5000');
});