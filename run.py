import uvicorn
import sys

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Starting Dynamic 3D Plotly FastAPI Server")
    print("🌐 Dashboard URL: http://127.0.0.1:8000")
    print("📈 Chart only:    http://127.0.0.1:8000/embed")
    print("📊 API Endpoint: http://127.0.0.1:8000/api/chart")
    print("=" * 60)
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
