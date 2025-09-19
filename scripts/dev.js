#!/usr/bin/env node
const { spawn } = require('child_process');

const args = process.argv.slice(2);

function run(command, args = [], options = {}) {
  const child = spawn(command, args, { stdio: 'inherit', shell: true, ...options });
  return child;
}

function startMain() {
  // Main app (root Next.js) on 8080 with faster compilation and external access
  return run('npx', ['next', 'dev', '-p', '8080', '--turbo', '--hostname', '0.0.0.0']);
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
    startMain();
}


