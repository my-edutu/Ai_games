// CC0 glTF 2.0 asset intake for cinematics. No third-party runtime dependency.
// Supports GLB v2, embedded binary buffers, indexed/nonindexed triangle primitives,
// node TRS/matrix hierarchy, vertex normals and material base colors. Fail closed on
// unsupported compressed or external-buffer assets; procedural 3D fallback remains live.
const MAGIC=0x46546c67,JSON_MAGIC=0x4e4f534a,BIN_MAGIC=0x004e4942;
const COMPONENT={5120:{bytes:1,read:'getInt8'},5121:{bytes:1,read:'getUint8'},
  5122:{bytes:2,read:'getInt16'},5123:{bytes:2,read:'getUint16'},
  5123:{bytes:2,read:'getUint16'},5125:{bytes:4,read:'getUint32'},
  5126:{bytes:4,read:'getFloat32'}};
const DIM={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
const identity=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function mul(a,b){const out=Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)
  for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
function transform(m,p,w=1){return[
  m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12]*w,
  m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13]*w,
  m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]*w
];}
function trs(node){
  if(node.matrix)return node.matrix;
  const [x,y,z,w]=node.rotation||[0,0,0,1],t=node.translation||[0,0,0],s=node.scale||[1,1,1];
  const x2=x+x,y2=y+y,z2=z+z;
  const xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;
  return [(1-(yy+zz))*s[0],(xy+wz)*s[0],(xz-wy)*s[0],0,
    (xy-wz)*s[1],(1-(xx+zz))*s[1],(yz+wx)*s[1],0,
    (xz+wy)*s[2],(yz-wx)*s[2],(1-(xx+yy))*s[2],0,
    t[0],t[1],t[2],1];
}
export function parseGlb(bytes,{maxBytes=8_000_000,maxTriangles=90_000}={}){
  const array=bytes instanceof ArrayBuffer?bytes:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
  if(array.byteLength<28||array.byteLength>maxBytes)throw Error('GLB byte budget');
  const dv=new DataView(array);
  if(dv.getUint32(0,true)!==MAGIC||dv.getUint32(4,true)!==2||dv.getUint32(8,true)!==array.byteLength)throw Error('Invalid GLB header');
  const td=new TextDecoder('utf-8',{fatal:true});let json=null,bin=null,pos=12;
  while(pos+8<=array.byteLength){
    const len=dv.getUint32(pos,true),kind=dv.getUint32(pos+4,true),start=pos+8;
    if(start+len>array.byteLength||len%4!==0)throw Error('Corrupt GLB chunk');
    if(kind===JSON_MAGIC&&!json)json=JSON.parse(td.decode(new Uint8Array(array,start,len)).replace(/\\u0000/g,'').trimEnd());
    if(kind===BIN_MAGIC&&!bin)bin={offset:start,size:len};
    pos=start+len;
  }
  if(!json||!bin||json.asset?.version?.split('.')[0]!=='2')throw Error('GLB requires embedded geometry and glTF 2.0');
  const access=(index)=>{
    const a=json.accessors?.[index],view=json.bufferViews?.[a?.bufferView],type=COMPONENT[a?.componentType],size=DIM[a?.type];
    if(!a||!view||!type||!size||view.buffer!==0||a.sparse)throw Error('Unsupported GLB accessor');
    if(a.count<0||a.count>maxTriangles*3)throw Error('GLB accessor budget');
    const stride=view.byteStride||size*type.bytes;
    const off=bin.offset+(view.byteOffset||0)+(a.byteOffset||0);
    if(stride<size*type.bytes||off<bin.offset||off+stride*Math.max(0,a.count-1)+size*type.bytes>bin.offset+bin.size)throw Error('GLB view outside binary');
    const data=new DataView(array),out=[];
    for(let i=0;i<a.count;i++){
      const values=[];
      for(let j=0;j<size;j++)values.push(data[type.read](off+i*stride+j*type.bytes,true));
      out.push(size===1?values[0]:values);
    }
    return out;
  };
  const out=[];
  let count=0;
  const traverse=(nodeId,parent,visited)=>{
    if(visited.has(nodeId))throw Error('GLB hierarchy cycle');
    const node=json.nodes?.[nodeId];if(!node)throw Error('Missing node');
    const next=new Set(visited);next.add(nodeId);
    const world=mul(parent,trs(node));
    if(node.mesh!==undefined){
      const mesh=json.meshes?.[node.mesh];
      if(!mesh)throw Error('Missing glTF mesh');
      for(const primitive of mesh.primitives||[]){
        if(primitive.mode!==undefined&&primitive.mode!==4)continue;
        if(primitive.extensions?.KHR_draco_mesh_compression||primitive.extensions?.EXT_meshopt_compression)continue;
        const positions=access(primitive.attributes.POSITION);
        const normals=primitive.attributes.NORMAL!==undefined?access(primitive.attributes.NORMAL):null;
        const indices=primitive.indices!==undefined?access(primitive.indices):positions.map((_,i)=>i);
        if(indices.length%3!==0||count+indices.length/3>maxTriangles)throw Error('GLB triangle budget');
        const base=json.materials?.[primitive.material]?.pbrMetallicRoughness?.baseColorFactor||[.8,.8,.8,1];
        const color=base.slice(0,3).map(v=>Math.max(0,Math.min(1,v)));
        const verts=[];
        for(let i=0;i<indices.length;i+=3){
          const tri=[];
          for(let j=0;j<3;j++){
            const idx=indices[i+j],p=positions[idx],n=normals?.[idx];
            if(!p||p.length!==3)throw Error('GLB invalid vertex reference');
            tri.push({p:transform(world,p),n:n?transform(world,n,0):null});
          }
          const a=tri[0].p,b=tri[1].p,c=tri[2].p;
          const ab=b.map((v,k)=>v-a[k]),ac=c.map((v,k)=>v-a[k]);
          const face=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
          const len=Math.hypot(...face)||1;const n=face.map(v=>v/len);
          verts.push({a,b,c,n,color});
        }
        count+=indices.length/3;out.push(...verts);
      }
    }
    for(const child of node.children||[])traverse(child,world,next);
  };
  const scenes=json.scenes||[];
  const scene=scenes[json.scene||0]||scenes[0];
  if(!scene)throw Error('GLB has no scene');
  for(const nodeId of scene.nodes||[])traverse(nodeId,identity(),new Set());
  if(!out.length)throw Error('No supported GLB mesh triangles');
  const mins=[Infinity,Infinity,Infinity],maxes=[-Infinity,-Infinity,-Infinity];
  for(const tri of out)for(const p of [tri.a,tri.b,tri.c])for(let i=0;i<3;i++){
    if(!Number.isFinite(p[i]))throw Error('Nonfinite GLB vertex');
    mins[i]=Math.min(mins[i],p[i]);maxes[i]=Math.max(maxes[i],p[i]);
  }
  return Object.freeze({triangles:out,bounds:{min:mins,max:maxes},sourceTriangleCount:count});
}
export async function fetchGlb(url,{timeoutMs=4500}={}){
  const signal=AbortSignal.timeout(timeoutMs);
  const res=await fetch(url,{mode:'cors',signal,cache:'force-cache',credentials:'omit'});
  if(!res.ok||Number(res.headers.get('content-length'))>8_000_000)throw Error('GLB fetch denied');
  return parseGlb(await res.arrayBuffer());
}
