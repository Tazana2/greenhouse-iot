#!/bin/bash

# Check if DOCKER_REGISTRY is set
if [ -z "$DOCKER_REGISTRY" ]; then
    echo "Error: DOCKER_REGISTRY environment variable is not set"
    echo "Please set it with: export DOCKER_REGISTRY=your_dockerhub_username"
    exit 1
fi

TAG="${TAG:-latest}"

echo "Building and pushing images with registry: $DOCKER_REGISTRY"

services=(mqtt-kafka-gateway sensor-processor storage-writer control-service api-gateway load-generator)

for s in "${services[@]}"; do
    echo "Building $s..."
    docker build -t ${DOCKER_REGISTRY}/${s}:${TAG} ./services/$s
    docker push ${DOCKER_REGISTRY}/${s}:${TAG}
done

# frontend as nginx image
docker build -t ${DOCKER_REGISTRY}/frontend:${TAG} ./services/frontend
docker push ${DOCKER_REGISTRY}/frontend:${TAG}
echo "All images built and pushed successfully."