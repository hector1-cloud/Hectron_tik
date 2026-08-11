import { spawn } from 'node:child_process';
import process from 'node:process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(args) {
  const child = spawn(npm, args, { stdio: 'inherit', env: process.env });
  child.on('exit', code => {
    if (code && code !== 0) console.error(`❌ Proceso terminado con código ${code}`);
  });
  return child;
}

console.log('🚀 HECTRON PC runtime');
run(['run', 'agent']);
