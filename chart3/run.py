"""
Runner script for Chart3: 3D Bivariate Bar Studio from PostgreSQL.
Runs on Port 8002.
"""

import sys
from pathlib import Path
import uvicorn

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

if __name__ == "__main__":
    print("=" * 65)
    print("🚀 Starting 3D Bivariate Bar Studio (Chart 3)")
    print("🌐 Dashboard URL:    http://127.0.0.1:8002")
    print("📈 Embeddable Chart: http://127.0.0.1:8002/embed")
    print("📊 Plotly Spec API:  http://127.0.0.1:8002/api/chart")
    print("🖼️ Matplotlib Image: http://127.0.0.1:8002/api/chart/image")
    print("📚 Swagger API Docs: http://127.0.0.1:8002/docs")
    print("=" * 65)
    uvicorn.run("chart3.main:app", host="127.0.0.1", port=8002, reload=True)
