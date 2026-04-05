# main.py  legacy entry point, kept for backwards compatibility
# Use `airvo start` instead (installed via pip install airvo)
import sys
import subprocess

if __name__ == "__main__":
    print("\n  Warning: main.py is deprecated. Use `airvo start` instead.\n")
    print("  Launching via airvo CLI...\n")
    sys.exit(subprocess.call([sys.executable, "-m", "airvo.cli", "start"] + sys.argv[1:]))
