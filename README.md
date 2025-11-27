# Greenhouse IoT Application

Sistema IoT para monitoreo de invernadero con arquitectura de microservicios.

## Arquitectura

- **MQTT Broker (Mosquitto)**: Recibe datos de sensores IoT
- **Kafka + Zookeeper**: Bus de mensajería para procesamiento de streams
- **mqtt-kafka-gateway**: Puente MQTT → Kafka
- **sensor-processor**: Procesa y valida datos de sensores
- **storage-writer**: Almacena datos procesados en PostgreSQL
- **control-service**: Genera comandos para actuadores basado en reglas
- **api-gateway**: API REST para consultar datos históricos
- **frontend**: Dashboard React con visualización en tiempo real (Recharts)
- **load-generator**: Generador de carga para pruebas

## Prueba Local con Docker Compose

### Prerrequisitos
- Docker y Docker Compose instalados

### Pasos

1. **Construir y levantar servicios**:
```bash
docker-compose up --build
```

**Nota**: La primera vez puede tardar varios minutos mientras:
- Se descargan las imágenes de Kafka, Zookeeper, Mosquitto y PostgreSQL
- Se construyen las imágenes de los microservicios
- Kafka y Zookeeper se inicializan completamente

2. **Verificar que los servicios están corriendo**:
```bash
docker-compose ps
```

Todos los servicios deberían mostrar estado "Up".

3. **Acceder a los servicios**:
- **Frontend React Dashboard**: http://localhost:8081
  - Dashboard moderno con gráficos en tiempo real
  - Auto-actualización cada 5 segundos
  - Visualización de temperatura y humedad
  - Estadísticas en vivo
- **API Gateway**: http://localhost:8080/sensors/latest?limit=50
- **PostgreSQL**: localhost:5432 (usuario: postgres, password: postgres)
- **MQTT Broker**: localhost:1883
- **Kafka**: localhost:9092

4. **Ver datos en tiempo real**:
   - El `load-generator` automáticamente comienza a enviar datos de sensores simulados
   - Visita http://localhost:8081 y haz clic en "Cargar últimos" para ver los datos

5. **Ver logs de un servicio específico**:
```bash
docker-compose logs -f [servicio]
# Ejemplos:
docker-compose logs -f mqtt-kafka-gateway
docker-compose logs -f sensor-processor
docker-compose logs -f storage-writer
```

6. **Detener todos los servicios**:
```bash
docker-compose down
```

7. **Detener y eliminar volúmenes** (borra la base de datos):
```bash
docker-compose down -v
```

## Desarrollo del Frontend (Opcional)

Si quieres desarrollar el frontend React localmente sin Docker:

```bash
# 1. Ir al directorio del frontend
cd services/frontend

# 2. Instalar dependencias
npm install

# 3. Crear archivo .env para desarrollo
echo "REACT_APP_API_URL=http://localhost:8080" > .env

# 4. Iniciar en modo desarrollo
npm start
```

El frontend estará disponible en http://localhost:3000 con hot-reload.

**Características del Dashboard React:**
- 📊 Gráficos interactivos con Recharts
- 🔄 Auto-actualización cada 5 segundos (configurable)
- 📈 Visualización de temperatura y humedad en tiempo real
- 🎨 Diseño moderno con gradientes y animaciones
- 📱 Responsive design para móviles
- 📉 Gráficos de área y líneas combinados
- 📊 Tarjetas de estadísticas en vivo

### Troubleshooting Docker Compose

Si tienes problemas al iniciar:

1. **Kafka no se conecta a Zookeeper**:
   - Espera 30-60 segundos, Kafka necesita tiempo para conectarse
   - Verifica logs: `docker-compose logs kafka`

2. **Los servicios no pueden conectarse a Kafka**:
   - Asegúrate que Kafka esté completamente iniciado
   - Verifica: `docker-compose logs kafka | grep "started"`

3. **Error de base de datos**:
   - El health check de PostgreSQL asegura que esté listo antes de iniciar servicios dependientes
   - Si falla: `docker-compose restart postgres`

4. **Mosquitto rechaza conexiones**:
   - Verifica que existe el archivo `mosquitto.conf` en la raíz del proyecto
   - Contenido requerido:
     ```
     listener 1883
     allow_anonymous true
     ```

## Variables de Entorno (Docker Compose)

**NO se necesitan archivos `.env` adicionales**. Todas las variables están configuradas en `docker-compose.yaml`:

### Kafka y Zookeeper
- `ZOOKEEPER_CLIENT_PORT`: 2181
- `KAFKA_BROKER_ID`: 1
- `KAFKA_ZOOKEEPER_CONNECT`: zookeeper:2181
- `KAFKA_ADVERTISED_LISTENERS`: PLAINTEXT://kafka:9092
- `KAFKA_AUTO_CREATE_TOPICS_ENABLE`: true

### Base de Datos
- `DB_HOST`: postgres
- `DB_PORT`: 5432
- `DB_USER`: postgres
- `DB_PASS`: postgres
- `DB_NAME`: greenhouse
- `POSTGRES_DB`: postgres (creada automáticamente)

### Messaging
- `MQTT_BROKER`: mosquitto:1883
- `KAFKA_BOOTSTRAP`: kafka:9092
- `INPUT_TOPIC`: sensors.raw / sensors.processed (según el servicio)
- `OUTPUT_TOPIC`: sensors.processed / actuators.commands

### Load Generator
- `MODE`: mqtt
- `SENSORS`: 200 (número de sensores simulados)
- `RATE_PER_SENSOR`: 0.2 (mensajes por segundo por sensor)

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
