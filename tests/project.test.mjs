import test from 'node:test';
import assert from 'node:assert/strict';
import {resizeBits,validateProject,bmpBytes} from '../src/project.mjs';
test('full RGB projects preserve all channels at maximum resolution',()=>{
 const bits='000100100011010001010110'.repeat(128*128);
 const project={format:'BitMapper',version:1,width:128,height:128,depth:24,palette:'rgb',custom:Array(64).fill('#000000'),bits};
 assert.deepEqual(validateProject(JSON.parse(JSON.stringify(project))),project);
 assert.equal(bits.length,393216);
 assert.equal(resizeBits('111111110000000000000000000000000000000011111111',2,1,3,1,24),'111111110000000000000000000000000000000011111111'+'0'.repeat(24));
});
test('resizing preserves row and column positions',()=>{
 assert.equal(resizeBits('10010110',4,2,5,3,1),'100100110000000');
 assert.equal(resizeBits('000001010011100101110111',4,2,2,2,3),'000001100101');
});
test('project round-trip and validation',()=>{
 const p={format:'BitMapper',version:1,width:128,height:128,depth:5,palette:'custom',custom:Array(64).fill('#aabbcc'),bits:'10101'.repeat(16384)};
 assert.deepEqual(validateProject(JSON.parse(JSON.stringify(p))),p);
 for(const change of [{bits:'x'},{width:999},{depth:9},{custom:['red']},{bits:p.bits+'0'},{version:2}]) assert.throws(()=>validateProject({...p,...change}));
});
test('older eight-colour projects remain importable',()=>{
 const p=validateProject({format:'BitMapper',version:1,width:4,height:4,depth:3,palette:'custom',custom:Array(8).fill('#aabbcc'),bits:'101'.repeat(5)});
 assert.equal(p.custom.length,64);
});
test('BMP headers, BGR ordering, row padding and bottom-up orientation',()=>{
 const b=bmpBytes(1,2,['#ff0000','#0000ff']),v=new DataView(b.buffer);
 assert.equal(v.getUint32(2,true),62); assert.equal(v.getUint32(10,true),54); assert.equal(v.getUint16(28,true),24);
 assert.deepEqual([...b.slice(54)],[255,0,0,0,0,0,255,0]);
});
