const express = require('express');
const basicAuth = require('express-basic-auth');
const { WebSocketServer } = require('ws');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const dgram = require('dgram');
const multer = require('multer');

// Native VPK parser for L4D2 v1/v2 VPKs
function getVpkMaps(filePath) {
    let maps = [];
    let fd;
    try {
        fd = fs.openSync(filePath, 'r');
        const header = Buffer.alloc(8);
        fs.readSync(fd, header, 0, 8, 0);
        const signature = header.readUInt32LE(0);
        if (signature !== 0x55aa1234) return [];
        const version = header.readUInt32LE(4);
        const headerSize = version === 2 ? 28 : (version === 1 ? 12 : 0);
        if (headerSize === 0) return [];
        const treeSizeBuf = Buffer.alloc(4);
        fs.readSync(fd, treeSizeBuf, 0, 4, 8);
        const treeSize = treeSizeBuf.readUInt32LE(0);
        if (treeSize === 0) return [];
        const tree = Buffer.alloc(treeSize);
        fs.readSync(fd, tree, 0, treeSize, headerSize);
        let offset = 0;
        const readString = () => {
            let start = offset;
            while (offset < tree.length && tree[offset] !== 0) offset++;
            const s = tree.slice(start, offset).toString('utf8');
            offset++;
            return s;
        };
        while (offset < tree.length) {
            const ext = readString();
            if (ext === '') break;
            while (offset < tree.length) {
                const dir = readString();
                if (dir === '') break;
                while (offset < tree.length) {
                    const name = readString();
                    if (name === '') break;
                    if (ext.toLowerCase() === 'bsp') maps.push(name);
                    offset += 18; // Entry struct size
                }
            }
        }
    } catch (e) { console.error(`[VPK-PARSE] Error:`, e); }
    finally { if (fd) fs.closeSync(fd); }
    return maps;
}

const app = express();
const PORT = 3000;
const GAME_PORT = parseInt(process.env.GAME_PORT || '27015');
const WEB_USER = process.env.WEB_USER || 'admin';
const WEB_PASS = process.env.WEB_PASS || 'admin123';

// Support both Windows and Linux paths
const L4D2_DIR = process.env.L4D2_DIR || (process.platform === 'win32'
  ? 'C:\\Users\\ASUS\\Desktop\\l4d2-dedicated-server'
  : '/root/l4d2-server');
const WEBAPP_DIR = __dirname;
const CONSOLE_LOG = path.join(L4D2_DIR, 'left4dead2', 'console.log');
const SOURCEMOD_LOG_DIR = path.join(L4D2_DIR, 'left4dead2', 'addons', 'sourcemod', 'logs');
const DEV_ROOTS = {
  game: L4D2_DIR,
  webapp: WEBAPP_DIR
};
const DEV_ROOT_LABELS = {
  game: 'Game server runtime',
  webapp: 'Dashboard runtime'
};
const DEV_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;
const DEV_BROWSE_MAX_ENTRIES = 250;

// --- Auth ---
app.use(basicAuth({
  users: { [WEB_USER]: WEB_PASS },
  challenge: true,
  realm: 'L4D2 Admin Dashboard'
}));

app.use(express.json({ limit: '50mb' }));
// Prefer built React app, fallback to legacy public folder
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));
app.use(express.static(path.join(__dirname, 'public')));

// --- Upload Configuration ---
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(L4D2_DIR, 'left4dead2', 'addons');
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const addonUpload = multer({ storage: uploadStorage });

// --- Helper: send command to screen session ---
function sendToGame(command, callback) {
  const safeCmd = command.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/`/g, '\\`');
  const cmd = `screen -S l4d2 -X stuff "${safeCmd}\n"`;
  exec(cmd, (err) => {
    if (err) return callback && callback({ error: err.message });
    callback && callback({ ok: true, command });
  });
}

