'use strict';

const fs=require('node:fs');
const path=require('node:path');

const MAX_SNAPSHOT_BYTES=8_000_000;

function assertFilePath(value){
  if(typeof value!=='string'||value.trim().length===0)throw new TypeError('snapshot file path is required');
  const resolved=path.resolve(value);
  if(path.basename(resolved)==='.'||path.basename(resolved)==='..')throw new RangeError('snapshot file path must identify a file');
  return resolved;
}

function safeReason(value){
  const normalized=String(value||'unknown').toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48);
  return normalized||'unknown';
}

function fsyncDirectory(directory){
  let descriptor;
  try{
    descriptor=fs.openSync(directory,fs.constants.O_RDONLY);
    fs.fsyncSync(descriptor);
  }catch(error){
    // Some platforms do not permit directory fsync. File fsync + atomic rename still hold.
    if(error&&['EINVAL','EPERM','EISDIR','ENOTSUP'].includes(error.code))return;
    throw error;
  }finally{
    if(descriptor!==undefined)fs.closeSync(descriptor);
  }
}

function openReadOnlyNoFollow(file){
  const noFollow=typeof fs.constants.O_NOFOLLOW==='number'?fs.constants.O_NOFOLLOW:0;
  return fs.openSync(file,fs.constants.O_RDONLY|noFollow);
}

class TrafficSnapshotFileStore{
  constructor(filePath){
    this.filePath=assertFilePath(filePath);
    this.directory=path.dirname(this.filePath);
    this.tempPath=`${this.filePath}.tmp`;
  }

  exists(){
    try{return fs.lstatSync(this.filePath).isFile()}catch(error){if(error&&error.code==='ENOENT')return false;throw error}
  }

  load(){
    const descriptor=openReadOnlyNoFollow(this.filePath);
    try{
      const stat=fs.fstatSync(descriptor);
      if(!stat.isFile())throw new Error('snapshot path is not a regular file');
      if(stat.size<=0||stat.size>MAX_SNAPSHOT_BYTES)throw new RangeError('snapshot file size is invalid');
      const content=fs.readFileSync(descriptor,'utf8');
      return JSON.parse(content);
    }finally{
      fs.closeSync(descriptor);
    }
  }

  write(envelope){
    const content=JSON.stringify(envelope);
    const size=Buffer.byteLength(content);
    if(size<=0||size>MAX_SNAPSHOT_BYTES)throw new RangeError('snapshot payload exceeds file-store limit');
    fs.mkdirSync(this.directory,{recursive:true,mode:0o700});
    fs.chmodSync(this.directory,0o700);
    let descriptor;
    try{
      descriptor=fs.openSync(this.tempPath,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_TRUNC,0o600);
      fs.writeFileSync(descriptor,content,'utf8');
      fs.fsyncSync(descriptor);
      fs.closeSync(descriptor);
      descriptor=undefined;
      fs.renameSync(this.tempPath,this.filePath);
      fs.chmodSync(this.filePath,0o600);
      fsyncDirectory(this.directory);
      return this.filePath;
    }catch(error){
      if(descriptor!==undefined){try{fs.closeSync(descriptor)}catch{}}
      try{fs.unlinkSync(this.tempPath)}catch(cleanupError){if(cleanupError&&cleanupError.code!=='ENOENT')throw cleanupError}
      throw error;
    }
  }

  quarantine(reason){
    if(!this.exists())return null;
    const stem=`${this.filePath}.quarantine-${Date.now()}-${process.pid}-${safeReason(reason)}`;
    let target=stem,index=0;
    while(fs.existsSync(target))target=`${stem}-${++index}`;
    fs.renameSync(this.filePath,target);
    fs.chmodSync(target,0o600);
    fsyncDirectory(this.directory);
    return target;
  }
}

module.exports={TrafficSnapshotFileStore};
