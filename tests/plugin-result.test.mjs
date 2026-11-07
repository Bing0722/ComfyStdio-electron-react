import test from 'node:test'
import assert from 'node:assert/strict'
import { pluginResult, pluginProgress } from '../src/renderer/src/features/plugins/plugin-result.ts'
test('raw errors never expand plugin status or progress', () => {
 const error = '失败：代码已同步，但依赖安装失败：' + 'WARNING SSL timeout\n'.repeat(1000)
 assert.equal(pluginResult(error), '依赖安装失败 · 请查看运行日志')
 assert.equal(pluginResult('有更新：落后 12 个提交'), '有可用更新')
 assert.equal(pluginResult(''), '')
 assert.equal(pluginProgress('ERROR ' + 'x'.repeat(10000)), '正在下载插件…')
})
