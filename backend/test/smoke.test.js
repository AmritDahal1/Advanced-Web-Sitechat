const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const backendRoot = path.resolve(__dirname, '..');
const dbPath = path.join(
  os.tmpdir(),
  `sitechat-smoke-${process.pid}-${Date.now()}.db`
);

const port = 43000 + (process.pid % 10000);
const baseUrl = `http://127.0.0.1:${port}`;

let server;
let serverError = '';

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // Server may still be starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(
    `Backend did not start for smoke tests. ${serverError}`
  );
}

async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  return fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
  });
}

before(async () => {
  server = spawn(process.execPath, ['src/server.js'], {
    cwd: backendRoot,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'test',
      JWT_SECRET: 'sitechat-smoke-test-secret',
      SITECHAT_DB_PATH: dbPath,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stderr.on('data', (chunk) => {
    serverError += chunk.toString();
  });

  await waitForServer();
});

after(async () => {
  if (server && !server.killed) {
    server.kill();

    await Promise.race([
      new Promise((resolve) => server.once('exit', resolve)),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  }

  for (const suffix of ['', '-shm', '-wal']) {
    try {
      fs.rmSync(`${dbPath}${suffix}`, { force: true });
    } catch {
      // Best-effort cleanup only.
    }
  }
});

test('health endpoint responds successfully', async () => {
  const response = await request('/api/health');

  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.status, 'ok');
});

test('protected site endpoint rejects unauthenticated requests', async () => {
  const response = await request('/api/sites');

  assert.equal(response.status, 401);
});

test('registration rejects missing required fields', async () => {
  const response = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({}),
  });

  assert.equal(response.status, 400);
});

test('authenticated message API rejects invalid image attachments', async () => {
  const registerResponse = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Smoke Test User',
      email: `smoke-${process.pid}@example.test`,
      password: 'password123',
    }),
  });

  assert.equal(registerResponse.status, 201);

  const account = await registerResponse.json();
  assert.ok(account.token);

  const authHeaders = {
    Authorization: `Bearer ${account.token}`,
  };

  const siteResponse = await request('/api/sites', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Smoke Test Site',
      address: '1 Test Street',
    }),
  });

  assert.equal(siteResponse.status, 201);

  const site = await siteResponse.json();
  assert.ok(site.id);

  const messageResponse = await request(
    `/api/sites/${site.id}/messages`,
    {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        attachmentDataUrl:
          'data:text/plain;base64,SGVsbG8gd29ybGQ=',
      }),
    }
  );

  assert.equal(messageResponse.status, 400);
});