import os
import psycopg2
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from prometheus_client import start_http_server
from dotenv import load_dotenv
from contextlib import asynccontextmanager

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "postgres")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "postgres")
DB_NAME = os.getenv("DB_NAME", "greenhouse")
METRICS_PORT = int(os.getenv("METRICS_PORT", "8005"))


def get_conn():
    return psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME)

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_http_server(METRICS_PORT)
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/health")
async def health():
    return {"status":"ok"}

@app.get("/sensors/latest")
async def sensors_latest(limit: int = 200):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT sensor_id, payload, server_ts FROM measurements ORDER BY server_ts DESC LIMIT %s", (limit,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    results = [{"sensor_id": r[0], "values": r[1], "server_ts": r[2]} for r in rows]
    return JSONResponse(content=results)