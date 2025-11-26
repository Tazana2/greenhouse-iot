#!/bin/bash
REG="tu_usuario" # Change this to your Docker Hub username or registry
TAG="latest"

services=(mqtt-kafka-gateway sensor-processor storage-writer control-service api-gateway load-generator)

for s in "${services[@]}"; do
    echo "Building $s..."
    docker build -t ${REG}/${s}:${TAG} ./services/$s
    docker push ${REG}/${s}:${TAG}
done

# frontend as nginx image
docker build -t ${REG}/frontend:${TAG} ./services/frontend
docker push ${REG}/frontend:${TAG}
echo "All images built and pushed successfully."