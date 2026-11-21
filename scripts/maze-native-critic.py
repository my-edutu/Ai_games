#!/usr/bin/env python3
"""Audit untouched AI Maze Escape Actions PNGs and measure real guardian acting.

Usage: python scripts/maze-native-critic.py genuine-actions-artifact.zip
Requires Pillow. Fails closed on provenance, viewport, real actor bounds and
44px control violations. Descriptive motion metrics are NOT a visual win:
a fresh critic must inspect full-size images against Nintendo Captain Toad.
No browser, private game state, source mutation or SwiftShader probe.
"""
import argparse
import hashlib
import io
import json
import math
import zipfile
from datetime import datetime
from pathlib import Path
from PIL import Image, ImageChops

PHASES = ('notice', 'brace', 'shell-release')
GATE = {'public-gate-before-1280.png': 'beforeImageSha256',
        'public-gate-mid-lift-1280.png': 'midLiftImageSha256',
        'public-gate-after-1280.png': 'afterImageSha256'}


def require(ok, why):
    if not ok:
        raise ValueError(why)


def rect(bound, size):
    w, h = size
    a, b, c, d = (bound[k] for k in ('left', 'right', 'bottom', 'top'))
    require(all(math.isfinite(v) for v in (a, b, c, d)) and a < b and c < d,
            'Invalid projected real-actor silhouette')
    require(all(abs(v) < .95 for v in (a, b, c, d)),
            'Real actor cropped beyond unchanged ±.95 NDC bound')
    return ((a + 1) * w / 2, (1 - d) * h / 2,
            (b + 1) * w / 2, (1 - c) * h / 2)


def compare(a, b, box1, box2):
    w, h = a.size
    p = max(4, round(min(w, h) * .018))
    region = (max(0, int(min(box1[0], box2[0]) - p)),
              max(0, int(min(box1[1], box2[1]) - p)),
              min(w, int(max(box1[2], box2[2]) + p)),
              min(h, int(max(box1[3], box2[3]) + p)))
    delta = ImageChops.difference(a.crop(region).convert('RGB'), b.crop(region).convert('RGB'))
    rgb = delta.tobytes()
    changed = sum(max(rgb[i:i+3]) >= 12 for i in range(0, len(rgb), 3))
    displacement = math.hypot((box1[0] + box1[2] - box2[0] - box2[2]) / 2,
                              (box1[1] + box1[3] - box2[1] - box2[3]) / 2)
    return {'changedPixels': changed, 'sampledPixels': len(rgb) // 3,
            'changedPercent': round(300 * changed / len(rgb), 2),
            'modelCenterDriftPx': round(displacement, 2),
            'caveat': 'Camera and shading are mixed with acting; not an art score'}


