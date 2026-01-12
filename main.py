from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import sqlite3
import json
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

DB_FILE = "websearch_sessions.db"

# News sources dictionary
NEWS_SOURCES = {
    "Global Agencies": {
        "Reuters": "https://www.reuters.com/site-search/?query={query}",
        "Associated Press": "https://apnews.com/search?q={query}",
        "AFP": "https://www.afp.com/en/search/site/{query}",
        "Xinhua": "https://search.news.cn/?lang=en&q={query}",
        "Anadolu Agency": "https://www.aa.com.tr/en/search?searchText={query}",
        "TASS": "https://tass.com/search?q={query}",
        "Kyodo News": "https://english.kyodonews.net/search.html?keyword={query}",
        "DPA": "https://www.dpa-international.com/search?q={query}",
        "PTI": "https://www.ptinews.com/search.aspx?query={query}",
    },
    "United States": {
        "CNN": "https://www.cnn.com/search?q={query}",
        "ABC News": "https://abcnews.go.com/search?searchtext={query}",
        "NPR": "https://www.npr.org/search?query={query}",
        "USA Today": "https://www.usatoday.com/search/?q={query}",
        "The New York Times": "https://www.nytimes.com/search?query={query}",
        "The Washington Post": "https://www.washingtonpost.com/newssearch/?query={query}",
        "Los Angeles Times": "https://www.latimes.com/search?q={query}",
        "Chicago Tribune": "https://www.chicagotribune.com/search/?q={query}",
        "The Wall Street Journal": "https://www.wsj.com/search?query={query}",
        "The Atlantic": "https://www.theatlantic.com/search/?q={query}",
        "Vox": "https://www.vox.com/search?q={query}",
        "FiveThirtyEight": "https://fivethirtyeight.com/search/?q={query}",
        "ProPublica": "https://www.propublica.org/search?q={query}",
        "The Hill": "https://thehill.com/search/?q={query}",
        "Axios": "https://www.axios.com/search?q={query}",
        "Newsweek": "https://www.newsweek.com/search/site/{query}",
        "Time": "https://time.com/search/?q={query}",
        "The New Yorker": "https://www.newyorker.com/search/q/{query}",
        "The Intercept": "https://theintercept.com/search/?q={query}",
        "Mother Jones": "https://www.motherjones.com/search/?q={query}",
        "The Daily Beast": "https://www.thedailybeast.com/search?q={query}",
        "Business Insider": "https://www.businessinsider.com/s?q={query}",
        "MarketWatch": "https://www.marketwatch.com/search?q={query}",
        "The Verge": "https://www.theverge.com/search?q={query}",
        "Wired": "https://www.wired.com/search/?q={query}",
        "Politifact": "https://www.politifact.com/search/?q={query}",
        "Snopes": "https://www.snopes.com/search/?q={query}",
    },
    "United Kingdom": {
        "BBC": "https://www.bbc.co.uk/search?q={query}",
        "Sky News": "https://news.sky.com/search?q={query}",
        "ITV News": "https://www.itv.com/news/search?q={query}",
        "The Guardian": "https://www.theguardian.com/search?q={query}",
        "The Times": "https://www.thetimes.co.uk/search?q={query}",
        "The Telegraph": "https://www.telegraph.co.uk/search.html?queryText={query}",
        "The Independent": "https://www.independent.co.uk/search?q={query}",
        "Financial Times": "https://www.ft.com/search?q={query}",
        "The Economist": "https://www.economist.com/search?q={query}",
        "Daily Mail": "https://www.dailymail.co.uk/home/search.html?searchPhrase={query}",
    },
    "Europe": {
        "Der Spiegel": "https://www.spiegel.de/suche/?suchbegriff={query}",
        "Die Welt": "https://www.welt.de/suche/?query={query}",
        "Le Monde": "https://www.lemonde.fr/recherche/?search_keywords={query}",
        "Le Figaro": "https://recherche.lefigaro.fr/recherche/{query}",
        "El País": "https://elpais.com/buscador/?q={query}",
        "La Repubblica": "https://www.repubblica.it/ricerca/?query={query}",
        "Corriere della Sera": "https://www.corriere.it/ricerca/?query={query}",
        "NOS": "https://nos.nl/zoeken?q={query}",
        "NRC": "https://www.nrc.nl/zoeken/?q={query}",
        "Politico Europe": "https://www.politico.eu/?s={query}",
    },
    "Canada": {
        "CBC": "https://www.cbc.ca/search?q={query}",
        "CTV News": "https://www.ctvnews.ca/search-results/search-ctv-news-7.137?q={query}",
        "Global News": "https://globalnews.ca/?s={query}",
        "Toronto Star": "https://www.thestar.com/search.html?q={query}",
        "National Post": "https://nationalpost.com/search/?q={query}",
    },
    "Australia": {
        "ABC News Australia": "https://www.abc.net.au/news/search/?q={query}",
        "SBS News": "https://www.sbs.com.au/news/search/{query}",
        "The Sydney Morning Herald": "https://www.smh.com.au/search?text={query}",
        "The Age": "https://www.theage.com.au/search?text={query}",
        "News.com.au": "https://www.news.com.au/search-results?q={query}",
    },
    "India": {
        "The Hindu": "https://www.thehindu.com/search/?q={query}",
        "Times of India": "https://timesofindia.indiatimes.com/topic/{query}",
        "Hindustan Times": "https://www.hindustantimes.com/search?q={query}",
        "NDTV": "https://www.ndtv.com/search?searchtext={query}",
        "India Today": "https://www.indiatoday.in/topic/{query}",
        "The Indian Express": "https://indianexpress.com/?s={query}",
    },
    "Japan": {
        "NHK": "https://www3.nhk.or.jp/nhkworld/en/search/?q={query}",
        "Asahi Shimbun": "https://www.asahi.com/english/search/?q={query}",
        "Yomiuri Shimbun": "https://www.yomiuri.co.jp/search/?q={query}",
        "Nikkei Asia": "https://asia.nikkei.com/search?q={query}",
    },
    "South Korea": {
        "Yonhap News": "https://en.yna.co.kr/search/index?query={query}",
        "The Korea Herald": "http://www.koreaherald.com/search/index.php?query={query}",
        "The Korea Times": "https://www.koreatimes.co.kr/www2/common/search.asp?kwd={query}",
    },
    "China": {
        "China Daily": "https://www.chinadaily.com.cn/search?query={query}",
        "Global Times": "https://www.globaltimes.cn/search?keyword={query}",
        "South China Morning Post": "https://www.scmp.com/search/{query}",
    },
    "Middle East": {
        "Al Jazeera": "https://www.aljazeera.com/Search/?q={query}",
        "Al Arabiya": "https://english.alarabiya.net/tools/search?query={query}",
        "Gulf News": "https://gulfnews.com/search?q={query}",
        "The National (UAE)": "https://www.thenationalnews.com/search?q={query}",
        "Haaretz": "https://www.haaretz.com/search?q={query}",
        "Jerusalem Post": "https://www.jpost.com/search?q={query}",
    },
    "Africa": {
        "AllAfrica": "https://allafrica.com/search/?search_string={query}",
        "Daily Nation": "https://nation.africa/search?q={query}",
        "Mail & Guardian": "https://mg.co.za/search/?q={query}",
        "The Guardian Nigeria": "https://guardian.ng/?s={query}",
    },
    "Latin America": {
        "Folha de S.Paulo": "https://search.folha.uol.com.br/?q={query}",
        "O Globo": "https://oglobo.globo.com/busca/?q={query}",
        "Clarín": "https://www.clarin.com/tema/{query}.html",
        "El Universal (Mexico)": "https://www.eluniversal.com.mx/buscador?search_api_fulltext={query}",
        "La Nación (Argentina)": "https://www.lanacion.com.ar/buscar/?query={query}",
    }
}


