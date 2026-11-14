import hashlib

from app.provenance import manifest_hash


def test_manifest_identity_changes_with_actual_bytes(tmp_path):
    assert manifest_hash(tmp_path) is None
    p = tmp_path / 'MANIFEST.json'
    p.write_bytes(b'{"files":{}}')
    assert manifest_hash(tmp_path) == hashlib.sha256(p.read_bytes()).hexdigest()
    before = manifest_hash(tmp_path)
    p.write_bytes(b'{"files":{"changed":true}}')
    assert manifest_hash(tmp_path) != before
