#!/bin/bash
set -e
kubectl apply -f k8s/namespace.yaml
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm install kafka bitnami/kafka --namespace greenhouse || helm upgrade kafka bitnami/kafka --namespace greenhouse
helm install mosquitto bitnami/mqtt --namespace greenhouse || helm upgrade mosquitto bitnami/mqtt --namespace greenhouse

kubectl apply -f k8s/postgres/postgres-pvc.yaml
kubectl apply -f k8s/postgres/postgres-deployment.yaml
kubectl apply -f k8s/services-deployments.yaml