/**
 * Starts both backend and frontend concurrently.
 * Equivalent to: concurrently "cd backend && npm start" "cd frontend && npm start"
 */
const { execSync, spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

function run(cmd, cwd, name, color) {
  const prefix = `\x1b[${color}m[${name}]\x1b[0m`;
  const proc = spawn('sh', ['-c', cmd], { cwd, stdio: 'pipe' });
  proc.stdout.on('data', d => process.stdout.write(`${prefix} ${d}`));
  proc.stderr.on('data', d => process.stderr.write(`${prefix} ${d}`));
  proc.on('exit', code => console.log(`${prefix} exited with code ${code}`));
  return proc;
}

console.log('\x1b[1m⚡ Starting PowerTrack Dealership CRM...\x1b[0m\n');

const backend = run('node server.js', path.join(root, 'backend'), 'API    ', '34');
const frontend = run('npm start', path.join(root, 'frontend'), 'UI     ', '35');

process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit(0);
});
