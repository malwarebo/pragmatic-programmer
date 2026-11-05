'use strict';
// SubagentStart (Claude Code): SessionStart context never reaches subagents, so inject the ruleset
// into each one while the mode is on.

const { emit, readMode, rules, runHook } = require('./runtime');

runHook((input) => {
  if (readMode(input) === 'on') emit('SubagentStart', rules());
});
