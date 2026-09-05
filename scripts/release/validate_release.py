#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import sys
import tomllib
from pathlib import Path

SEMVER_RE = re.compile(r"^v(\d+)\.(\d+)\.(\d+)$")


def read_project_version(pyproject_path: Path) -> str:
    data = tomllib.loads(pyproject_path.read_text(encoding="utf-8"))
    version = data.get("project", {}).get("version")
    if not isinstance(version, str) or not version.strip():
        raise ValueError("project.version missing from pyproject.toml")
    return version.strip()


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate release tag and pyproject version alignment")
    parser.add_argument("--tag", required=True, help="Release tag, e.g. v0.9.6")
    parser.add_argument("--pyproject", default="pyproject.toml", help="Path to pyproject.toml")
    args = parser.parse_args()

    if not SEMVER_RE.match(args.tag):
        print(f"ERROR: tag '{args.tag}' is not strict semver (vMAJOR.MINOR.PATCH)")
        return 1

    pyproject_version = read_project_version(Path(args.pyproject))
    expected = args.tag[1:]

    if pyproject_version != expected:
        print(
            "ERROR: pyproject version mismatch. "
            f"tag={args.tag}, project.version={pyproject_version}"
        )
        return 1

    print(f"OK: release tag {args.tag} matches pyproject version {pyproject_version}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