// --- Source Query Protocol (A2S_PLAYER) ---
function sourceQuery(type, callback) {
  const client = dgram.createSocket('udp4');
  let done = false;

  const timeout = setTimeout(() => {
    if (!done) { done = true; client.close(); callback(new Error('Query timeout')); }
  }, 3000);

  // A2S_INFO: FF FF FF FF 54 + "Source Engine Query\0"
  // A2S_PLAYER challenge: FF FF FF FF 55 FF FF FF FF
  const A2S_INFO = Buffer.from([0xFF,0xFF,0xFF,0xFF,0x54,...Buffer.from('Source Engine Query\0')]);
  const A2S_PLAYER_CHALLENGE = Buffer.from([0xFF,0xFF,0xFF,0xFF,0x55,0xFF,0xFF,0xFF,0xFF]);

  let challengeReceived = false;

  client.on('message', (msg) => {
    if (done) return;
    const header = msg.readUInt8(4);

    if (type === 'info' && header === 0x49) {
      // A2S_INFO response
      done = true; clearTimeout(timeout); client.close();
      try { callback(null, parseA2SInfo(msg)); } catch(e) { callback(e); }
      return;
    }

    if (type === 'players') {
      if (header === 0x41 && !challengeReceived) {
        // Got challenge, send real A2S_PLAYER request
        challengeReceived = true;
        const ch = msg.slice(5, 9);
        const req = Buffer.from([0xFF,0xFF,0xFF,0xFF,0x55, ch[0],ch[1],ch[2],ch[3]]);
        client.send(req, GAME_PORT, '127.0.0.1', () => {});
        return;
      }
      if (header === 0x44) {
        // Real player response
        done = true; clearTimeout(timeout); client.close();
        try { callback(null, parseA2SPlayer(msg)); } catch(e) { callback(e); }
      }
    }
  });

  client.on('error', (err) => {
    if (!done) { done = true; clearTimeout(timeout); client.close(); callback(err); }
  });

  const req = type === 'info' ? A2S_INFO : A2S_PLAYER_CHALLENGE;
  client.send(req, GAME_PORT, '127.0.0.1', () => {});
}

function parseA2SInfo(buf) {
  let offset = 6; // skip header+type
  const readStr = () => {
    const end = buf.indexOf(0x00, offset);
    const s = buf.slice(offset, end).toString('utf8');
    offset = end + 1;
    return s;
  };
  const name = readStr();
  const map = readStr();
  const folder = readStr();
  const game = readStr();
  offset += 2; // app id
  const players = buf.readUInt8(offset++);
  const maxPlayers = buf.readUInt8(offset++);
  const bots = buf.readUInt8(offset++);
  return { name, map, players, maxPlayers, bots };
}

function parseA2SPlayer(buf) {
  const count = buf.readUInt8(5);
  const players = [];
  let offset = 6;
  for (let i = 0; i < count; i++) {
    offset++; // index
    const end = buf.indexOf(0x00, offset);
    const name = buf.slice(offset, end).toString('utf8');
    offset = end + 1;
    const score = buf.readInt32LE(offset); offset += 4;
    const duration = buf.readFloatLE(offset); offset += 4;
    players.push({ name, score, duration: Math.floor(duration) });
  }
  return players;
}

function normalizeRelativePath(input) {
  return String(input || '').replace(/\\/g, '/').replace(/^\/+/, '');
}

function toDeveloperTarget(rootKey, relativePath) {
  return `${rootKey}:${normalizeRelativePath(relativePath)}`;
}

function resolveDeveloperPath(target, options = {}) {
  if (typeof target !== 'string' || !target.includes(':')) {
    throw new Error('Invalid target path');
  }

  const { allowRoot = false } = options;
  const [rootKey, ...rest] = target.split(':');
  const rootDir = DEV_ROOTS[rootKey];
  const relativePath = normalizeRelativePath(rest.join(':'));

  if (!rootDir) {
    throw new Error('Unsupported target root');
  }

  if ((!allowRoot && !relativePath) || path.isAbsolute(relativePath) || relativePath.includes('\0')) {
    throw new Error('Invalid relative path');
  }

  const allowedRoot = path.resolve(rootDir);
  const absolutePath = relativePath ? path.resolve(rootDir, relativePath) : allowedRoot;

  if (absolutePath !== allowedRoot && !absolutePath.startsWith(`${allowedRoot}${path.sep}`)) {
    throw new Error('Path escapes allowed root');
  }

  return { rootKey, relativePath, absolutePath };
}

