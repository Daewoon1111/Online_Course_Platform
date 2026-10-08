// Runs a Python command inside backend/ with the project venv (Windows or macOS/Linux).
// `node scripts/py.mjs --venv` creates backend/.venv if it does not exist yet.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const win = process.platform === 'win32';
const system = win ? 'python' : 'python3';
const venv = resolve('backend', '.venv', ...(win ? ['Scripts', 'python.exe'] : ['bin', 'python']));
const args = process.argv.slice(2);

if (args[0] === '--venv' && existsSync(venv)) process.exit(0);
const [cmd, argv] = args[0] === '--venv' ? [system, ['-m', 'venv', '.venv']] : [existsSync(venv) ? venv : system, args];

spawn(cmd, argv, { cwd: 'backend', stdio: 'inherit' })
    .on('error', e => { console.error(`Cannot run ${cmd}: ${e.message}. Install Python 3.10+ and add it to PATH.`); process.exit(1); })
    .on('exit', code => process.exit(code ?? 1));
