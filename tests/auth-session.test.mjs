import test from 'node:test';
import assert from 'node:assert/strict';

test('session changes clear account state, reject stale 401s and distinguish explicit logout', async () => {
  const values = new Map([['token', 'a'], ['originalToken', 'admin']]);
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
  globalThis.window = new EventTarget();
  try {
    const { getSession, setSessionToken, expireSession, onSessionReset, subscribeSession } =
      await import('../src/features/auth/session.ts');
    let resets = 0, changes = 0;
    const stopReset = onSessionReset(() => resets++);
    const stopChange = subscribeSession(() => changes++);
    const initialRevision = getSession().revision;
    setSessionToken('b');
    assert.equal(getSession().revision, initialRevision + 1);
    assert.equal(expireSession('a'), false);
    assert.equal(getSession().token, 'b');
    assert.equal(expireSession('b'), true);
    assert.equal(getSession().expired, true);
    assert.equal(expireSession('b'), false);
    assert.equal(localStorage.getItem('originalToken'), null);
    setSessionToken(null, true);
    assert.equal(getSession().explicitLogout, true);
    setSessionToken('c');
    assert.equal(getSession().explicitLogout, false);
    localStorage.setItem('token', 'other-tab');
    const event = new Event('storage');
    Object.defineProperty(event, 'key', { value: 'token' });
    window.dispatchEvent(event);
    assert.equal(getSession().token, 'other-tab');
    assert.equal(resets, changes);
    assert.equal(changes, 5);
    stopReset(); stopChange();
  } finally {
    delete globalThis.localStorage;
    delete globalThis.window;
  }
});