function buildDeveloperLogList() {
  const logs = [];
  const fixedLogs = [
    { label: 'Game Console', target: toDeveloperTarget('game', 'left4dead2/console.log') },
    { label: 'Webapp Nohup', target: toDeveloperTarget('webapp', 'nohup.out') }
  ];

  fixedLogs.forEach((entry) => {
    try {
      const { absolutePath, relativePath } = resolveDeveloperPath(entry.target);
      if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
        return;
      }
      const stats = fs.statSync(absolutePath);
      logs.push({
        label: entry.label,
        target: entry.target,
        relativePath,
        size: stats.size,
        modified: stats.mtime
      });
    } catch (e) {}
  });

  if (fs.existsSync(SOURCEMOD_LOG_DIR)) {
    const files = fs.readdirSync(SOURCEMOD_LOG_DIR)
      .filter((name) => name.toLowerCase().endsWith('.log'))
      .map((name) => {
        const absolutePath = path.join(SOURCEMOD_LOG_DIR, name);
        const stats = fs.statSync(absolutePath);
        return { name, absolutePath, stats };
      })
      .sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs)
      .slice(0, 12);

    files.forEach((entry) => {
      logs.push({
        label: `SourceMod / ${entry.name}`,
        target: toDeveloperTarget('game', `left4dead2/addons/sourcemod/logs/${entry.name}`),
        relativePath: `left4dead2/addons/sourcemod/logs/${entry.name}`,
        size: entry.stats.size,
        modified: entry.stats.mtime
      });
    });
  }

  return logs;
}

function readDeveloperLogContent(target, maxLines, searchTerm) {
  const { absolutePath, relativePath } = resolveDeveloperPath(target);

  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    throw new Error('Log file not found');
  }

  const stats = fs.statSync(absolutePath);
  const text = fs.readFileSync(absolutePath, 'utf8').replace(/\0/g, '');
  let lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');

  if (searchTerm) {
    const needle = searchTerm.toLowerCase();
    lines = lines.filter((line) => line.toLowerCase().includes(needle));
  }

  const totalMatches = lines.length;
  const tailLines = lines.slice(-maxLines);

  return {
    target,
    relativePath,
    size: stats.size,
    modified: stats.mtime,
    totalMatches,
    lines: tailLines,
    content: tailLines.join('\n')
  };
}

function listDeveloperRoots() {
  return [
    {
      key: 'game',
      label: DEV_ROOT_LABELS.game,
      description: 'L4D2 runtime files, configs, logs, plugins, and scripts.',
      absoluteRoot: L4D2_DIR,
      browseTarget: 'game:left4dead2/'
    },
    {
      key: 'webapp',
      label: DEV_ROOT_LABELS.webapp,
      description: 'Dashboard backend, frontend build, and process logs.',
      absoluteRoot: WEBAPP_DIR,
      browseTarget: 'webapp:'
    }
  ];
}

