'use strict';
// SessionStart: set the session's mode and, when it is on, inject the ruleset as hidden context.

const { defaultMode, emit, readMode, rules, runHook, writeMode } = require('./runtime');

runHook((input) => {
  // Compaction re-runs SessionStart inside the same conversation, so it keeps the live mode.
  // Every other start (startup, resume, clear, fork) begins at the configured default.
  const mode = input.source === 'compact' ? readMode(input) || defaultMode() : defaultMode();
  writeMode(input, mode);
  if (mode === 'on') emit('SessionStart', rules());
});
