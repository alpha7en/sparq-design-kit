// test harness: runs the SPARQ MCP server and exposes tools over HTTP (POST /call {name,arguments})
import { spawn } from 'node:child_process'; import http from 'node:http';
const [,, server, design] = process.argv;
const start = () => { const p = spawn('node', [server], { env: { ...process.env, SPARQ_DESIGN_DIR: design, FIGMA_WS_PORT: '9229' }, stdio: ['pipe', 'pipe', 'inherit'] }); return p; };
let p = start(); let buf = ''; let id = 10; const waiters = {};
const hook = () => p.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 1); try { const m = JSON.parse(l); if (m.id && waiters[m.id]) { waiters[m.id](m); delete waiters[m.id]; } } catch {} } });
hook();
const rpc = (method, params) => new Promise(r => { const i = ++id; waiters[i] = r; p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: i, method, params }) + '\n'); });
await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'harness', version: '0' } });
p.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
http.createServer(async (req, res) => { let b = ''; req.on('data', d => b += d); req.on('end', async () => { try { const { name, arguments: args } = JSON.parse(b); const m = await rpc('tools/call', { name, arguments: args || {} }); res.end(m.result ? m.result.content.map(c => c.text).join('\n') : JSON.stringify(m.error)); } catch (e) { res.end('ERR ' + e.message); } }); }).listen(9301, '127.0.0.1');
console.error('harness on 9301');