function listDeveloperDirectory(target) {
  const { rootKey, relativePath, absolutePath } = resolveDeveloperPath(target, { allowRoot: true });

  if (!fs.existsSync(absolutePath)) {
    throw new Error('Directory not found');
  }

  const stats = fs.statSync(absolutePath);
  if (!stats.isDirectory()) {
    throw new Error('Target is not a directory');
  }

  const allowedRoot = path.resolve(DEV_ROOTS[rootKey]);
  const normalizedCurrent = normalizeRelativePath(relativePath).replace(/\/+$/, '');
  const parentRelative = normalizedCurrent ? path.dirname(normalizedCurrent).replace(/\\/g, '/') : '';
  const parentTarget = normalizedCurrent && parentRelative !== '.'
    ? toDeveloperTarget(rootKey, parentRelative ? `${parentRelative}/` : '')
    : null;

  const entries = fs.readdirSync(absolutePath, { withFileTypes: true })
    .map((entry) => {
      const entryAbsolutePath = path.join(absolutePath, entry.name);
      const entryStats = fs.statSync(entryAbsolutePath);
      const entryRelativePath = path.relative(allowedRoot, entryAbsolutePath).replace(/\\/g, '/');
      const isDirectory = entry.isDirectory();

      return {
        name: entry.name,
        type: isDirectory ? 'dir' : 'file',
        relativePath: entryRelativePath,
        target: toDeveloperTarget(rootKey, isDirectory ? `${entryRelativePath}/` : entryRelativePath),
        size: entryStats.size,
        modified: entryStats.mtime
      };
    })
    .sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'dir' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    })
    .slice(0, DEV_BROWSE_MAX_ENTRIES);

  return {
    rootKey,
    rootLabel: DEV_ROOT_LABELS[rootKey] || rootKey,
    target: toDeveloperTarget(rootKey, normalizedCurrent ? `${normalizedCurrent}/` : ''),
    relativePath: normalizedCurrent,
    absolutePath,
    parentTarget,
    entries
  };
}

// --- API Routes ---

// -- Data Config API Routes ---
app.get('/api/data/files', (req, res) => {
  const { plugin } = req.query;
  if (!plugin || plugin.includes('..')) return res.status(400).json({ error: 'Invalid plugin name' });
  const targetDir = path.join(L4D2_DIR, 'left4dead2', 'addons', 'sourcemod', 'data', plugin);
  
  if (!fs.existsSync(targetDir)) return res.json({ files: [] });
  try {
    const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.cfg'));
    res.json({ files });
  } catch (e) {
    res.status(500).json({ error: e.message, files: [] });
  }
});

app.get('/api/data/read', (req, res) => {
  const { plugin, file } = req.query;
  if (!plugin || plugin.includes('..') || !file || file.includes('..')) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }
  const targetPath = path.join(L4D2_DIR, 'left4dead2', 'addons', 'sourcemod', 'data', plugin, file);
  
  if (!fs.existsSync(targetPath)) return res.status(404).json({ error: 'File not found' });
  try {
    const content = fs.readFileSync(targetPath, 'utf8');
    res.json({ content });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/data/write', (req, res) => {
  const { plugin, file, content } = req.body;
  if (!plugin || plugin.includes('..') || !file || file.includes('..') || typeof content !== 'string') {
    return res.status(400).json({ error: 'Invalid parameters' });
  }
  const targetPath = path.join(L4D2_DIR, 'left4dead2', 'addons', 'sourcemod', 'data', plugin, file);
  
  if (!fs.existsSync(targetPath)) return res.status(404).json({ error: 'File not found' });
  try {
    // Create backup just in case
    fs.copyFileSync(targetPath, targetPath + '.bak');
    fs.writeFileSync(targetPath, content, 'utf8');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/status', (req, res) => {
  exec("screen -ls | grep l4d2", (err, stdout) => {
    const running = !!(stdout && stdout.includes('l4d2'));
    res.json({ running });
  });
});

app.get('/api/serverinfo', (req, res) => {
  sourceQuery('info', (err, info) => {
    if (err) return res.json({ error: err.message });
    res.json(info);
  });
});

app.get('/api/players', (req, res) => {
  const jsonFile = path.join(L4D2_DIR, 'left4dead2', 'addons', 'sourcemod', 'data', 'web_players.json');
  if (!fs.existsSync(jsonFile)) {
    // Plugin not yet active, fall back to A2S
    return sourceQuery('players', (err, players) => {
      if (err) return res.json({ source: 'a2s', error: err.message, players: [] });
      res.json({ source: 'a2s', players });
    });
  }
  try {
    const raw = fs.readFileSync(jsonFile, 'utf8').replace(/\0/g, '');
    const players = JSON.parse(raw);
    res.json({ source: 'plugin', players });
  } catch(e) {
    res.json({ source: 'plugin', error: e.message, players: [] });
  }
});

app.get('/api/plugins', (req, res) => {
  if (!fs.existsSync(CONSOLE_LOG)) {
    return res.json({ error: 'console.log not found', plugins: [] });
  }
  const beforeSize = fs.statSync(CONSOLE_LOG).size;
  sendToGame('sm plugins list', () => {
    setTimeout(() => {
      try {
        const afterSize = fs.statSync(CONSOLE_LOG).size;
        const newBytes = afterSize - beforeSize;
        if (newBytes <= 0) return res.json({ plugins: [] });
        const fd = fs.openSync(CONSOLE_LOG, 'r');
        const buf = Buffer.alloc(Math.min(newBytes + 512, 8192));
        fs.readSync(fd, buf, 0, buf.length, Math.max(0, beforeSize - 100));
        fs.closeSync(fd);
        const output = buf.toString('utf8');
        const plugins = [];
        let inErrors = false;
        const errors = [];
        const lines = output.split('\n');
        lines.forEach(line => {
          if (line.trim() === 'Errors:') {
            inErrors = true;
            return;
          }
          if (inErrors && line.trim() !== '') {
            errors.push(line.trim());
            return;
          }
          const m = line.match(/"([^"]+)"\s+\(([^)]+)\)\s+by\s+(.+)/);
          if (m) {
            let indexStr = "??";
            const indexMatch = line.match(/^\s*(\d+|<Failed>)/i);
            if (indexMatch) indexStr = indexMatch[1].replace('<Failed>', 'X');
            
            plugins.push({ index: indexStr, name: m[1], version: m[2], author: m[3].trim() });
          }
        });
        res.json({ plugins, errors });
      } catch(e) {
        res.json({ error: e.message, plugins: [] });
      }
    }, 1500);
  });
});

