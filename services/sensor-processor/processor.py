import os
import json
import time
import threading
from kafka import KafkaConsumer, KafkaProducer
from fastapi import FastAPI
from prometheus_client import start_http_server, Counter
from dotenv import load_dotenv
from contextlib import asynccontextmanager

load_dotenv()

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "kafka:9092")
INPUT_TOPIC = os.getenv("INPUT_TOPIC", "sensors.raw")
OUTPUT_TOPIC = os.getenv("OUTPUT_TOPIC", "sensors.processed")
METRICS_PORT = int(os.getenv("METRICS_PORT", "8002"))

producer = KafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP.split(","), value_serializer=lambda v: json.dumps(v).encode('utf-8'))

processed_counter = Counter("processed_messages_total", "Processed messages")

def process_record(rec):
    # rec is dict
    payload = rec.get("payload", {})
    # Basic validation and enrich with server ts
    processed = {
        "topic": rec.get("topic"),
        "sensor": payload.get("sensor_id") or payload.get("id") or "unknown",
        "values": payload.get("values") or payload,
        "original_ts": rec.get("ts"),
        "server_ts": int(time.time() * 1000)
    }
    return processed

def consume_loop():
    consumer = KafkaConsumer(INPUT_TOPIC,
                            bootstrap_servers=KAFKA_BOOTSTRAP.split(","),
                            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                            auto_offset_reset='earliest',
                            enable_auto_commit=True,
                            group_id="processor-group")
    for msg in consumer:
        try:
            rec = msg.value
            out = process_record(rec)
            producer.send(OUTPUT_TOPIC, out)
            producer.flush()
            processed_counter.inc()
        except Exception as e:
            print("processing error:", e)

@asynccontextmanager
async def lifespan(app: FastAPI):
    threading.Thread(target=consume_loop, daemon=True).start()
    start_http_server(METRICS_PORT)
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/health")
async def health():
    return {"status": "ok"}