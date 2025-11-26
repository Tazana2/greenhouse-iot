# Greenhouse IoT Application

Sistema IoT para monitoreo de invernadero con arquitectura de microservicios.

## Arquitectura

- **MQTT Broker (Mosquitto)**: Recibe datos de sensores IoT
- **Kafka**: Bus de mensajería para procesamiento de streams
- **mqtt-kafka-gateway**: Puente MQTT → Kafka
- **sensor-processor**: Procesa y valida datos de sensores
- **storage-writer**: Almacena datos procesados en PostgreSQL
- **control-service**: Genera comandos para actuadores basado en reglas
- **api-gateway**: API REST para consultar datos históricos
- **frontend**: Dashboard web para visualización
- **load-generator**: Generador de carga para pruebas

## Prueba Local con Docker Compose

### Prerrequisitos
- Docker y Docker Compose instalados

### Pasos

1. **Construir y levantar servicios**:
```bash
docker-compose up --build
```

2. **Acceder a los servicios**:
- API Gateway: http://localhost:8080
- Frontend: http://localhost:8081
- PostgreSQL: localhost:5432
- MQTT: localhost:1883
- Kafka: localhost:9092

3. **Ver logs**:
```bash
docker-compose logs -f [servicio]
```

4. **Detener**:
```bash
docker-compose down
```

## Despliegue en Kubernetes

### Prerrequisitos
- kubectl instalado y configurado
- Helm 3+ instalado
- Cluster de Kubernetes (local con kind/minikube o producción)

### Pasos

1. **Actualizar usuario de Docker Hub** en:
   - `scripts/build_images.sh`: Cambiar `REG="tu_usuario"`
   - `k8s/services-deployments.yaml`: Cambiar `tu_usuario` en todas las imágenes

2. **Construir y subir imágenes**:
```bash
chmod +x scripts/build_images.sh
./scripts/build_images.sh
```

3. **Despliegue en cluster local (kind)**:
```bash
chmod +x scripts/deploy_kind.sh
./scripts/deploy_kind.sh
```

4. **Despliegue en producción**:
```bash
chmod +x scripts/deploy_prod.sh
./scripts/deploy_prod.sh
```

5. **Aplicar HPA (Horizontal Pod Autoscaler)**:
```bash
kubectl apply -f k8s/hpa.yaml
```

6. **Verificar despliegue**:
```bash
kubectl get pods -n greenhouse
kubectl get svc -n greenhouse
kubectl get hpa -n greenhouse
```

7. **Acceder al frontend** (si usas LoadBalancer):
```bash
kubectl get svc frontend -n greenhouse
# Usar la IP externa o NodePort asignado
```

## Variables de Entorno

### Docker Compose
Ya configuradas en `docker-compose.yaml`

### Kubernetes
Configuradas en `k8s/services-deployments.yaml`

Variables principales:
- `KAFKA_BOOTSTRAP`: kafka:9092
- `MQTT_BROKER`: mosquitto:1883
- `DB_HOST`: postgres
- `DB_USER`: postgres
- `DB_PASS`: postgres
- `DB_NAME`: greenhouse

## Escalabilidad

El HPA está configurado para escalar automáticamente:
- **sensor-processor**: 1-10 replicas (70% CPU)
- **storage-writer**: 1-10 replicas (70% CPU)
- **api-gateway**: 1-5 replicas (70% CPU)

## Monitoreo

Cada servicio expone métricas Prometheus en diferentes puertos:
- mqtt-kafka-gateway: 8001
- sensor-processor: 8002
- storage-writer: 8003
- control-service: 8004
- api-gateway: 8005

## Estructura de Datos

### Mensaje de Sensor
```json
{
  "sensor_id": "sensor-1",
  "values": {
    "temperature": 25.5,
    "humidity": 45.2
  }
}
```

### Reglas de Control
- Temperatura > 32°C → Encender ventilador
- Temperatura < 25°C → Apagar ventilador
- Humedad < 30% → Encender irrigación
- Humedad > 60% → Apagar irrigación