app.get('/api/cvars', (req, res) => {
  const cfgDir = path.join(L4D2_DIR, 'left4dead2', 'cfg', 'sourcemod');
  const result = [];
  if (!fs.existsSync(cfgDir)) return res.json({ cvars: [] });
  
  try {
    const files = fs.readdirSync(cfgDir).filter(f => f.endsWith('.cfg'));
    for (const f of files) {
      const p = path.join(cfgDir, f);
      const content = fs.readFileSync(p, 'utf8');
      const lines = content.split('\n');
      
      const cvarsList = [];
      let currentDesc = [];
      
      for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        if (line.startsWith('//')) {
          const cleanDesc = line.replace(/^\/\/\s*/, '').trim();
          if (cleanDesc && cleanDesc !== '-' && !cleanDesc.includes('This file was auto-generated') && !cleanDesc.includes('ConVars for plugin')) {
            currentDesc.push(cleanDesc);
          }
        } else {
          // Match cvar: sm_cvar_name "value"
          const match = line.match(/^([^\s]+)\s+"(.*)"$/);
          if (match) {
            cvarsList.push({
              name: match[1],
              value: match[2],
              desc: currentDesc.join(' | ')
            });
          }
          currentDesc = []; // reset desc after finding a cvar
        }
      }
      if (cvarsList.length > 0) {
        result.push({ plugin: f.replace('.cfg', ''), cvars: cvarsList });
      }
    }
    res.json({ cvars: result });
  } catch (e) {
    res.json({ error: e.message, cvars: [] });
  }
});

app.post('/api/command', (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'No command' });
  sendToGame(command, (result) => res.json(result));
});

app.post('/api/map', (req, res) => {
  const { map } = req.body;
  if (!map) return res.status(400).json({ error: 'No map provided' });
  sendToGame(`update_addon_paths; changelevel ${map}`, (result) => res.json(result));
});

app.post('/api/maxplayers', (req, res) => {
  const { count } = req.body;
  const n = parseInt(count);
  if (!n || n < 1 || n > 32) return res.status(400).json({ error: 'Invalid player count (1-32)' });
  // Use sm_cvar for server cvars that require SourceMod
  sendToGame(`sm_cvar sv_maxplayers ${n}`, (result) => res.json(result));
});

