'use strict';
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { parseCommand, rules } = require('../hooks/runtime');

const HOOKS = path.join(__dirname, '..', 'hooks');
const CLAUDE_CONTEXT_CAP = 10000; // Claude Code replaces longer hook context with a file path.

// A fresh, isolated environment per test: state, config, and project live in temp dirs.
function sandbox(extraEnv = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-hooks-'));
  const env = {
    PATH: process.env.PATH,
    HOME: root,
    CLAUDE_PLUGIN_DATA: path.join(root, 'data'),
    XDG_CONFIG_HOME: path.join(root, 'config'),
    CLAUDE_PROJECT_DIR: path.join(root, 'project'),
    ...extraEnv,
  };
  const run = (script, input) => {
    const result = spawnSync(process.execPath, [path.join(HOOKS, script)], {
      env,
      input: typeof input === 'string' ? input : JSON.stringify(input),
      encoding: 'utf8',
      timeout: 5000,
    });
    assert.equal(result.status, 0, `${script} exited ${result.status}: ${result.stderr}`);
    if (!result.stdout) return null;
    const output = JSON.parse(result.stdout).hookSpecificOutput;
    return output;
  };
  return { env, run };
}

test('session start injects the ruleset by default, within the Claude Code cap', () => {
  const { run } = sandbox();
  const out = run('activate.js', { source: 'startup' });
  assert.equal(out.hookEventName, 'SessionStart');
  assert.match(out.additionalContext, /^PRAGMATIC PROGRAMMER MODE: ON\n\n# Pragmatic Programmer Mode/);
  assert.ok(out.additionalContext.includes('DBG-8'));
  assert.ok(!out.additionalContext.includes('name: pragmatic-programmer'), 'frontmatter must be stripped');
  assert.ok(out.additionalContext.length <= CLAUDE_CONTEXT_CAP, `ruleset is ${out.additionalContext.length} chars`);
});

test('default off via env var injects nothing', () => {
  const { run } = sandbox({ PRAGMATIC_PROGRAMMER_DEFAULT_MODE: 'off' });
  assert.equal(run('activate.js', { source: 'startup' }), null);
});

test('off command persists through compaction and silences subagents', () => {
  const { run } = sandbox();
  run('activate.js', { source: 'startup' });
  const off = run('mode-tracker.js', { prompt: '/pragmatic-programmer off' });
  assert.match(off.additionalContext, /MODE: OFF/);
  assert.equal(run('activate.js', { source: 'compact' }), null);
  assert.equal(run('subagent.js', { agent_type: 'Explore' }), null);
});

test('a fresh session returns to the default after off', () => {
  const { run } = sandbox();
  run('mode-tracker.js', { prompt: 'exit pragmatic mode' });
  assert.ok(run('activate.js', { source: 'startup' }).additionalContext.startsWith('PRAGMATIC PROGRAMMER MODE: ON'));
});

test('subagents get the ruleset while the mode is on', () => {
  const { run } = sandbox();
  run('activate.js', { source: 'startup' });
  const out = run('subagent.js', { agent_type: 'general-purpose' });
  assert.equal(out.hookEventName, 'SubagentStart');
  assert.equal(out.additionalContext, rules());
});

test('default command writes config and leaves the current session alone', () => {
  const { env, run } = sandbox();
  const out = run('mode-tracker.js', { prompt: '/pragmatic-programmer default off' });
  assert.match(out.additionalContext, /New sessions now start with pragmatic programmer mode off/);
  const config = JSON.parse(fs.readFileSync(path.join(env.XDG_CONFIG_HOME, 'pragmatic-programmer', 'config.json'), 'utf8'));
  assert.deepEqual(config, { defaultMode: 'off' });
  assert.equal(run('activate.js', { source: 'startup' }), null);
});

test('ordinary prompts produce no output', () => {
  const { run } = sandbox();
  assert.equal(run('mode-tracker.js', { prompt: 'add an exit pragmatic mode test' }), null);
});

test('malformed or empty stdin never fails the hook', () => {
  const { run } = sandbox();
  assert.ok(run('activate.js', 'not json').additionalContext.startsWith('PRAGMATIC PROGRAMMER MODE: ON'));
  assert.equal(run('mode-tracker.js', ''), null);
});

test('modes are kept per project', () => {
  const a = sandbox();
  const b = sandbox({ CLAUDE_PLUGIN_DATA: a.env.CLAUDE_PLUGIN_DATA });
  a.run('activate.js', { source: 'startup' });
  b.run('activate.js', { source: 'startup' });
  a.run('mode-tracker.js', { prompt: '/pragmatic-programmer off' });
  assert.equal(a.run('subagent.js', {}), null);
  assert.equal(b.run('subagent.js', {}).hookEventName, 'SubagentStart');
});

test('parseCommand recognizes every command form and nothing else', () => {
  const cases = [
    ['/pragmatic-programmer', { action: 'on' }],
    ['$pragmatic-programmer', { action: 'on' }],
    ['/pragmatic-programmer:pragmatic-programmer on', { action: 'on' }],
    ['/pragmatic-programmer fix the login bug', { action: 'on' }],
    ['/pragmatic-programmer off', { action: 'off' }],
    ['  Exit Pragmatic Mode!  ', { action: 'off' }],
    ['/pragmatic-programmer default ON', { action: 'default', mode: 'on' }],
    ['/pragmatic-programmer default maybe', { action: 'on' }],
    ['/pragmatic-review', null],
    ['please exit pragmatic mode later', null],
    ['', null],
    [undefined, null],
  ];
  for (const [prompt, expected] of cases) {
    assert.deepEqual(parseCommand(prompt), expected, `prompt: ${JSON.stringify(prompt)}`);
  }
});
