// Polyfill for CommonJS 'exports' used by @swisseph/browser
// @ts-nocheck
// This must be imported BEFORE any module that uses @swisseph/browser
if (typeof globalThis.exports === 'undefined') {
  globalThis.exports = {};
}

