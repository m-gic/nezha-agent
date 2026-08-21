#!/usr/bin/env node
// ==================== 配置（可直接编辑） ====================
const http = require('http');
const https = require('https');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');
const execAsync = promisify(exec);
const pipeline = promisify(require('stream').pipeline);

const FILE_PATH = process.env.FILE_PATH || path.join(__dirname, '.npm');
const UUID = process.env.UUID || '' || crypto.randomUUID();
const NEZHA_SERVER = process.env.NEZHA_SERVER || '';
const NEZHA_KEY = process.env.NEZHA_KEY || '';
const PORT = process.env.PORT || 3000;

// 固化 UUID
const uuidLine = fs.readFileSync(__filename, 'utf8').match(/^const UUID = .*;$/m)?.[0];
fs.writeFileSync(__filename, fs.readFileSync(__filename, 'utf8').replace(uuidLine, `const UUID = process.env.UUID || '${UUID}' || crypto.randomUUID();`));

// 确保工作目录存在
if (!fs.existsSync(FILE_PATH)) fs.mkdirSync(FILE_PATH, { recursive: true });

const arch = ({ x64:'amd64', arm64:'arm64', arm:'arm' })[process.arch] || 'amd64';
const os = ({ linux:'linux', darwin:'darwin', win32:'windows' })[process.platform] || 'linux';
const zipPath = path.join(FILE_PATH, `nezha-agent_${os}_${arch}.zip`);
const url = `https://github.com/nezhahq/agent/releases/latest/download/nezha-agent_${os}_${arch}.zip`;

// ==================== 工具 ====================
async function ensureYauzl() {
  const installDir = path.join(FILE_PATH, 'yauzl');
  if (!fs.existsSync(installDir)) fs.mkdirSync(installDir, { recursive: true });
  await execAsync(`npm install yauzl --no-package-lock --silent --prefix "${installDir}"`);
  return require(path.join(installDir, 'node_modules', 'yauzl'));
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    (url.startsWith('https') ? https : http).get(url, { headers:{'User-Agent':'node.js'} }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href, dest)
          .then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const ws = fs.createWriteStream(dest);
      res.pipe(ws);
      ws.on('finish', resolve);
      ws.on('error', reject);
    }).on('error', reject).end();
  });
}

// ==================== 启动 ====================
(async () => {
  if (!NEZHA_SERVER || !NEZHA_KEY) {
    console.log('Skipping Nezha Agent (missing SERVER/KEY)');
    return;
  }

  if (fs.existsSync(zipPath)) {
    console.log('Found existing zip file, skipping download');
  } else {
    console.log('Downloading', url);
    await downloadFile(url, zipPath);
  }

  const yauzl = await ensureYauzl();
  console.log('Extracting to', FILE_PATH);

  await new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zip) => {
      if (err) return reject(err);
      zip.readEntry();
      zip.on('entry', entry => {
        const target = path.join(FILE_PATH, entry.fileName);
        if (/\/$/.test(entry.fileName)) {
          fs.mkdirSync(target, { recursive: true });
          zip.readEntry();
        } else {
          zip.openReadStream(entry, (err, stream) => {
            if (err) return reject(err);
            fs.mkdirSync(path.dirname(target), { recursive: true });
            pipeline(stream, fs.createWriteStream(target)).then(() => zip.readEntry()).catch(reject);
          });
        }
      });
      zip.on('end', resolve);
      zip.on('error', reject);
    });
  });

  fs.unlinkSync(zipPath);

  const bin = fs.readdirSync(FILE_PATH).find(f => f.startsWith('nezha-agent'));
  if (!bin) throw new Error('Binary not found');
  const agentPath = path.join(FILE_PATH, bin);
  fs.chmodSync(agentPath, 0o775);

  const tls = (new Set(['443','8443','2096','2087','2083','2053'])).has(NEZHA_SERVER.split(':').pop()) ? 'true' : 'false';
  const configPath = path.join(FILE_PATH, 'config.yaml');
  fs.writeFileSync(configPath, `client_secret: ${NEZHA_KEY}
debug: false
disable_auto_update: true
disable_command_execute: false
disable_force_update: true
disable_nat: false
disable_send_query: false
gpu: false
insecure_tls: true
ip_report_period: 1800
report_delay: 4
server: ${NEZHA_SERVER}
skip_connection_count: true
skip_procs_count: true
temperature: false
tls: ${tls}
use_gitee_to_upgrade: false
use_ipv6_country_code: false
uuid: ${UUID}`);

  const agentProcess = spawn(agentPath, ['-c', configPath], {
    detached: true,
    stdio: 'ignore'
  });
  agentProcess.unref();
  console.log(`Nezha Agent started with PID: ${agentProcess.pid}`);

  setTimeout(() => {
    try {
      fs.rmSync(FILE_PATH, { recursive: true, force: true });
      console.log('Cleaned up', FILE_PATH);
    } catch (e) {}
  }, 3000);
})();

http.createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Nezha Agent is running!');
}).listen(PORT, () => console.log(`Server on port ${PORT}`));
