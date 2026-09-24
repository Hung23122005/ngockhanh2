const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('scene scripts load together in a browser global scope', () => {
  const browser = {};
  browser.window = browser;
  vm.createContext(browser);

  for (const file of ['sakura.js', 'scene3d.js', 'scene-renderer.js']) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    vm.runInContext(source, browser, { filename: file });
  }

  assert.equal(typeof browser.Scene3D.projectPoint, 'function');
  assert.equal(typeof browser.SakuraRenderer.createRenderer, 'function');
});
