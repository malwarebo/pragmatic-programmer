#!/usr/bin/env node
'use strict';
// Generates every copy of the ruleset from skills/pragmatic-programmer/SKILL.md, the single source.
//   node scripts/build.js          write the generated files
//   node scripts/build.js --check  exit 1 if any generated file is out of date (CI)

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = 'skills/pragmatic-programmer/SKILL.md';
const NOTICE = '<!-- Generated from skills/pragmatic-programmer/SKILL.md by scripts/build.js. Do not edit. -->';

function readSource() {
  const text = fs.readFileSync(path.join(ROOT, SOURCE), 'utf8').replace(/\r\n/g, '\n');
  return text.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
}

// Splits markdown on level-2 headings; returns the text with the named sections removed.
function withoutSections(body, names) {
  return body
    .split(/\n(?=## )/)
    .filter((part) => !names.some((name) => part.startsWith(`## ${name}\n`)))
    .join('\n');
}

// The section from "## <name>" up to the next level-2 heading.
function section(body, name) {
  const part = body.split(/\n(?=## )/).find((p) => p.startsWith(`## ${name}\n`));
  if (!part) throw new Error(`${SOURCE} has no "## ${name}" section`);
  return part.trim();
}

/** @returns {Array<[string, string]>} [relative path, expected content] */
function outputs() {
  const body = readSource();
  // Rules-file installs have no hooks, so the on/off commands would not work there.
  const alwaysOn = withoutSections(body, ['Commands']).replace(
    'Apply this mode to every task until it is turned off.',
    'Apply this mode to every task.',
  );
  return [
    ['AGENTS.md', `${NOTICE}\n\n${alwaysOn}\n`],
    [
      '.cursor/rules/pragmatic-programmer.mdc',
      `---\ndescription: Pragmatic programmer mode, always on.\nglobs:\nalwaysApply: true\n---\n\n${NOTICE}\n\n${alwaysOn}\n`,
    ],
    ['skills/pragmatic-review/references/rules.md', `${NOTICE}\n\n${section(body, 'Rules')}\n`],
  ];
}

function main() {
  const check = process.argv.includes('--check');
  const stale = [];
  for (const [rel, expected] of outputs()) {
    const file = path.join(ROOT, rel);
    const actual = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (actual === expected) continue;
    if (check) {
      stale.push(rel);
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, expected);
      console.log(`wrote ${rel}`);
    }
  }
  if (stale.length > 0) {
    console.error(`Out of date: ${stale.join(', ')}. Run: node scripts/build.js`);
    process.exit(1);
  }
  if (check) console.log('Generated files are up to date.');
}

if (require.main === module) main();

module.exports = { outputs };
