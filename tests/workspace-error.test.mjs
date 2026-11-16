import test from 'node:test';
import assert from 'node:assert/strict';
import { workspaceError } from '../src/pages/user/space-detail/workspace-error.ts';
import { AppApiError } from '../src/lib/api-error.ts';

test('invalid IDs and missing workspaces do not offer retry', () => {
  assert.equal(workspaceError(null, true).kind, 'missing');
  assert.equal(workspaceError(new AppApiError('private', { status: 404 }), false).retry, false);
  assert.equal(workspaceError(new AppApiError('private', { code: 1011 }), false).kind, 'missing');
});

test('permission errors remain distinct from temporary failures', () => {
  for (const error of [new AppApiError('private', { status: 403 }), new AppApiError('private', { code: 1026 })]) {
    const state = workspaceError(error, false);
    assert.equal(state.kind, 'forbidden');
    assert.equal(state.retry, false);
    assert.equal(JSON.stringify(state).includes('private'), false);
  }
});

test('network and server failures offer retry without exposing technical messages', () => {
  for (const error of [new Error('PRIVATE_STACK'), new AppApiError('PRIVATE_STACK', { status: 503 })]) {
    const state = workspaceError(error, false);
    assert.equal(state.kind, 'unavailable');
    assert.equal(state.retry, true);
    assert.equal(JSON.stringify(state).includes('PRIVATE_STACK'), false);
  }
});
