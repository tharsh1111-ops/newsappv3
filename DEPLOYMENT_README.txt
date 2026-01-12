NewsAppV3 - Deployment Instructions
=====================================

BUILDING THE EXECUTABLE:
------------------------
1. Run "build_exe.bat" in this folder
2. Wait for the build to complete (may take 1-2 minutes)
3. Find the executable in: dist\NewsAppV3\

DEPLOYING TO NEW PC:
--------------------
1. Copy the entire "dist\NewsAppV3" folder to the target PC
2. Double-click "NewsAppV3.exe" to start the application
3. The browser will automatically open to http://127.0.0.1:8000
4. To stop: Close the console window or press CTRL+C

REQUIREMENTS ON TARGET PC:
--------------------------
- Windows 10/11 (64-bit)
- NO Python installation needed
- NO pip packages needed
- Everything is bundled in the executable

WHAT'S INCLUDED:
----------------
- NewsAppV3.exe (main executable)
- All Python dependencies bundled
- Templates folder (HTML files)
- Static folder (CSS, JS files)
- Database will be created automatically on first run

FILE PERSISTENCE:
-----------------
- Sessions are saved in: websearch_sessions.db
- Custom news sources in: news_sources.json
- Both files are created in the same folder as the executable

TROUBLESHOOTING:
----------------
- If port 8000 is in use, close other applications using that port
- Antivirus may flag the .exe initially (false positive) - add to exceptions
- Database files will be created on first run
- Check console window for any error messages

FEATURES:
---------
- 100+ news sources across 14 regions
- Multi-tab browser opening
- Session save/load functionality
- Custom news source management
- Export/Import sessions
- Dynamic row management

For source code and updates:
https://github.com/tharsh1111-ops/newsappv3
