'use strict';
// UserPromptSubmit: turn the mode on or off, or change the default, from the user's message.

const { OFF_NOTICE, RULES_HEADER, emit, parseCommand, runHook, writeDefaultMode, writeMode } = require('./runtime');

runHook((input) => {
  const command = parseCommand(input.prompt);
  if (!command) return;
  if (command.action === 'default') {
    writeDefaultMode(command.mode);
    emit('UserPromptSubmit', `New sessions now start with pragmatic programmer mode ${command.mode}. ` +
      'The current session is unchanged. Confirm in one line.');
    return;
  }
  writeMode(input, command.action);
  // Turning it on needs only the header: invoking the skill loads its full body.
  emit('UserPromptSubmit', command.action === 'on' ? RULES_HEADER : OFF_NOTICE);
});
