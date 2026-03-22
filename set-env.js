const { spawn } = require('child_process');

const dbUrl = "postgresql://neondb_owner:npg_xrGFU5WXdlV7@ep-hidden-credit-anaki411-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

function addEnv() {
  const child = spawn('npx', ['vercel', 'env', 'add', 'DATABASE_URL', 'production'], {
    cwd: 'd:\\pos-desktop-app\\backend-nest',
    shell: true
  });

  child.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('OUT:', output);
    if (output.includes('encrypted')) {
      child.stdin.write('N\n');
    }
    if (output.includes('value of DATABASE_URL')) {
      child.stdin.write(dbUrl + '\n');
    }
  });

  child.stderr.on('data', (data) => {
    console.log('ERR:', data.toString());
  });

  child.on('close', (code) => {
    console.log('Process exited with code', code);
  });
}

addEnv();
