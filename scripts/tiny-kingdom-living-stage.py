"""Apply inspectable, pinned source deltas; refuse drift and partial application."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
PARTS = ROOT / 'scripts/tiny-kingdom-living'
ALLOWED = {
    'public/tiny-kingdom/index.html',
    'tests/tiny-kingdom/browser-harness.cjs',
    'scripts/serve-tiny-kingdom-stream.cjs',
    'tests/tiny-kingdom/hd-server.test.cjs',
}
def digest(data):
    return hashlib.sha256(data).hexdigest()

def apply():
    manifest = json.loads((PARTS / 'manifest.json').read_text())
    if manifest['schema'] != 1 or {f['path'] for f in manifest['files']} != ALLOWED:
        raise RuntimeError('Unexpected source manifest')
    edits = {path: [] for path in ALLOWED}
    for part in manifest['parts']:
        name = part['file']
        if Path(name).name != name or not name.startswith('edit-'):
            raise RuntimeError('Invalid delta filename')
        raw = (PARTS / name).read_bytes()
        if digest(raw) != part['sha256']:
            raise RuntimeError('Delta checksum mismatch: ' + name)
        for edit in json.loads(raw):
            if edit['path'] not in ALLOWED:
                raise RuntimeError('Unapproved target')
            edits[edit['path']].append(edit)
    prepared = {}
    for spec in manifest['files']:
        path = ROOT / spec['path']
        raw = path.read_bytes()
        if digest(raw) == spec['after']:
            continue
        if digest(raw) != spec['before']:
            raise RuntimeError('Refusing source drift: ' + spec['path'])
        lines = raw.decode('utf-8').splitlines(keepends=True)
        rows = sorted(edits[spec['path']], key=lambda e: e['start'])
        previous = 0
        for row in rows:
            start, end = row['start'], row['end']
            if not isinstance(start, int) or not isinstance(end, int) or not previous <= start <= end <= len(lines):
                raise RuntimeError('Overlapping or out-of-range delta')
            previous = end
        for row in reversed(rows):
            lines[row['start']:row['end']] = [row['text']]
        candidate = ''.join(lines).encode('utf-8')
        if digest(candidate) != spec['after']:
            raise RuntimeError('Candidate does not match tested source: ' + spec['path'])
        prepared[path] = candidate
    # All input and output hashes are verified before any source is written.
    for path, candidate in prepared.items():
        path.write_bytes(candidate)
    print('Verified exact living-district source:', len(prepared), 'files applied')

if __name__ == '__main__':
    apply()
