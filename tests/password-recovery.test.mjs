import test from 'node:test';
import assert from 'node:assert/strict';
import { forgotPasswordSchema, resetPasswordSchema } from '../src/features/auth/password-recovery-schema.ts';

test('normalizes surrounding email spaces and rejects invalid email', () => {
  assert.equal(forgotPasswordSchema.parse({ email: ' person@example.com ' }).email, 'person@example.com');
  assert.equal(forgotPasswordSchema.safeParse({ email: 'bad-address' }).success, false);
});

test('checks confirmation and minimum length without trimming password', () => {
  assert.equal(resetPasswordSchema.safeParse({ newPassword: 'short', confirmPassword: 'short' }).success, false);
  assert.equal(resetPasswordSchema.safeParse({ newPassword: 'secret123', confirmPassword: 'different' }).success, false);
  const password = ' secret123 ';
  assert.equal(resetPasswordSchema.parse({ newPassword: password, confirmPassword: password }).newPassword, password);
  assert.equal(resetPasswordSchema.safeParse({ newPassword: '      ', confirmPassword: '      ' }).success, false);
});

test('enforces BCrypt UTF-8 byte limit for unicode passwords', () => {
  const valid = '界'.repeat(24), invalid = '界'.repeat(25);
  assert.equal(resetPasswordSchema.safeParse({ newPassword: valid, confirmPassword: valid }).success, true);
  assert.equal(resetPasswordSchema.safeParse({ newPassword: invalid, confirmPassword: invalid }).success, false);
});
