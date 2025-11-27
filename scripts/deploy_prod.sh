#!/bin/bash
set -e

# Check if DOCKER_REGISTRY is set
if [ -z "$DOCKER_REGISTRY" ]; then
    echo "Error: DOCKER_REGISTRY environment variable is not set"
    echo "Please set it with: export DOCKER_REGISTRY=your_dockerhub_username"
    exit 1
fi

echo "Deploying to Kubernetes cluster with registry: $DOCKER_REGISTRY"

# Create namespace
kubectl apply -f k8s/namespace.yaml

# Add Helm repos
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install Kafka with persistent storage
echo "Installing Kafka..."
helm upgrade --install kafka bitnami/kafka \
  --namespace greenhouse \
  -f k8s/kafka-values.yaml \
  --wait

# Deploy Mosquitto
echo "Deploying Mosquitto MQTT broker..."
kubectl apply -f k8s/mosquitto-deployment.yaml

# Deploy PostgreSQL
echo "Deploying PostgreSQL..."
kubectl apply -f k8s/postgres/postgres-pvc.yaml
kubectl apply -f k8s/postgres/postgres-deployment.yaml

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n greenhouse --timeout=300s

# Deploy application services with envsubst to replace DOCKER_REGISTRY
echo "Deploying application services..."
envsubst < k8s/services-deployments.yaml | kubectl apply -f -

# Apply HPA
echo "Applying Horizontal Pod Autoscalers..."
kubectl apply -f k8s/hpa.yaml

echo "Deployment completed!"
echo "To access the frontend, run: kubectl get svc frontend -n greenhouse"