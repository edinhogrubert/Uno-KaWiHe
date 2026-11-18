import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'fs';
import { WebSocket } from 'ws';

const tempDataDir = vi.hoisted(() => {
  const dir = `${process.cwd()}/.tmp_sess_rev_${process.pid}_${Date.now()}`;
  process.env.DATA_DIR = dir;
  process.env.DISABLE_AUTO_START = 'true';
  process.env.ADMIN_PIN = '9999';
  return dir;
});

import { server } from '../server.js';
import { generateToken, getAllUsers } from '../server/authService.js';

describe('Admin Session Disconnect & JWT Revocation Integration', () => {
  let baseUrl = '';
  let wsPort = 0;
  let adminToken = '';
  let willOldToken = '';
  let willId = '';

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          wsPort = addr.port;
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });

    const users = getAllUsers();
    const admin = users.find((u) => u.username === 'edinho')!;
    const will = users.find((u) => u.username === 'will')!;
    adminToken = generateToken(admin);
    willOldToken = generateToken(will);
    willId = will.id;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    fs.rmSync(tempDataDir, { recursive: true, force: true });
  });

  it('disconnects active WS with 4001 + session_revoked, revokes old JWT on /api/auth/me and WS, and allows fresh login token', async () => {
    // 1. Before disconnect: /api/auth/me succeeds
    const meBefore = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${willOldToken}` },
    });
    expect(meBefore.status).toBe(200);

    // 2. Connect WS and register_lobby as Will
    const ws = new WebSocket(`ws://127.0.0.1:${wsPort}/ws`);
    await new Promise<void>((resolve) => ws.once('open', () => resolve()));

    const registeredPromise = new Promise<void>((resolve) => {
      ws.on('message', (raw) => {
        const parsed = JSON.parse(raw.toString());
        if (parsed.type === 'lobby_online_players') {
          resolve();
        }
      });
    });

    ws.send(
      JSON.stringify({
        type: 'register_lobby',
        playerId: willId,
        name: 'Will',
        avatar: '🦸‍♂️',
        token: willOldToken,
      })
    );
    await registeredPromise;

    const revokedPromise = new Promise<any>((resolve) => {
      ws.on('message', (raw) => {
        const parsed = JSON.parse(raw.toString());
        if (parsed.type === 'session_revoked') {
          resolve(parsed);
        }
      });
    });

    const closedPromise = new Promise<number>((resolve) => {
      ws.once('close', (code) => resolve(code));
    });

    // 3. Admin disconnects Will's session
    const disconnectRes = await fetch(`${baseUrl}/api/admin/player-action/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        targetId: willId,
        reason: 'Sua sessão foi encerrada pelo Administrador.',
      }),
    });
    expect(disconnectRes.status).toBe(200);
    const disconnectBody = await disconnectRes.json();
    expect(disconnectBody.success).toBe(true);

    // 4. Verify WS receives session_revoked and closes with 4001
    const [revokedMsg, closeCode] = await Promise.all([revokedPromise, closedPromise]);
    expect(revokedMsg.type).toBe('session_revoked');
    expect(closeCode).toBe(4001);

    // 5. Verify old JWT is now rejected by /api/auth/me (HTTP 401)
    const meAfter = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${willOldToken}` },
    });
    expect(meAfter.status).toBe(401);

    // 6. Verify reconnecting WS with the old JWT is immediately rejected with 4001
    const staleWs = new WebSocket(`ws://127.0.0.1:${wsPort}/ws`);
    await new Promise<void>((resolve) => staleWs.once('open', () => resolve()));

    const staleClosedPromise = new Promise<number>((resolve) => {
      staleWs.once('close', (code) => resolve(code));
    });
    staleWs.send(
      JSON.stringify({
        type: 'register_lobby',
        playerId: willId,
        name: 'Will',
        avatar: '🦸‍♂️',
        token: willOldToken,
      })
    );
    expect(await staleClosedPromise).toBe(4001);

    // 7. Verify fresh token after re-login works cleanly
    const refreshedWill = getAllUsers().find((u) => u.id === willId)!;
    expect(refreshedWill.sessionVersion).toBe(1);
    const willNewToken = generateToken(refreshedWill);
    const meReLogin = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${willNewToken}` },
    });
    expect(meReLogin.status).toBe(200);
  });
});
