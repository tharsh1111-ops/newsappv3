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
import traceback

# Set the base path for PyInstaller
if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
    os.chdir(BASE_DIR)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def open_browser():
    """Wait for server to start then open browser"""
    time.sleep(2)
    webbrowser.open('http://127.0.0.1:8000')

if __name__ == "__main__":
    try:
        # Start browser opener in background thread
        browser_thread = threading.Thread(target=open_browser, daemon=True)
        browser_thread.start()
        
        # Start the server
        print("Starting NewsAppV3 server...")
        print(f"Base directory: {BASE_DIR}")
        print("Server will be available at: http://127.0.0.1:8000")
        print("Press CTRL+C to stop the server")
        print()
        
        uvicorn.run(
            "main:app",
            host="127.0.0.1",
            port=8000,
            log_level="info"
        )
    except Exception as e:
        print("\n" + "="*50)
        print("ERROR OCCURRED:")
        print("="*50)
        print(f"\nError: {str(e)}\n")
        print("Full traceback:")
        traceback.print_exc()
        print("\n" + "="*50)
        input("\nPress Enter to close...")
        sys.exit(1)
