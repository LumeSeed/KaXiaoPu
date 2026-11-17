#!/usr/bin/env python3
"""Install or restore kaxiaopu source integration; never touches a live service."""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile

KIT = Path(__file__).resolve().parent

def digest(data, binary=False):
    return hashlib.sha256(data if binary else data.replace(b'\r\n', b'\n')).hexdigest()

def safe_path(root, relative):
    path = root / relative
    if Path(relative).is_absolute() or '..' in Path(relative).parts:
        raise ValueError('Invalid relative path: ' + relative)
    if not path.resolve().is_relative_to(root) or path.resolve() != path.absolute():
        raise ValueError('Symlink or escaped path: ' + relative)
    return path

def atomic_write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    mode = path.stat().st_mode if path.exists() else 0o644
    with tempfile.NamedTemporaryFile(dir=path.parent, prefix='.kaxiaopu-', delete=False) as stream:
        temporary = Path(stream.name)
        stream.write(data)
        stream.flush()
        os.fsync(stream.fileno())
    try:
        temporary.chmod(mode)
        os.replace(temporary, path)
    finally:
        if temporary.exists():
            temporary.unlink()

def current_hash(root, entry):
    path = safe_path(root, entry['path'])
    return digest(path.read_bytes(), entry['binary']) if path.is_file() else None

def load_manifest():
    manifest = json.loads((KIT / 'manifest.json').read_text(encoding='utf-8'))
    for entry in manifest['files']:
        data = safe_path((KIT / 'payload').resolve(), entry['path']).read_bytes()
        if digest(data, entry['binary']) != entry['after_sha256']:
            raise ValueError('Package checksum mismatch: ' + entry['path'])
    return manifest

def restore(root, backup):
    backup = backup.resolve(strict=True)
    if not backup.is_relative_to(root / '.kaxiaopu-template-backups'):
        raise ValueError('Backup must be inside this project/.kaxiaopu-template-backups')
    state = json.loads((backup / 'state.json').read_text(encoding='utf-8'))
    if Path(state['project']).resolve() != root:
        raise ValueError('Backup belongs to a different project')
    manifest = load_manifest()
    catalog = {entry['path']: entry for entry in manifest['files']}
    conflicts = []
    for entry in state['files']:
        if entry['path'] not in catalog or entry['after_sha256'] != catalog[entry['path']]['after_sha256']:
            raise ValueError('Backup does not match this package')
        if entry['before_sha256'] is not None:
            data = safe_path(backup, 'original/' + entry['path']).read_bytes()
            if digest(data, entry['binary']) != entry['before_sha256']:
                raise ValueError('Backup checksum mismatch: ' + entry['path'])
        if current_hash(root, entry) not in (entry['after_sha256'], entry['before_sha256']):
            conflicts.append(entry['path'])
    if conflicts:
        raise ValueError('Files edited after installation; restore stopped:\n' + '\n'.join(conflicts))
    for entry in reversed(state['files']):
        path = safe_path(root, entry['path'])
        if current_hash(root, entry) == entry['before_sha256']:
            continue
        if entry['before_sha256'] is None:
            path.unlink()
        else:
            atomic_write(path, safe_path(backup, 'original/' + entry['path']).read_bytes())
    print('Source restored. Rebuild and deploy to change a running website. Backup retained: ' + str(backup))

def run():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['check', 'install', 'restore'])
    parser.add_argument('--project', required=True, help='Dujiao-Next source root containing go.mod')
    parser.add_argument('--backup', help='Exact backup directory printed after installation (restore only)')
    args = parser.parse_args()
    root = Path(args.project).resolve(strict=True)
    if not (root / 'go.mod').is_file() or 'module github.com/dujiao-next' not in (root / 'go.mod').read_text(encoding='utf-8'):
        raise ValueError('Not a Dujiao-Next source root')
    if args.action == 'restore':
        if not args.backup:
            raise ValueError('restore requires --backup')
        restore(root, Path(args.backup))
        return
    manifest = load_manifest()
    for relative, expected in manifest['version_guards'].items():
        path = safe_path(root, relative)
        if not path.is_file() or digest(path.read_bytes()) != expected:
            raise ValueError('Unsupported source version/dependency changes: ' + relative)
    pending, conflicts = [], []
    for entry in manifest['files']:
        value = current_hash(root, entry)
        if value == entry['after_sha256']:
            continue
        if value == entry['before_sha256']:
            pending.append(entry)
        else:
            conflicts.append(entry['path'])
    if conflicts:
        raise ValueError('Custom changes/version conflict; no files written. Merge integration.patch manually:\n' + '\n'.join(conflicts))
    print('Compatible files: %d; to install: %d' % (len(manifest['files']), len(pending)))
    if args.action == 'check' or not pending:
        print('Check passed.' if pending else 'Already installed. No files changed.')
        return
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    backup = safe_path(root, '.kaxiaopu-template-backups/' + stamp)
    backup.mkdir(parents=True, mode=0o700)
    for entry in pending:
        if entry['before_sha256'] is not None:
            target = safe_path(backup, 'original/' + entry['path'])
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(safe_path(root, entry['path']), target)
    (backup / 'state.json').write_text(json.dumps({'project': str(root), 'files': pending}, indent=2), encoding='utf-8')
    changed = []
    try:
        for entry in pending:
            if current_hash(root, entry) != entry['before_sha256']:
                raise ValueError('File changed during installation: ' + entry['path'])
            atomic_write(safe_path(root, entry['path']), safe_path((KIT / 'payload').resolve(), entry['path']).read_bytes())
            changed.append(entry)
    except BaseException:
        for entry in reversed(changed):
            path = safe_path(root, entry['path'])
            if entry['before_sha256'] is None:
                path.unlink()
            else:
                atomic_write(path, safe_path(backup, 'original/' + entry['path']).read_bytes())
        raise
    print('Installed %d files. BACKUP=%s' % (len(changed), backup))
    print('Next: build BOTH frontends and the fullstack backend; see the tutorial.')

if __name__ == '__main__':
    try:
        run()
    except (OSError, ValueError, KeyError) as error:
        print('ERROR: ' + str(error), file=sys.stderr)
        sys.exit(1)
