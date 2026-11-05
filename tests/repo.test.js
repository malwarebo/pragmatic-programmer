'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { outputs } = require('../scripts/build');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const TEXT_FILE = /\.(md|mdc|js|json|yml|yaml)$/;
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'results']);

function textFiles(dir = ROOT) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : textFiles(full);
    return TEXT_FILE.test(entry.name) ? [path.relative(ROOT, full)] : [];
  });
}

test('generated rule copies match the source', () => {
  for (const [rel, expected] of outputs()) {
    assert.equal(read(rel), expected, `${rel} is stale; run: npm run build`);
  }
});

test('every skill has valid Agent Skills frontmatter', () => {
  const skills = fs.readdirSync(path.join(ROOT, 'skills'));
  assert.deepEqual(skills.sort(), ['pragmatic-programmer', 'pragmatic-review']);
  for (const dir of skills) {
    const text = read(`skills/${dir}/SKILL.md`);
    const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(frontmatter, `${dir}: missing frontmatter`);
    const fields = Object.fromEntries(
      frontmatter[1].split('\n').map((line) => [line.slice(0, line.indexOf(':')), line.slice(line.indexOf(':') + 1).trim()]),
    );
    assert.deepEqual(Object.keys(fields).sort(), ['description', 'name'], `${dir}: only name and description`);
    assert.equal(fields.name, dir, `${dir}: name must match folder`);
    assert.match(fields.name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.ok(fields.name.length <= 64);
    assert.ok(fields.description.length > 0 && fields.description.length <= 1024, `${dir}: description length`);
  }
});

test('manifest versions agree', () => {
  const versions = ['package.json', '.claude-plugin/plugin.json', '.codex-plugin/plugin.json']
    .map((rel) => [rel, JSON.parse(read(rel)).version]);
  for (const [rel, version] of versions) assert.equal(version, versions[0][1], `${rel} version`);
});

test('no em dashes, en dashes, or emoji in any text file', () => {
  const banned = /[\u2012-\u2015\u2600-\u27BF\uFE0F]|[\u{1F000}-\u{1FAFF}]/u;
  for (const rel of textFiles()) {
    read(rel).split('\n').forEach((line, i) => {
      assert.ok(!banned.test(line), `${rel}:${i + 1} contains a banned character`);
    });
  }
});
