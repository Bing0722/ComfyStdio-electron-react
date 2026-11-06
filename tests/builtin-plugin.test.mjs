import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readInstallation } from '../src/main/comfy/read-installation.ts'
import { managePlugin } from '../src/main/comfy/plugins.ts'
test('built-in websocket node is excluded while user single-file plugins remain', async t => {
 const root = await mkdtemp(join(tmpdir(), 'builtin-plugin-'))
 t.after(() => rm(root, { recursive: true, force: true }))
 await mkdir(join(root, 'custom_nodes')); await mkdir(join(root, 'models'))
 for (const file of ['main.py', 'folder_paths.py', 'custom_nodes/websocket_image_save.py', 'custom_nodes/websocket_image_save.py.disabled', 'custom_nodes/user.py']) await writeFile(join(root, file), '')
 assert.deepEqual(Object.keys((await readInstallation(root)).plugins), ['user.py'])
 await assert.rejects(managePlugin(root, undefined, 'delete', 'websocket_image_save.py', '', () => {}, async () => assert.fail()), /内置/)
 await assert.rejects(managePlugin(root, undefined, 'check-update', 'user.py', ''), /单文件/)
})
