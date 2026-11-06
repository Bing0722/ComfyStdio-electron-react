import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { manageVersions } from '../src/main/comfy/versions.ts'
test('version switch uses fetched refs and refuses dirty worktrees', async t => {
 const root = await mkdtemp(join(tmpdir(), 'comfy-version-'))
 t.after(() => rm(root, { recursive: true, force: true }))
 const git = (...args) => execFileSync('git', args, { cwd: root })
 git('init'); git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.com')
 await writeFile(join(root, 'version'), 'one'); git('add', 'version'); git('commit', '-m', 'one')
 git('update-ref', 'refs/comfystdio/releases/v1.0.0', 'HEAD')
 assert.deepEqual((await manageVersions(root, 'status')).tags, ['v1.0.0'])
 await writeFile(join(root, 'version'), 'two')
 await assert.rejects(manageVersions(root, 'switch', 'v1.0.0'), /本地改动/)
 git('checkout', '--', 'version')
 assert.equal((await manageVersions(root, 'switch', 'v1.0.0')).branch, '')
 await assert.rejects(manageVersions(root, 'switch', '--force'), /无效/)
})
