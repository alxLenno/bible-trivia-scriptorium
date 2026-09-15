import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiBase } from '../src/apiConfig.js';

const prod = 'https://abytrivia.pythonanywhere.com/api';
test('development uses the configured backend without requiring a local server', () => {
  assert.equal(resolveApiBase({ hostname: 'localhost', configuredBase: prod }), prod);
});
test('explicit local development remains available', () => {
  assert.equal(resolveApiBase({ hostname: 'localhost', override: 'local' }), 'http://127.0.0.1:5555/api');
});
test('production override defeats a local build configuration', () => {
  assert.equal(resolveApiBase({ hostname: 'localhost', override: 'prod', configuredBase: 'http://127.0.0.1:5555/api' }), prod);
});
test('hosted app ignores stale local overrides and loopback build settings', () => {
  assert.equal(resolveApiBase({ hostname: 'example.vercel.app', override: 'local', configuredBase: 'http://127.0.0.1:5555/api' }), prod);
});
test('custom HTTPS and relative API deployments are preserved', () => {
  assert.equal(resolveApiBase({ hostname: 'example.com', configuredBase: 'https://api.example.com/api/' }), 'https://api.example.com/api');
  assert.equal(resolveApiBase({ hostname: 'example.com', configuredBase: '/api' }), '/api');
});
