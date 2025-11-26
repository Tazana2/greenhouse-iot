import os
import json
import threading
import time
from kafka import KafkaConsumer, KafkaProducer
from paho.mqtt.client import Client as MQTTClient
from fastapi import FastAPI
from prometheus_client import start_http_server, Counter
from dotenv import load_dotenv

load_dotenv()

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "kafka:9092")
INPUT_TOPIC = os.getenv("INPUT_TOPIC", "sensors.processed")
OUTPUT_TOPIC = os.getenv("OUTPUT_TOPIC", "actuators.commands")
MQTT_BROKER = os.getenv("MQTT_BROKER", "mosquitto:1883")
METRICS_PORT = int(os.getenv("METRICS_PORT", "8004"))

producer = KafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP.split(","), value_serializer=lambda v: json.dumps(v).encode('utf-8'))

command_counter = Counter("commands_sent_total", "Commands produced to actuators")

app = FastAPI()

def find_rule_and_act(record):
    values = record.get("values", {})
    # very simple rules (example)
    temp = None
    hum = None
    if isinstance(values, dict):
        temp = values.get("temp") or values.get("temperature")
        hum = values.get("hum") or values.get("humidity")
    commands = []
    if temp is not None:
        try:
            t = float(temp)
            if t > 32:
                commands.append({"actuator":"fan", "action":"ON"})
            elif t < 25:
                commands.append({"actuator":"fan", "action":"OFF"})
        except: pass
    if hum is not None:
        try:
            h = float(hum)
            if h < 30:
                commands.append({"actuator":"irrigation", "action":"ON"})
            elif h > 60:
                commands.append({"actuator":"irrigation", "action":"OFF"})
        except: pass
    return commands

def consume_loop():
    consumer = KafkaConsumer(INPUT_TOPIC,
                            bootstrap_servers=KAFKA_BOOTSTRAP.split(","),
                            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                            auto_offset_reset='earliest',
                            enable_auto_commit=True,
                            group_id="control-group")
    for msg in consumer:
        rec = msg.value
        commands = find_rule_and_act(rec)
        for cmd in commands:
            envelope = {"sensor": rec.get("sensor"), "cmd": cmd, "ts": int(time.time()*1000)}
            producer.send(OUTPUT_TOPIC, envelope)
            producer.flush()
            command_counter.inc()

def mqtt_publish_loop():
    # subscribe to actuators.status maybe; also republishes commands to MQTT if needed
    mqtt = MQTTClient()
    host, port = MQTT_BROKER.split(":")
    mqtt.connect(host, int(port))
    mqtt.loop_start()
    # Listen to Kafka actuators.commands and forward to MQTT topic actuators/commands
    consumer = KafkaConsumer("actuators.commands",
                            bootstrap_servers=KAFKA_BOOTSTRAP.split(","),
                            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                            auto_offset_reset='earliest',
                            enable_auto_commit=True,
                            group_id="control-mqtt-pub")
    for msg in consumer:
        try:
            mqtt_payload = json.dumps(msg.value)
            mqtt.publish("greenhouse/actuators/commands", mqtt_payload)
        except Exception as e:
            print("mqtt publish error:", e)

@app.on_event("startup")
def startup():
    threading.Thread(target=consume_loop, daemon=True).start()
    threading.Thread(target=mqtt_publish_loop, daemon=True).start()
    start_http_server(METRICS_PORT)

@app.get("/health")
async def health():
    return {"status": "ok"}