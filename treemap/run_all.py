#!/usr/bin/env python3
"""
Launcher script to run all 3 charts on their separate ports:
- Port 8000: Treemap
- Port 8050: Sunburst
- Port 8051: Circles
"""

import subprocess
import sys

def main():
    print("==================================================")
    print("  Starting All 3 PostgreSQL Charts on Separate Ports")
    print("==================================================")
    print("  🗺️ Treemap:  http://127.0.0.1:8000")
    print("  ☀️ Sunburst: http://127.0.0.1:8050")
    print("  ⚪ Circles:  http://127.0.0.1:8051")
    print("==================================================")
    
    p1 = subprocess.Popen([sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"])
    p2 = subprocess.Popen([sys.executable, "-m", "uvicorn", "sunburst_app:app", "--host", "127.0.0.1", "--port", "8050", "--reload"])
    p3 = subprocess.Popen([sys.executable, "-m", "uvicorn", "circles_app:app", "--host", "127.0.0.1", "--port", "8051", "--reload"])
    
    try:
        p1.wait()
    except KeyboardInterrupt:
        print("\nShutting down all servers...")
        p1.terminate()
        p2.terminate()
        p3.terminate()

if __name__ == "__main__":
    main()
