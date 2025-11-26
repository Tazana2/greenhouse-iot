import os
import time
import json
import random
from threading import Thread
from paho.mqtt.client import Client as MQTTClient
from kafka import KafkaProducer
from dotenv import load_dotenv

load_dotenv()

MODE = os.getenv("MODE", "mqtt")  # mqtt or kafka
MQTT_BROKER = os.getenv("MQTT_BROKER", "mosquitto:1883")
KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "kafka:9092")
MQTT_TOPIC = os.getenv("MQTT_TOPIC", "greenhouse/sensors")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "sensors.raw")

SENSORS = int(os.getenv("SENSORS", "200"))
RATE_PER_SENSOR = float(os.getenv("RATE_PER_SENSOR", "0.2"))  # messages per second per sensor

def mqtt_worker(sensor_id):
    mqtt = MQTTClient()
    host, port = MQTT_BROKER.split(":")
    mqtt.connect(host, int(port))
    mqtt.loop_start()
    while True:
        payload = {"sensor_id": f"sensor-{sensor_id}", "values": {"temperature": round(20 + random.random()*15,2), "humidity": round(30+random.random()*50,2)}}
        mqtt.publish(MQTT_TOPIC, json.dumps(payload))
        time.sleep(1.0 / RATE_PER_SENSOR)

def kafka_worker(sensor_id, producer):
    while True:
        payload = {"topic": f"greenhouse/sensors/{sensor_id}", "payload": {"sensor_id": f"sensor-{sensor_id}", "values": {"temperature": round(20 + random.random()*15,2), "humidity": round(30+random.random()*50,2)}}, "ts": int(time.time()*1000)}
        producer.send(KAFKA_TOPIC, payload)
        producer.flush()
        time.sleep(1.0 / RATE_PER_SENSOR)

def main():
    if MODE == "mqtt":
        threads = []
        for i in range(SENSORS):
            t = Thread(target=mqtt_worker, args=(i,), daemon=True)
            t.start()
            threads.append(t)
        while True:
            time.sleep(10)
    else:
        producer = KafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP.split(","), value_serializer=lambda v: json.dumps(v).encode('utf-8'))
        threads = []
        for i in range(SENSORS):
            t = Thread(target=kafka_worker, args=(i, producer), daemon=True)
            t.start()
        while True:
            time.sleep(10)

if __name__ == "__main__":
    main()