import os
import json
import time
import threading
from fastapi import FastAPI
import paho.mqtt.client as mqttClient
from kafka import KafkaProducer
from prometheus_client import start_http_server, Counter
from dotenv import load_dotenv
from contextlib import asynccontextmanager

load_dotenv()

MQTT_BROKER = os.getenv("MQTT_BROKER", "mosquitto:1883")
MQTT_TOPIC = os.getenv("MQTT_TOPIC", "greenhouse/sensors/#")
KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "kafka:9092")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "sensors.raw")
METRICS_PORT = int(os.getenv("METRICS_PORT", "8001"))

producer = KafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP.split(","), value_serializer=lambda v: json.dumps(v).encode('utf-8'))

pub_counter = Counter("gateway_messages_published_total", "Messages published to Kafka")
recv_counter = Counter("gateway_messages_received_total", "Messages received from MQTT")

def on_connect(client, userdata, flags, rc, properties):
    print("MQTT connected rc=", rc)
    client.subscribe(MQTT_TOPIC)

def on_message(client, userdata, msg):
    try:
        payload = msg.payload.decode('utf-8')
        # Attempt parse JSON, else wrap
        try:
            obj = json.loads(payload)
        except:
            obj = {"raw": payload}
        record = {
            "topic": msg.topic,
            "payload": obj,
            "ts": int(time.time() * 1000)
        }
        producer.send(KAFKA_TOPIC, record)
        producer.flush()
        pub_counter.inc()
        recv_counter.inc()
    except Exception as e:
        print("Error on_message:", e)

def mqtt_loop():
    client = mqttClient.Client(mqttClient.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_message = on_message
    host, port = MQTT_BROKER.split(":")
    client.connect(host, int(port))
    client.loop_forever()

@asynccontextmanager
async def lifespan(app: FastAPI):
    threading.Thread(target=mqtt_loop, daemon=True).start()
    start_http_server(METRICS_PORT)
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/health")
async def health():
    return {"status": "ok"}