# Database initialization
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            data TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


init_db()


# Pydantic models
class SessionData(BaseModel):
    name: str
    rows: list


class SessionImport(BaseModel):
    sessions: list
    overwrite: bool = False


@app.get("/")
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/sources")
async def get_sources():
    return JSONResponse(content=NEWS_SOURCES)


@app.post("/api/sessions/save")
async def save_session(session: SessionData):
    try:
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        payload = json.dumps({"rows": session.rows})
        created_at = datetime.utcnow().isoformat(timespec="seconds")
        cur.execute(
            """
            INSERT INTO sessions (name, data, created_at)
            VALUES (?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET
                data=excluded.data,
                created_at=excluded.created_at
            """,
            (session.name, payload, created_at),
        )
        conn.commit()
        conn.close()
        return {"status": "success", "message": f"Session '{session.name}' saved"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})


@app.get("/api/sessions/list")
async def list_sessions():
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("SELECT name, created_at FROM sessions ORDER BY created_at DESC")
    rows = cur.fetchall()
    conn.close()
    return JSONResponse(content=[{"name": name, "created_at": created_at} for name, created_at in rows])


@app.get("/api/sessions/load/{name}")
async def load_session(name: str):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("SELECT data FROM sessions WHERE name = ?", (name,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return JSONResponse(status_code=404, content={"status": "error", "message": "Session not found"})
    try:
        data = json.loads(row[0])
        return JSONResponse(content=data)
    except json.JSONDecodeError:
        return JSONResponse(status_code=500, content={"status": "error", "message": "Invalid session data"})


@app.get("/api/sessions/export")
async def export_all_sessions():
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("SELECT name, data, created_at FROM sessions ORDER BY created_at DESC")
    rows = cur.fetchall()
    conn.close()
    
    sessions_payload = []
    for name, data, created_at in rows:
        try:
            sess_data = json.loads(data)
            sessions_payload.append({"name": name, "created_at": created_at, "data": sess_data})
        except json.JSONDecodeError:
            continue
    
    return JSONResponse(content={
        "exported_at": datetime.utcnow().isoformat(timespec="seconds"),
        "sessions": sessions_payload
    })


@app.post("/api/sessions/import")
async def import_sessions(import_data: SessionImport):
    try:
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        imported_count = 0
        
        for sess in import_data.sessions:
            name = sess.get("name")
            data = sess.get("data")
            created_at = sess.get("created_at") or datetime.utcnow().isoformat(timespec="seconds")
            
            if not name or data is None:
                continue
            
            payload = json.dumps(data)
            
            if import_data.overwrite:
                cur.execute(
                    """
                    INSERT INTO sessions (name, data, created_at)
                    VALUES (?, ?, ?)
                    ON CONFLICT(name) DO UPDATE SET
                        data=excluded.data,
                        created_at=excluded.created_at
                    """,
                    (name, payload, created_at),
                )
            else:
                cur.execute(
                    "INSERT OR IGNORE INTO sessions (name, data, created_at) VALUES (?, ?, ?)",
                    (name, payload, created_at),
                )
            imported_count += 1
        
        conn.commit()
        conn.close()
        return {"status": "success", "message": f"Imported {imported_count} session(s)"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})


@app.delete("/api/sessions/delete/{name}")
async def delete_session(name: str):
    try:
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute("DELETE FROM sessions WHERE name = ?", (name,))
        conn.commit()
        conn.close()
        return {"status": "success", "message": f"Session '{name}' deleted"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
