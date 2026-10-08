// Growable typed geometry with explicit bounds. Rendering-only: no influence on AI.
export class PackedVertices{
  constructor(capacity=32768){
    this.data=new Float32Array(Math.max(27,capacity));
    this.length=0;this.grows=0;
  }
  reserve(n){
    const needed=this.length+n;
    if(needed<=this.data.length)return;
    const expanded=new Float32Array(Math.max(needed,Math.ceil(this.data.length*1.75)));
    expanded.set(this.data.subarray(0,this.length));this.data=expanded;this.grows++;
  }
  triangle(a,b,c,n,color){
    this.reserve(27);
    const dst=this.data;let i=this.length;
    dst[i++]=a[0];dst[i++]=a[1];dst[i++]=a[2];
    dst[i++]=n[0];dst[i++]=n[1];dst[i++]=n[2];
    dst[i++]=color[0];dst[i++]=color[1];dst[i++]=color[2];
    dst[i++]=b[0];dst[i++]=b[1];dst[i++]=b[2];
    dst[i++]=n[0];dst[i++]=n[1];dst[i++]=n[2];
    dst[i++]=color[0];dst[i++]=color[1];dst[i++]=color[2];
    dst[i++]=c[0];dst[i++]=c[1];dst[i++]=c[2];
    dst[i++]=n[0];dst[i++]=n[1];dst[i++]=n[2];
    dst[i++]=color[0];dst[i++]=color[1];dst[i++]=color[2];
    this.length=i;
  }
  view(){return this.data.subarray(0,this.length);}
}
