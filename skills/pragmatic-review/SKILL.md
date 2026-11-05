---
name: pragmatic-review
description: One-shot code review against the pragmatic programmer rules. Checks security, resource handling, concurrency, correctness, tests, design, and naming, and ties each finding to a rule ID, a file and line, and a concrete fix. Use for "review this", "review my PR", "review the last commit", "is this ready to merge", or /pragmatic-review, whether or not pragmatic programmer mode is on.
---

# Pragmatic Review

Review a change the way the person who maintains it next year would. Change no code unless the user asks.

## Rules source

Findings cite rule IDs such as `DEF-2` or `DES-5`. If those rules are not already in context, read `references/rules.md` before reviewing.

## Scope

Review what the user names: files, a diff, a branch, a commit, or a pull request. When nothing is named, review the uncommitted changes; when there are none, review the last commit.

## Procedure

1. Read the changed code and the code connected to it: callers of every changed function, the functions it calls, and its tests. A change can break code it does not touch.
2. Check in this order: DEF (security, validation, errors, resources), CON, correctness against the stated intent, TEST-3 coverage of risky logic, DES, then CODE-3 naming and OWN-5 comments.
3. Back every finding with evidence: a concrete input that fails, or the exact lines. Run the code or tests when you can do so without network calls or writes outside a temporary directory. Drop any finding you cannot support.
4. Skip style preferences the codebase does not enforce.

## Output

First line: the verdict (`Ready`, `Ready after fixes`, or `Not ready`) and the reason in one sentence.

Then the findings, most severe first, one per line:

```
[<severity>] <file>:<line> <rule ID>: <problem>. Fix: <concrete change>.
```

Severity:

- `critical`: data loss, security hole, or crash on a common path.
- `high`: wrong behavior, resource leak, or race condition.
- `medium`: design that makes a likely change expensive.
- `low`: naming, comments, or minor cleanup.

End with these lines:

```
Verified: <what you ran and what you saw>
Not verified: <what you could not check and why>
Missing tests: <the smallest tests that would catch the critical and high findings>
```

With no findings, the verdict line is `Ready. No findings.`, followed by the Verified and Not verified lines.
