import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import { RuntimeService, logLevel } from '../src/main/runtime/service.ts'
const waitFor = async predicate => { const until = Date.now()+6000; while(!predicate()) { if(Date.now()>until) throw Error('timeout'); await new Promise(r=>setTimeout(r,40)) } }
async function port() { const server = createServer(); await new Promise(r=>server.listen(0,'127.0.0.1',r)); const port = server.address().port; await new Promise(r=>server.close(r)); return port }
test('real owned process starts in API mode, captures warnings/errors, restarts, and stops', async () => {
 const root=await mkdtemp(join(tmpdir(),'comfy-runtime-')); let opened=0
 const runtime = new RuntimeService(()=>{},async()=>{opened++},await port())
 try {
  await writeFile(join(root,'main.py'), `import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
print('ready fixture', flush=True)
print('WARNING fixture', file=sys.stderr, flush=True)
print('ValueError: fixture exception', file=sys.stderr, flush=True)
class Handler(BaseHTTPRequestHandler):
 def do_GET(self):
  self.send_response(200)
  self.end_headers()
  self.wfile.write(b'{}')
HTTPServer(('127.0.0.1', int(sys.argv[sys.argv.index('--port')+1])),Handler).serve_forever()
`)
  await runtime.start(root,'API 服务',(process.env.COMFY_TEST_PYTHON || (process.platform === 'win32' ? 'python' : 'python3'))); await waitFor(()=>runtime.state.status==='运行中'); assert.equal(opened,0)
  assert(runtime.state.logs.some(log=>log.level==='警告')); assert(runtime.state.logs.some(log=>log.level==='异常'))
  await assert.rejects(runtime.start(root,'API 服务',(process.env.COMFY_TEST_PYTHON || (process.platform === 'win32' ? 'python' : 'python3'))))
  const before=runtime.state.logs.length
  await runtime.restart(root,'打开网页',(process.env.COMFY_TEST_PYTHON || (process.platform === 'win32' ? 'python' : 'python3'))); await waitFor(()=>runtime.state.status==='运行中'); assert.equal(opened,1); assert(runtime.state.logs.length>before)
  await runtime.stop(); assert.equal(runtime.state.status,'已停止'); assert.equal(runtime.busy,false)
 } finally { await runtime.stop(); await rm(root,{recursive:true,force:true}) }
})
test('occupied ports and missing Python are failures with diagnostic logs', async () => {
 const root=await mkdtemp(join(tmpdir(),'comfy-runtime-')); const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const runtime=new RuntimeService(()=>{},async()=>{},server.address().port)
 try {
  await writeFile(join(root,'main.py'),'')
  await assert.rejects(runtime.start(root,'API 服务',(process.env.COMFY_TEST_PYTHON || (process.platform === 'win32' ? 'python' : 'python3'))),/端口/)
  await new Promise(r=>server.close(r))
  await runtime.start(root,'API 服务',join(root,'missing-python'));await waitFor(()=>runtime.state.status==='失败');assert(runtime.state.logs.some(log=>log.message.includes('ENOENT')))
 } finally {if(server.listening)await new Promise(r=>server.close(r));await runtime.stop();await rm(root,{recursive:true,force:true})}
})
test('log classification and bounded history preserve diagnostic levels',()=>{
 assert.equal(logLevel('Traceback (most recent call last):'),'异常');assert.equal(logLevel('DeprecationWarning'),'警告');assert.equal(logLevel('loading weights'),'信息')
 const runtime=new RuntimeService(()=>{},async()=>{}); for(let i=0;i<1010;i++)runtime.log(String(i));assert.equal(runtime.state.logs.length,1000);assert.equal(runtime.state.logs[0].message,'10')
})
