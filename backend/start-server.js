import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting MediWise Backend Server...\n');

const serverProcess = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`\n❌ Server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill();
  process.exit(0);
});






