"""
Runner script for Chart2 Dynamic Altair Density Studio.
Runs FastAPI server on port 8001 to avoid conflict with root port 8000.
"""

import uvicorn
import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

if __name__ == "__main__":
    print("=" * 65)
    print("🚀 Starting Dynamic Altair Density Studio (Chart 2)")
    print("🌐 Dashboard URL:    http://127.0.0.1:8001")
    print("📈 Embeddable Chart: http://127.0.0.1:8001/embed")
    print("📊 API Endpoint:     http://127.0.0.1:8001/api/chart")
    print("📚 Swagger API Docs: http://127.0.0.1:8001/docs")
    print("=" * 65)
    uvicorn.run("chart2.main:app", host="127.0.0.1", port=8001, reload=True)
