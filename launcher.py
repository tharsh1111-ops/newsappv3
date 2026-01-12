"""
Launcher script for NewsAppV3 standalone executable
Opens the browser automatically after starting the server
"""
import uvicorn
import webbrowser
import time
import threading
import sys
import os

# Set the base path for PyInstaller
if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def open_browser():
    """Wait for server to start then open browser"""
    time.sleep(2)
    webbrowser.open('http://127.0.0.1:8000')

if __name__ == "__main__":
    # Start browser opener in background thread
    browser_thread = threading.Thread(target=open_browser, daemon=True)
    browser_thread.start()
    
    # Start the server
    print("Starting NewsAppV3 server...")
    print("Server will be available at: http://127.0.0.1:8000")
    print("Press CTRL+C to stop the server")
    
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        log_level="info"
    )
