# Pragmatic Programmer

Turns your AI coding agent into a pragmatic programmer. While the mode is on, the agent owns results, keeps code easy to change, proves claims with evidence, and works in small verified steps. It follows 61 numbered rules for design, defensive coding, concurrency, testing, debugging, planning, and delivery, based on the practices in *The Pragmatic Programmer* by David Thomas and Andrew Hunt.

Works in Claude Code, the Claude apps, Codex, Cursor, and ChatGPT. Install steps for each: [INSTALL.md](INSTALL.md). In Claude Code:

```
/plugin install pragmatic-programmer --marketplace malwarebo/pragmatic-programmer
```

## How it works

| Piece | What it does |
|---|---|
| `skills/pragmatic-programmer` | The mode. Its `SKILL.md` is the single source of the ruleset. |
| `skills/pragmatic-review` | A one-shot review that ties every finding to a rule ID, a file and line, and a fix. Works with the mode on or off. |
| `hooks/` | Claude Code and Codex: injects the ruleset at session start and after compaction, injects it into every subagent (Claude Code), and handles the on/off commands. |
| `AGENTS.md`, `.cursor/rules/` | Always-on rule files for agents without hooks. Generated from the skill. |

The injected ruleset stays under 10,000 characters, which is the most Claude Code puts into context from a hook.

## Commands

| Command | Effect |
|---|---|
| `/pragmatic-programmer` (Codex: `$pragmatic-programmer`) | Turn the mode on. |
| `/pragmatic-programmer off`, or a message that is exactly `exit pragmatic mode` | Turn the mode off for the rest of the session. |
| `/pragmatic-programmer default on` or `default off` | Choose the mode new sessions start in. The default is `on`. |
| `/pragmatic-review [target]` | Review files, a diff, a branch, a commit, or a pull request. With no target, it reviews uncommitted changes. |

Hooks make these commands work across a whole session in Claude Code and Codex. In Cursor and ChatGPT, invoking a skill applies it to that conversation (see [INSTALL.md](INSTALL.md)).

## What a session looks like

- Before fixing a bug, the agent writes a test that reproduces it, runs the suite, searches for the same defect elsewhere, and names any harm already done, such as customers who were overcharged.
- Every task that changes code ends with a fixed report: `Result`, `Changes`, `Verified`, `Not verified`, `Follow-ups`.
- Review findings come back one per line: `[high] orders.py:48 DEF-2: bare except hides every failure. Fix: catch requests.RequestException and re-raise with context.`

## Repository layout

```
.claude-plugin/        Claude Code plugin and marketplace manifests
.codex-plugin/         Codex plugin manifest
.agents/plugins/       Codex marketplace
.cursor/rules/         always-on Cursor rule (generated)
skills/                the two skills
hooks/                 session hooks for Claude Code and Codex
scripts/build.js       generates every copy of the ruleset from the skill
tests/                 hook, manifest, and repository checks
evals/                 test cases for `claude plugin eval`
AGENTS.md              always-on rules for Codex and other agents (generated)
```

## Development

| Task | Command |
|---|---|
| Regenerate `AGENTS.md`, the Cursor rule, and the review skill's rules copy | `npm run build` |
| Run all checks | `npm test` |
| Build upload ZIPs into `dist/` for the Claude apps and ChatGPT | `npm run package` |
| Run the evals with and without the plugin (billed model runs) | `claude plugin eval . --scaffold --allow-tools Write,Edit,Bash` |

Edit only `skills/pragmatic-programmer/SKILL.md` for rule changes, then run `npm run build`. CI fails when a generated file is stale, when a manifest version differs, when the ruleset passes 10,000 characters, or when any text file contains an em dash, an en dash, or an emoji.

## Credits

The concepts come from *The Pragmatic Programmer: Your Journey to Mastery*, 20th Anniversary Edition, by David Thomas and Andrew Hunt (Addison-Wesley, 2019). The rules are written in original wording.
