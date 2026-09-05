from pathlib import Path

from scripts.release.validate_release import read_project_version


def test_read_project_version_from_pyproject():
    version = read_project_version(Path("pyproject.toml"))
    assert isinstance(version, str)
    assert version.count(".") == 2
