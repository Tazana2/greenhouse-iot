#!/bin/bash
# Script to setup Kubernetes cluster on AWS EC2 instances

set -e

echo "This script will help you configure your Kubernetes cluster on AWS EC2"
echo "========================================================================"
echo ""

# Check if we have 3 nodes
NODE_COUNT=$(kubectl get nodes --no-headers | wc -l)
if [ "$NODE_COUNT" -lt 3 ]; then
    echo "Warning: Expected 3 nodes, found $NODE_COUNT"
    echo "This setup is designed for 3 EC2 instances"
fi

echo "Installing Metrics Server for HPA..."
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Patch metrics server for EC2
kubectl patch deployment metrics-server -n kube-system --type='json' -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'

echo "Configuring AWS Load Balancer Controller..."
echo "Make sure you have:"
echo "1. IAM policy for AWS Load Balancer Controller"
echo "2. IAM role attached to EC2 instances or EKS nodes"
echo ""
echo "To install AWS Load Balancer Controller, run:"
echo "helm repo add eks https://aws.github.io/eks-charts"
echo "helm install aws-load-balancer-controller eks/aws-load-balancer-controller -n kube-system --set clusterName=<your-cluster-name>"

echo ""
echo "Setup script completed!"
echo "Next steps:"
echo "1. Set DOCKER_REGISTRY environment variable"
echo "2. Build and push images: ./scripts/build_images.sh"
echo "3. Deploy application: ./scripts/deploy_prod.sh"
