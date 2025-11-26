import os
import json
import time
import threading
import psycopg2
from kafka import KafkaConsumer
from fastapi import FastAPI
from prometheus_client import start_http_server, Counter
from dotenv import load_dotenv

load_dotenv()

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "kafka:9092")
INPUT_TOPIC = os.getenv("INPUT_TOPIC", "sensors.processed")
METRICS_PORT = int(os.getenv("METRICS_PORT", "8003"))

DB_HOST = os.getenv("DB_HOST", "postgres")
DB_PORT = int(os.getenv("DB_PORT", 5432))
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "postgres")
DB_NAME = os.getenv("DB_NAME", "greenhouse")

app = FastAPI()
write_counter = Counter("db_writes_total", "Rows written to DB")

def init_db():
    conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME};")
    cur.close()
    conn.close()
    # connect to DB and create table
    conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS measurements (
        id SERIAL PRIMARY KEY,
        sensor_id TEXT,
        payload JSONB,
        server_ts BIGINT
    );
    """)
    conn.commit()
    cur.close()
    conn.close()

def consume_loop():
    # connect to DB per thread
    conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME)
    cur = conn.cursor()
    consumer = KafkaConsumer(INPUT_TOPIC,
                            bootstrap_servers=KAFKA_BOOTSTRAP.split(","),
                            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                            auto_offset_reset='earliest',
                            enable_auto_commit=True,
                            group_id="storage-group")
    for msg in consumer:
        val = msg.value
        cur.execute("INSERT INTO measurements (sensor_id, payload, server_ts) VALUES (%s, %s, %s)",
                    (val.get("sensor"), json.dumps(val.get("values")), val.get("server_ts")))
        conn.commit()
        write_counter.inc()

@app.on_event("startup")
def startup():
    try:
        init_db()
    except Exception as e:
        print("init db failed (maybe DB not ready):", e)
    threading.Thread(target=consume_loop, daemon=True).start()
    start_http_server(METRICS_PORT)

@app.get("/health")
async def health():
    return {"status": "ok"}