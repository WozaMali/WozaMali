#!/usr/bin/env node
const { spawn } = require('child_process');

const args = process.argv.slice(2);

function parsePortArg(argumentsArray) {
  // Accept forms like: "8080", "port=8080", "--port=8080", "-p", "--port", followed by value
  for (let i = 0; i < argumentsArray.length; i += 1) {
    const token = String(argumentsArray[i] || '').trim();
    // Pure number
    if (/^\d{2,5}$/.test(token)) return token;
    // key=value
    const match = token.match(/^(?:--?)?port\s*=\s*(\d{2,5})$/i);
    if (match) return match[1];
    // flag then value
    if (/^(?:--?)?p(?:ort)?$/i.test(token)) {
      const next = String(argumentsArray[i + 1] || '').trim();
      if (/^\d{2,5}$/.test(next)) return next;
    }
  }
  return undefined;
}

function run(command, args = [], options = {}) {
  const child = spawn(command, args, { stdio: 'inherit', shell: true, ...options });
  return child;
}

function startMain(port) {
  // Main app (root Next.js) with faster compilation and external access
  const resolvedPort = String(port || process.env.PORT || '3000');
  return run('npx', ['next', 'dev', '-p', resolvedPort, '--turbo', '--hostname', '0.0.0.0']);
}

function startOffice() {
  // Office app on 8081
  return run('npm', ['run', 'dev'], { cwd: 'WozaMaliOffice' });
}

function startCollector() {
  // Collector app on 8082
  return run('npm', ['run', 'dev'], { cwd: 'WozaMaliCollector' });
}

function startAll() {
  const procs = [startMain(), startOffice(), startCollector()];
  procs.forEach((p, idx) => p.on('exit', (code) => console.log(`proc ${idx} exited: ${code}`)));
}

const mode = args[0] || '';
const portArg = parsePortArg(args);

switch (mode) {
  case 'all':
    startAll();
    break;
  case 'office':
    startOffice();
    break;
  case 'collector':
    startCollector();
    break;
  default:
    startMain(portArg);
}


