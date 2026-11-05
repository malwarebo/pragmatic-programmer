'use strict';
// Shared helpers for the pragmatic-programmer hooks. Claude Code and Codex use the
// same hook events and the same hookSpecificOutput JSON shape, so one code path serves both.

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const MODES = ['on', 'off'];
const BUILT_IN_DEFAULT = 'on';
const RULES_HEADER = 'PRAGMATIC PROGRAMMER MODE: ON';
const OFF_NOTICE = 'PRAGMATIC PROGRAMMER MODE: OFF. Stop applying the pragmatic programmer rules ' +
  'for the rest of this session unless the user turns the mode back on.';
const SKILL_PATH = path.join(__dirname, '..', 'skills', 'pragmatic-programmer', 'SKILL.md');
const STDIN_TIMEOUT_MS = 1000;

function normalizeMode(value) {
  const mode = String(value || '').trim().toLowerCase();
  return MODES.includes(mode) ? mode : null;
}

function configPath() {
  const base = process.env.XDG_CONFIG_HOME ||
    (process.platform === 'win32'
      ? process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
      : path.join(os.homedir(), '.config'));
  return path.join(base, 'pragmatic-programmer', 'config.json');
}

function readConfig() {
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath(), 'utf8').replace(/^\uFEFF/, ''));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (e) {
    return {};
  }
}

// Order: PRAGMATIC_PROGRAMMER_DEFAULT_MODE env var, then config.json defaultMode, then 'on'.
function defaultMode() {
  return normalizeMode(process.env.PRAGMATIC_PROGRAMMER_DEFAULT_MODE) ||
    normalizeMode(readConfig().defaultMode) ||
    BUILT_IN_DEFAULT;
}

function writeDefaultMode(mode) {
  const file = configPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ ...readConfig(), defaultMode: mode }, null, 2) + '\n');
}

// Claude Code sets CLAUDE_PLUGIN_DATA and Codex sets PLUGIN_DATA; both survive plugin updates.
function stateDir() {
  return process.env.CLAUDE_PLUGIN_DATA || process.env.PLUGIN_DATA ||
    path.join(os.homedir(), '.pragmatic-programmer');
}

function projectDir(input) {
  return process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
}

// Known limit: sessions in the same project share one mode (last write wins).
// Key by input.session_id instead if concurrent sessions in one repo need separate modes.
function statePath(input) {
  const key = crypto.createHash('sha256').update(path.resolve(projectDir(input))).digest('hex');
  return path.join(stateDir(), 'modes', key.slice(0, 32));
}

function readMode(input) {
  try {
    return normalizeMode(fs.readFileSync(statePath(input), 'utf8'));
  } catch (e) {
    return null;
  }
}

function writeMode(input, mode) {
  const file = statePath(input);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, mode);
}

const COMMAND = /^[/$@](?:pragmatic-programmer:)?pragmatic-programmer(?:\s+([\s\S]*))?$/;
const EXIT_PHRASE = 'exit pragmatic mode';

/**
 * Reads a mode command from a user message.
 * @param {unknown} prompt the raw message text
 * @returns {{action: 'on' | 'off'} | {action: 'default', mode: 'on' | 'off'} | null} null when not a command
 */
function parseCommand(prompt) {
  const text = String(prompt || '').trim().toLowerCase();
  // The exit phrase counts only as the whole message, so "add an exit pragmatic mode test" is a task.
  if (text.replace(/[.!?\s]+$/, '') === EXIT_PHRASE) return { action: 'off' };
  const match = text.match(COMMAND);
  if (!match) return null;
  const args = (match[1] || '').split(/\s+/).filter(Boolean);
  if (args[0] === 'off') return { action: 'off' };
  if (args[0] === 'default' && normalizeMode(args[1])) return { action: 'default', mode: args[1] };
  // Bare command, "on", or a task after the command ("/pragmatic-programmer fix the login bug").
  return { action: 'on' };
}

function rules() {
  const body = fs.readFileSync(SKILL_PATH, 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
  return RULES_HEADER + '\n\n' + body;
}

// Synchronous write: every hook exits right after emitting, and an async pipe write can be lost.
function emit(event, context) {
  if (!context) return;
  fs.writeSync(1, JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: context } }));
}

// Runs handler(input) once with the parsed stdin JSON. A missing or unparseable payload becomes {}.
// The timer covers hosts that never close stdin, so a hook can never stall the session.
// Errors go to stderr and the hook still exits 0, because a broken hook must not block the user.
function runHook(handler) {
  let raw = '';
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    let input = {};
    try {
      input = JSON.parse(raw.replace(/^\uFEFF/, '')) || {};
    } catch (e) {
      input = {};
    }
    try {
      handler(input);
    } catch (e) {
      process.stderr.write('pragmatic-programmer hook error: ' + e.message + '\n');
    }
    process.exit(0);
  };
  process.stdin.on('data', (chunk) => { raw += chunk; });
  process.stdin.on('end', finish);
  process.stdin.on('error', finish);
  setTimeout(finish, STDIN_TIMEOUT_MS);
}

module.exports = {
  OFF_NOTICE,
  RULES_HEADER,
  defaultMode,
  emit,
  normalizeMode,
  parseCommand,
  readMode,
  rules,
  runHook,
  writeDefaultMode,
  writeMode,
};
