#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting WozaMali Multi-Service Development Environment...\n');

// Function to start a service
function startService(name, port, envFile) {
  console.log(`📡 Starting ${name} service on port ${port}...`);
  
  const env = { ...process.env };
  if (envFile) {
    env.VITE_PORT = port.toString();
    env.VITE_SERVICE_TYPE = name.toLowerCase();
  }
  
  const child = spawn('npm', ['run', `dev:${name.toLowerCase()}`], {
    stdio: 'pipe',
    env,
    shell: true
  });
  
  child.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });
  
  child.stderr.on('data', (data) => {
    console.error(`[${name} ERROR] ${data.toString().trim()}`);
  });
  
  child.on('close', (code) => {
    console.log(`[${name}] Service stopped with code ${code}`);
  });
  
  return child;
}

// Start both services
const officeProcess = startService('Office', 8081);
const collectorProcess = startService('Collector', 8082);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down services...');
  officeProcess.kill('SIGINT');
  collectorProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down services...');
  officeProcess.kill('SIGTERM');
  collectorProcess.kill('SIGTERM');
  process.exit(0);
});

console.log('\n✅ Services started successfully!');
console.log('🌐 Office Dashboard: http://localhost:8081');
console.log('📱 Collector App: http://localhost:8082');
console.log('🔒 Frontend: http://localhost:8080');
console.log('\nPress Ctrl+C to stop all services');
