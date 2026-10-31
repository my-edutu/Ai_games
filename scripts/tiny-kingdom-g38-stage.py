"""Apply Gauntlet 038 only to the pinned verified Tiny Kingdom source."""
from pathlib import Path
import base64
import hashlib
import lzma
import subprocess

ROOT=Path(__file__).resolve().parents[1]
GAME=ROOT/'public/tiny-kingdom/index.html'
BEFORE='42e1dc44ab68c1fafefc31365aca0d1c563b5a4bde52a4df75595063978324d9'
AFTER='1a32bee1f33be8cb5cfd8a848ef9e3bcfea7b1fdc7b2af00d71ed02e7579f3fb'
B64='ee588a23039d14cac41d03fd1eae1f9a3205f0c68aa84b0d93bc435730d7dc62'
PATCH='4fa8df31157c6486161222f95a19d85277b0b0a33e50b4b506946051b143f920'
sha=lambda data:hashlib.sha256(data).hexdigest()
actual=sha(GAME.read_bytes())
if actual==AFTER:
    print('Gauntlet 038 candidate already materialized and verified')
    raise SystemExit(0)
if actual!=BEFORE:
    raise RuntimeError(f'Refusing to change a different Tiny Kingdom source: {actual}')
encoded=b''.join((ROOT/f'scripts/gauntlet38-p0{i}.b64').read_bytes() for i in range(4))
if sha(encoded)!=B64:raise RuntimeError('Compressed patch transport checksum mismatch')
patch=lzma.decompress(base64.b64decode(encoded))
if sha(patch)!=PATCH:raise RuntimeError('Raw patch checksum mismatch')
subprocess.run(['git','apply','--check','-'],input=patch,cwd=ROOT,check=True)
subprocess.run(['git','apply','-'],input=patch,cwd=ROOT,check=True)
if sha(GAME.read_bytes())!=AFTER:
    subprocess.run(['git','apply','-R','-'],input=patch,cwd=ROOT,check=True)
    raise RuntimeError('Candidate source checksum mismatch; patch reverted')
print('Applied source-guarded Gauntlet 038; SHA-256:',AFTER)
