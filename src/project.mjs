export const resolutions = [4,5,6,7,8,16,32,64,128];
export function validateProject(p) {
  if (!p || p.format !== 'BitMapper' || p.version !== 1 || !resolutions.includes(p.width) || !resolutions.includes(p.height) || ![1,2,3,4,5,6].includes(p.depth) || !['default','grayscale','rgb','custom'].includes(p.palette) || !Array.isArray(p.custom) || p.custom.length < 8 || p.custom.length > 64 || !p.custom.every(c => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)) || typeof p.bits !== 'string' || !/^[01]*$/.test(p.bits) || p.bits.length > p.width*p.height*p.depth) throw new Error('Invalid BitMapper project file.');
  const custom=[...p.custom];
  while(custom.length < 64) custom.push('#000000');
  return {format:'BitMapper',version:1,width:p.width,height:p.height,depth:p.depth,palette:p.palette,custom,bits:p.bits};
}
export function resizeBits(bits, width, height, nextWidth, nextHeight, depth) {
  let result = '';
  for(let y=0;y<nextHeight;y++) for(let x=0;x<nextWidth;x++) result += x<width && y<height ? bits.slice((y*width+x)*depth,(y*width+x+1)*depth).padEnd(depth,'0') : '0'.repeat(depth);
  return result;
}
export function bmpBytes(width,height,colours) {
  const stride=Math.ceil(width*3/4)*4, bytes=new Uint8Array(54+stride*height), view=new DataView(bytes.buffer);
  bytes[0]=66; bytes[1]=77; view.setUint32(2,bytes.length,true); view.setUint32(10,54,true); view.setUint32(14,40,true); view.setInt32(18,width,true); view.setInt32(22,height,true); view.setUint16(26,1,true); view.setUint16(28,24,true); view.setUint32(34,stride*height,true);
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) { const hex=colours[y*width+x], p=54+(height-1-y)*stride+x*3; bytes[p]=parseInt(hex.slice(5,7),16); bytes[p+1]=parseInt(hex.slice(3,5),16); bytes[p+2]=parseInt(hex.slice(1,3),16); }
  return bytes;
}
