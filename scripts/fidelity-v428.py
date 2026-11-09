#!/usr/bin/env python3
"""v4.0.28 轮四 ref 落地保真复算（可重复执行，不含硬编码条数）。

口径：
- 方向 A：上游 v4.0.26..v4.0.28 变更文件在 HEAD 缺失的 v4.0.28 行，**扣除 pre-sync-v428 同步前就已存在的分歧**，
  只剩「本轮新增丢失」。这是唯一需要逐行归因的集合。
- 方向 B：fork 侧 v4.0.26..pre-sync-v428 新增行在 HEAD 缺失的行（含版本流转等预期项）。
用法：python3 scripts/fidelity-v428.py
"""
import collections
import subprocess

UP, BASE, PRE, HEAD = 'v4.0.28', 'v4.0.26', 'pre-sync-v428', 'HEAD'


def lines(ref, path):
    r = subprocess.run(['git', 'show', f'{ref}:{path}'], capture_output=True)
    if r.returncode != 0 or b'\x00' in r.stdout[:8192]:
        return None
    return collections.Counter(r.stdout.decode('utf-8', 'replace').splitlines())


def names(lo, hi):
    out = subprocess.run(['git', 'diff', '--name-only', lo, hi], capture_output=True, text=True).stdout
    return [l for l in out.splitlines() if l.strip()]


def added(lo, hi, path):
    r = subprocess.run(['git', 'diff', lo, hi, '--', path], capture_output=True)
    if b'\x00' in r.stdout[:8192]:
        return collections.Counter()
    out = r.stdout.decode('utf-8', 'replace')
    acc, in_hunk = [], False
    for l in out.splitlines():
        if l.startswith('@@'):
            in_hunk = True
        elif in_hunk and l.startswith('+') and not l.startswith('+++'):
            acc.append(l[1:])
    return collections.Counter(acc)


print('== 方向 A：本轮新增丢失（已扣除 pre-sync-v428 既有分歧）==')
a_total = 0
for f in names(BASE, UP):
    up = lines(UP, f)
    if up is None:
        continue
    head = lines(HEAD, f) or collections.Counter()
    pre = lines(PRE, f) or collections.Counter()
    new_loss = (up - head) - (up - pre)
    if new_loss:
        n = sum(new_loss.values()); a_total += n
        print(f'  {f}: {n}')
        for l, c in new_loss.items():
            print(f'    x{c}: {l[:110]}')
print(f'  TOTAL A: {a_total}')

print('== 方向 B：fork 侧新增行缺失（含预期版本流转）==')
b_total = 0
for f in names(BASE, PRE):
    if not any(f.startswith(p) for p in ('src/', 'src-tauri/', 'tests/', '.github/', 'package.json', 'pnpm-lock.yaml')):
        continue
    want = added(BASE, PRE, f)
    if not want:
        continue
    head = lines(HEAD, f) or collections.Counter()
    miss = want - head
    if miss:
        n = sum(miss.values()); b_total += n
        print(f'  {f}: {n}')
        for l, c in miss.items():
            print(f'    x{c}: {l[:110]}')
print(f'  TOTAL B: {b_total}')
