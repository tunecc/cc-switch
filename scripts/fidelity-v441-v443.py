#!/usr/bin/env python3
"""v4.0.41–v4.0.43 轮四 ref 落地保真复算。

方向 A：上游新增行在 HEAD 缺失，扣除 pre-sync-v440 既有分歧。
方向 B：fork 新增行在 HEAD 缺失，包含版本流转等预期项。
用法：python3 scripts/fidelity-v441-v443.py
"""
import collections
import subprocess

UP, BASE, PRE, HEAD = "v4.0.43", "v4.0.40", "pre-sync-v441-v443", "HEAD"


def lines(ref, path):
    result = subprocess.run(
        ["git", "show", f"{ref}:{path}"], capture_output=True
    )
    if result.returncode != 0 or b"\x00" in result.stdout[:8192]:
        return None
    return collections.Counter(
        result.stdout.decode("utf-8", "replace").splitlines()
    )


def names(lo, hi):
    result = subprocess.run(
        ["git", "diff", "--name-only", lo, hi],
        capture_output=True,
        text=True,
    )
    return [line for line in result.stdout.splitlines() if line.strip()]


def added(lo, hi, path):
    result = subprocess.run(
        ["git", "diff", lo, hi, "--", path], capture_output=True
    )
    if b"\x00" in result.stdout[:8192]:
        return collections.Counter()
    added_lines = []
    in_hunk = False
    for line in result.stdout.decode("utf-8", "replace").splitlines():
        if line.startswith("@@"):
            in_hunk = True
        elif in_hunk and line.startswith("+") and not line.startswith("+++"):
            added_lines.append(line[1:])
    return collections.Counter(added_lines)


print("== 方向 A：本轮新增丢失（已扣除 pre-sync-v440 既有分歧）==")
a_total = 0
for path in names(BASE, UP):
    upstream = lines(UP, path)
    if upstream is None:
        continue
    head = lines(HEAD, path) or collections.Counter()
    pre = lines(PRE, path) or collections.Counter()
    new_loss = (upstream - head) - (upstream - pre)
    if new_loss:
        count = sum(new_loss.values())
        a_total += count
        print(f"  {path}: {count}")
        for line, occurrences in new_loss.items():
            print(f"    x{occurrences}: {line[:110]}")
print(f"  TOTAL A: {a_total}")

print("== 方向 B：fork 侧新增行缺失（含预期版本流转）==")
b_total = 0
for path in names(BASE, PRE):
    if not path.startswith(
        ("src/", "src-tauri/", "tests/", ".github/", "package.json", "pnpm-lock.yaml")
    ):
        continue
    wanted = added(BASE, PRE, path)
    if not wanted:
        continue
    head = lines(HEAD, path) or collections.Counter()
    missing = wanted - head
    if missing:
        count = sum(missing.values())
        b_total += count
        print(f"  {path}: {count}")
        for line, occurrences in missing.items():
            print(f"    x{occurrences}: {line[:110]}")
print(f"  TOTAL B: {b_total}")