def inspect(zip_path):
    with zipfile.ZipFile(zip_path) as archive:
        raw = {name.split('/')[-1]: archive.read(name) for name in archive.namelist()
               if name.endswith(('.json', '.png')) and not name.endswith('/')}
    manifests = {name: json.loads(data) for name, data in raw.items() if name.endswith('.json')}
    expected = {name[:-5] + '.png': d['imageSha256']
                for name, d in manifests.items() if 'imageSha256' in d}
    gates = [d for d in manifests.values() if all(k in d for k in GATE.values())]
    require(len(gates) == 1, 'Exactly one real public gate transition manifest required')
    for name, field in GATE.items():
        if name in expected:
            require(expected[name] == gates[0][field], f'Inconsistent gate SHA: {name}')
        expected[name] = gates[0][field]
    actual = {name for name in raw if name.endswith('.png')}
    require(actual and actual == set(expected), f'Unproven original PNGs: {sorted(actual ^ set(expected))}')
    for name, digest in expected.items():
        require(hashlib.sha256(raw[name]).hexdigest() == digest, f'SHA mismatch: {name}')
    for name, d in manifests.items():
        if 'imageSha256' not in d:
            continue
        require(d.get('capturedAt', '').endswith('Z'), f'No dated UTC capture: {name}')
        datetime.fromisoformat(d['capturedAt'].replace('Z', '+00:00'))
        if d.get('viewport'):
            with Image.open(io.BytesIO(raw[name[:-5]+'.png'])) as im:
                require(im.size == (d['viewport']['width'], d['viewport']['height']),
                        f'Wrong native viewport: {name}')
    stages = []
    for phase in PHASES:
        name = f'guardian-real-beat-{phase}-390.json'
        require(name in manifests, f'No natural {phase} frame')
        d = manifests[name]
        obs = d.get('beforeScreenshot') or {}
        require(d.get('phase') == phase and d.get('viewport') == {'width': 390, 'height': 844},
                f'Not original 390px {phase}')
        require(obs.get('renderer') == 'webgl' and obs.get('stage') == {'width': 390, 'height': 844},
                f'Not full-viewport WebGL: {phase}')
        require(obs.get('guardianModelsFullyInFrame') == 1 and obs.get('explorerModelFullyInFrame') is True,
                f'Physical actor crop: {phase}')
        controls = obs.get('controls') or []
        require(len(controls) == 4 and all(c.get('width', 0) >= 44 and c.get('height', 0) >= 44
                                           for c in controls), f'44px control regression: {phase}')
        require(len(obs.get('guardianPhysicalBounds') or []) == 1,
                f'No authentic guardian outline: {phase}')
        for actor in (obs['guardianPhysicalBounds'][0], obs['explorerPhysicalBounds']):
            rect(actor, (390, 844))
        stages.append((d, obs))
    source = stages[0][0]['sourceSha256']
    identity = tuple(stages[0][0].get(k) for k in ('runToken', 'seed', 'tick'))
    beats = [obs.get('beat') for _, obs in stages]
    require(all(identity) and all(tuple(d.get(k) for k in ('runToken', 'seed', 'tick')) == identity
                                  and d.get('sourceSha256') == source for d, _ in stages),
            'Nonidentical original source/tick/run across three frames')
    require(all(isinstance(x, (int,float)) and 0 <= x <= 1 for x in beats)
            and beats[0] < beats[1] < beats[2], 'No chronological source-driven encounter')
    metric = {}
    for i in (0, 1):
        with Image.open(io.BytesIO(raw[f'guardian-real-beat-{PHASES[i]}-390.png'])) as a, \
             Image.open(io.BytesIO(raw[f'guardian-real-beat-{PHASES[i+1]}-390.png'])) as b:
            for actor, key in (('guardian','guardianPhysicalBounds'),('explorer','explorerPhysicalBounds')):
                x = stages[i][1][key]
                y = stages[i+1][1][key]
                x = x[0] if actor == 'guardian' else x
                y = y[0] if actor == 'guardian' else y
                metric[f'{PHASES[i]}_to_{PHASES[i+1]}_{actor}'] = compare(
                    a, b, rect(x, a.size), rect(y, b.size))
    return {'originalPngsVerified': len(expected), 'sha256': 'PASS',
            'runToken': identity[0], 'publicSeed': identity[1], 'publicTick': identity[2],
            'actualBeats': beats, 'nativeViewport': [390,844],
            'minimumTouchTargetPx': 44, 'physicalActorCropping': 'NONE in three original frames',
            'localNativePixels': metric,
            'qualityVerdict': 'NOT PASSED: these metrics are NOT a Nintendo visual A/B or independent critic',
            'renderingNote': 'Original WebGL PNGs only; no CPU SwiftShader FPS extrapolation'}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('artifact_zip', type=Path)
    ap.add_argument('--out', type=Path)
    args = ap.parse_args()
    try:
        result = inspect(args.artifact_zip)
    except (OSError, ValueError, KeyError, zipfile.BadZipFile, json.JSONDecodeError) as e:
        ap.exit(1, f'ORIGINAL IMAGE AUDIT FAILED: {e}\n')
    output = json.dumps(result, indent=2, sort_keys=True) + '\n'
    if args.out:
        args.out.write_text(output, encoding='utf-8')
    print(output, end='')


if __name__ == '__main__':
    main()