app.get('/api/addons', async (req, res) => {
  const addonsDir = path.join(L4D2_DIR, 'left4dead2', 'addons');
  if (!fs.existsSync(addonsDir)) return res.json({ addons: [] });
  try {
    const files = fs.readdirSync(addonsDir).filter(f => f.toLowerCase().endsWith('.vpk'));
    const addons = files.map(f => {
      const fullPath = path.join(addonsDir, f);
      const stats = fs.statSync(fullPath);
      const maps = getVpkMaps(fullPath);
      if (maps.length > 0) console.log(`[VPK] Found ${maps.length} maps in ${f}: ${maps.join(', ')}`);
      return { name: f, size: stats.size, modified: stats.mtime, maps };
    });
    res.json({ addons });
  } catch (e) {
    res.json({ error: e.message, addons: [] });
  }
});

app.delete('/api/addons/:filename', (req, res) => {
  const file = req.params.filename;
  if (!file || !file.toLowerCase().endsWith('.vpk') || file.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const filePath = path.join(L4D2_DIR, 'left4dead2', 'addons', file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      return res.json({ success: true });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(404).json({ error: 'File not found' });
});

app.post('/api/addons/upload', addonUpload.single('addonFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  sendToGame('update_addon_paths', () => {
    res.json({ success: true, message: `Successfully uploaded ${req.file.originalname}` });
  });
});

app.post('/api/workshop', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No Workshop URL provided' });

  let idMatch = url.match(/id=(\d+)/) || url.match(/^(\d+)$/);
  if (!idMatch) {
    return res.status(400).json({ error: 'Could not extract Workshop ID from the URL.' });
  }
  const workshopId = idMatch[1];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent('status', { message: `Preparing to download workshop item ${workshopId}...` });

  // Start SteamCMD
  const steamCmdProcess = spawn('/root/steamcmd.sh', [
    '+login', 'anonymous',
    '+workshop_download_item', '550', workshopId, 'validate',
    '+quit'
  ]);

  steamCmdProcess.stdout.on('data', (data) => {
    const output = data.toString();
    // Parse progress: "Update state (0x61) downloading, progress: 14.28 (4325376 / 30282136)"
    const progressMatch = output.match(/progress:\s*([0-9.]+)/);
    if (progressMatch) {
      sendEvent('progress', { percent: parseFloat(progressMatch[1]) });
    }
    // Forward general logs for UI status
    if (output.toLowerCase().includes('success') || output.toLowerCase().includes('download')) {
       sendEvent('status', { log: output.trim() });
    }
  });

  steamCmdProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) sendEvent('status', { log: `[stderr] ${output}` });
  });

  steamCmdProcess.on('close', (code) => {
    if (code !== 0) {
      sendEvent('error', { message: `SteamCMD exited with code ${code}.` });
      res.end();
      return;
    }
    sendEvent('status', { message: 'Download complete. Locating workshop files...' });
    
    // Find ALL files in the workshop content directory
    const searchPath = `/root/Steam/steamapps/workshop/content/550/${workshopId}`;
    exec(`find ${searchPath} -type f 2>/dev/null`, (err, stdout) => {
      let files = stdout ? stdout.trim().split('\n').filter(Boolean) : [];
      if (files.length === 0 || err) {
        // Fallback: broader search
        exec(`find /root/Steam /root/.steam -path "*/550/${workshopId}/*" -type f 2>/dev/null`, (err2, stdout2) => {
            files = stdout2 ? stdout2.trim().split('\n').filter(Boolean) : [];
            if (files.length === 0) {
                sendEvent('error', { message: "Could not locate the downloaded workshop files. SteamCMD may have failed silently." });
                res.end();
                return;
            }
            installWorkshopFiles(files);
        });
      } else {
        installWorkshopFiles(files);
      }
    });

    function installWorkshopFiles(sourcePaths) {
      sendEvent('status', { message: `Installing ${sourcePaths.length} file(s) to addons/ ...` });
      
      let copied = 0;
      let hasError = false;

      sourcePaths.forEach((sourcePath, index) => {
        const ext = path.extname(sourcePath).toLowerCase();
        let filename = path.basename(sourcePath);
        
        // Always install as .vpk — if the downloaded file is .bin or other format, rename it
        // Append part number if there are multiple parts and it's not natively named with .vpk
        if (ext !== '.vpk') {
          filename = sourcePaths.length > 1 ? `workshop_${workshopId}_part${index + 1}.vpk` : `workshop_${workshopId}.vpk`;
        }

        const destPath = path.join(L4D2_DIR, 'left4dead2', 'addons', filename);
        
        exec(`cp "${sourcePath}" "${destPath}"`, (errCopy) => {
          copied++;
          if (errCopy && !hasError) {
            hasError = true;
            sendEvent('error', { message: `Failed to install file: ${errCopy.message}` });
            res.end();
          } else if (copied === sourcePaths.length && !hasError) {
            // Tell the server to refresh its addon paths so it sees the new VPK immediately
            sendToGame('update_addon_paths', () => {
              sendEvent('success', { message: `Successfully installed ${sourcePaths.length} file(s)!` });
              res.end();
            });
          }
        });
      });
    }
  });
});

