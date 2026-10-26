import test from 'node:test';
import assert from 'node:assert/strict';
import { getAuthErrorMessage } from './auth.ts';

test('getAuthErrorMessage maps Firebase Auth error codes correctly', () => {
  assert.equal(
    getAuthErrorMessage({ code: 'auth/email-already-in-use' }),
    'An account with this email already exists. Please sign in instead.'
  );

  assert.equal(
    getAuthErrorMessage({ code: 'auth/invalid-email' }),
    'Please provide a valid email address.'
  );

  assert.equal(
    getAuthErrorMessage({ code: 'auth/wrong-password' }),
    'Invalid email or password. Please verify your credentials and try again.'
  );

  assert.equal(
    getAuthErrorMessage({ code: 'auth/invalid-credential' }),
    'Invalid email or password. Please verify your credentials and try again.'
  );

  assert.equal(
    getAuthErrorMessage({ code: 'auth/weak-password' }),
    'Password should be at least 6 characters long.'
  );

  assert.equal(
    getAuthErrorMessage({ code: 'auth/user-not-found' }),
    'No account was found with this email address.'
  );

  assert.equal(
    getAuthErrorMessage({ code: 'auth/popup-closed-by-user' }),
    'Sign-in window was closed before completion. Please try again.'
  );

  assert.equal(
    getAuthErrorMessage({ code: 'auth/network-request-failed' }),
    'Network connection issue. Please check your internet connection.'
  );

  assert.equal(
    getAuthErrorMessage({ message: 'Custom server error' }),
    'Custom server error'
  );

  assert.equal(
    getAuthErrorMessage(null),
    'An unexpected authentication error occurred.'
  );
});
