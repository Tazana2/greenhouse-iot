#!/bin/bash
set -e
NAMESPACE=greenhouse
kubectl apply -f k8s/namespace.yaml
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm install kafka bitnami/kafka --namespace $NAMESPACE || true
helm install mosquitto bitnami/mqtt --namespace $NAMESPACE || true

kubectl apply -f k8s/postgres/postgres-pvc.yaml
kubectl apply -f k8s/postgres/postgres-deployment.yaml
kubectl apply -f k8s/services-deployments.yaml