app.get('/api/dev/roots', (req, res) => {
  try {
    res.json({ roots: listDeveloperRoots() });
  } catch (e) {
    res.status(500).json({ error: e.message, roots: [] });
  }
});

app.get('/api/dev/browse', (req, res) => {
  const target = String(req.query.target || '');

  try {
    res.json(listDeveloperDirectory(target));
  } catch (e) {
    res.status(400).json({ error: e.message, entries: [] });
  }
});

app.get('/api/dev/logs', (req, res) => {
  try {
    res.json({ logs: buildDeveloperLogList() });
  } catch (e) {
    res.status(500).json({ error: e.message, logs: [] });
  }
});

app.get('/api/dev/logs/content', (req, res) => {
  const target = String(req.query.target || '');
  const limit = Math.min(Math.max(parseInt(req.query.limit || '250', 10) || 250, 20), 2000);
  const search = String(req.query.search || '').trim();

  try {
    const data = readDeveloperLogContent(target, limit, search);
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message, lines: [], content: '' });
  }
});

app.post('/api/dev/upload', (req, res) => {
  const { target, contentBase64, fileName } = req.body || {};

  if (!target || typeof target !== 'string') {
    return res.status(400).json({ error: 'No target path provided' });
  }

  if (typeof contentBase64 !== 'string') {
    return res.status(400).json({ error: 'No file content provided' });
  }

  try {
    const { rootKey, relativePath, absolutePath } = resolveDeveloperPath(target);
    const buffer = Buffer.from(contentBase64, 'base64');

    if (buffer.length > DEV_UPLOAD_MAX_BYTES) {
      return res.status(400).json({ error: `File too large. Max ${DEV_UPLOAD_MAX_BYTES} bytes.` });
    }

    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
      try {
        fs.copyFileSync(absolutePath, `${absolutePath}.bak`);
      } catch (backupError) {}
    }

    fs.writeFileSync(absolutePath, buffer);

    res.json({
      success: true,
      root: rootKey,
      relativePath,
      bytes: buffer.length,
      fileName: fileName || path.basename(absolutePath)
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// --- HTTP + WebSocket ---
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/console' });

wss.on('connection', (ws) => {
  let tail;
  function startTail() {
    if (!fs.existsSync(CONSOLE_LOG)) {
      ws.send('[Dashboard] Waiting for console.log...\n');
      setTimeout(startTail, 3000);
      return;
    }
    tail = spawn('tail', ['-n', '80', '-f', CONSOLE_LOG]);
    tail.stdout.on('data', (data) => { if (ws.readyState === ws.OPEN) ws.send(data.toString()); });
  }
  startTail();
  ws.on('message', (msg) => sendToGame(msg.toString(), () => {}));
  ws.on('close', () => { if (tail) tail.kill(); });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[L4D2 Dashboard] Running at http://0.0.0.0:${PORT}`);
});
