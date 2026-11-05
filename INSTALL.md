# Install

| Platform | What you get | Section |
|---|---|---|
| Claude Code | Plugin: both skills, hooks, mode on by default, subagents included | [Claude Code](#claude-code) |
| Claude apps (claude.ai, Desktop) | Both skills, uploaded as ZIPs | [Claude apps](#claude-apps) |
| Codex | Plugin: both skills and hooks | [Codex](#codex) |
| Cursor | Skills, plus an optional always-on rule | [Cursor](#cursor) |
| ChatGPT | Both skills, uploaded as ZIPs | [ChatGPT](#chatgpt) |
| Any other agent | Always-on rules file | [Other agents](#other-agents) |

The Claude apps, Cursor, and ChatGPT install from a local clone. Clone the repository once:

```bash
git clone https://github.com/malwarebo/pragmatic-programmer.git
cd pragmatic-programmer
```

The Claude apps and ChatGPT take ZIPs. Run `npm run package` in the clone to write `dist/pragmatic-programmer.zip` and `dist/pragmatic-review.zip` (requires `node` and `zip`).

## Claude Code

Add the marketplace, then install the plugin. Send these as two separate prompts:

```
/plugin marketplace add malwarebo/pragmatic-programmer
```
```
/plugin install pragmatic-programmer@pragmatic-programmer
```

To install from a local clone, use the clone's path in place of `malwarebo/pragmatic-programmer` in the first command. Start a new session after installing. The ruleset loads at session start, so you do not need to type anything to turn it on.

## Claude apps

1. Turn on code execution:
   - Free, Pro, Max, and Ultra: Settings > Capabilities > "Code execution and file creation" (called "Create and edit files" in the newer layout).
   - Team and Enterprise: an owner turns on "Cloud code execution and file creation" in Organization settings > Plugins & skills, on the Policy tab.
2. Open Customize > Skills, click `+`, then `+ Create skill`, then `Upload a skill`.
3. Upload `dist/pragmatic-programmer.zip`, then repeat for `dist/pragmatic-review.zip`.

To use it, ask for the skill by name ("use pragmatic-programmer") or let Claude pick it from the description. The Claude apps have no hooks, so the mode lasts for the conversation where it was invoked.

## Codex

The Codex CLI needs plugin support. If `codex plugin --help` does not list `add`, `list`, `marketplace`, and `remove`, upgrade Codex (`npm install -g @openai/codex@latest`, or `brew upgrade codex` for a Homebrew install).

```bash
codex plugin marketplace add malwarebo/pragmatic-programmer
codex plugin add pragmatic-programmer@pragmatic-programmer
```

Run `codex`, open `/hooks`, review and trust the three hooks, then start a new thread. Turn the mode off with `$pragmatic-programmer off`.

## Cursor

From the root of the clone, link both skills:

```bash
mkdir -p ~/.cursor/skills
ln -s "$PWD/skills/pragmatic-programmer" ~/.cursor/skills/pragmatic-programmer
ln -s "$PWD/skills/pragmatic-review" ~/.cursor/skills/pragmatic-review
```

| Goal | How |
|---|---|
| One message | Type `/pragmatic-programmer` in Agent chat. |
| A whole chat | Select the skill as a Custom Mode with Option+Enter (macOS) or Alt+Enter (Windows). |
| Always on in one project | Copy `.cursor/rules/pragmatic-programmer.mdc` into `<project>/.cursor/rules/`. |

## ChatGPT

Requires a ChatGPT Business, Enterprise, Edu, or Healthcare workspace whose admin allows skill uploads.

1. Open Plugins > Skills, select Create, then Upload from your computer.
2. Upload `dist/pragmatic-programmer.zip`, then `dist/pragmatic-review.zip`. ChatGPT scans each skill before it becomes available.

To use it, type `@` in a chat and select the skill. ChatGPT has no hooks, so the mode lasts for the chat where it was invoked.

## Other agents

Copy `AGENTS.md` into the project root. If the project already has an `AGENTS.md`, append this one to it. The rules then apply to every task in that project, and the on/off commands do not exist. Codex, Cursor, GitHub Copilot, and other agents that read `AGENTS.md` pick it up.

## Settings

These apply where the hooks run (Claude Code and Codex). The first one that is set wins:

1. The environment variable `PRAGMATIC_PROGRAMMER_DEFAULT_MODE=on` or `off`.
2. `defaultMode` in `~/.config/pragmatic-programmer/config.json` (`%APPDATA%\pragmatic-programmer\config.json` on Windows, `$XDG_CONFIG_HOME/pragmatic-programmer/config.json` when that variable is set). `/pragmatic-programmer default off` writes this file for you.
3. Built-in default: `on`.

The live mode is stored per project in the plugin's data directory, so sessions in different repositories do not affect each other. Sessions in the same repository share one mode.

## Uninstall

| Platform | Command |
|---|---|
| Claude Code | `/plugin uninstall pragmatic-programmer@pragmatic-programmer`, then `/plugin marketplace remove pragmatic-programmer` |
| Codex | `codex plugin remove pragmatic-programmer@pragmatic-programmer`, then `codex plugin marketplace remove pragmatic-programmer` |
| Cursor | `rm ~/.cursor/skills/pragmatic-programmer ~/.cursor/skills/pragmatic-review`, and delete any copied `.mdc` rule |
| Claude apps, ChatGPT | Delete both skills from the Skills page |
| Other agents | Delete the copied `AGENTS.md` text |

To remove the saved default as well, delete `~/.config/pragmatic-programmer/`.
