#!/bin/bash

# Docker helper script para Linux/Mac
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables por defecto
IMAGE_NAME="${IMAGE_NAME:-frontendecommerce}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
CONTAINER_NAME="${CONTAINER_NAME:-frontendecommerce}"
DEV_PORT="${DEV_PORT:-5173}"
PROD_PORT="${PROD_PORT:-8080}"
VITE_API_URL="${VITE_API_URL:-http://localhost:3000/api}"

function print_usage() {
    cat << EOF
${BLUE}Docker Helper Script${NC}

Usage: $0 <command> [options]

Commands:
  dev              Start development container con hot reload
  prod             Start production container (build + nginx)
  build            Build production image
  build-dev        Build development image
  stop             Stop running container
  logs             Show container logs
  shell            Open shell in running container
  clean            Remove containers and images
  help             Show this help message

Options:
  --api-url URL    API base URL (default: http://localhost:3000/api)
  --port PORT      Port to expose (default: ${DEV_PORT} for dev, ${PROD_PORT} for prod)
  --image IMAGE    Docker image name (default: ${IMAGE_NAME})
  --container NAME Container name (default: ${CONTAINER_NAME})

Examples:
  $0 dev                           # Start dev container
  $0 dev --api-url http://api.example.com
  $0 prod --port 9000             # Start prod on port 9000
  $0 build                        # Build production image
  $0 logs                         # Show logs from running container

EOF
}

function build_production() {
    echo -e "${BLUE}🐳 Building production Docker image${NC}"
    echo "Image: ${IMAGE_NAME}:${IMAGE_TAG}"
    echo "API URL: ${VITE_API_URL}"
    
    docker build \
        -t "${IMAGE_NAME}:${IMAGE_TAG}" \
        --build-arg VITE_API_URL="${VITE_API_URL}" \
        -f Dockerfile \
        .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Image built successfully${NC}"
        echo -e "${GREEN}Run with: docker run -p ${PROD_PORT}:80 ${IMAGE_NAME}:${IMAGE_TAG}${NC}"
    else
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
}

function build_development() {
    echo -e "${BLUE}🐳 Building development Docker image${NC}"
    echo "Image: ${IMAGE_NAME}:dev"
    echo "API URL: ${VITE_API_URL}"
    
    docker build \
        -t "${IMAGE_NAME}:dev" \
        --build-arg VITE_API_URL="${VITE_API_URL}" \
        -f Dockerfile.dev \
        .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dev image built successfully${NC}"
    else
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
}

function run_development() {
    echo -e "${BLUE}🚀 Starting development container with hot reload${NC}"
    
    # Check if container exists and stop it
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo -e "${YELLOW}⚠️  Container already exists. Stopping...${NC}"
        docker stop "${CONTAINER_NAME}" 2>/dev/null || true
        docker rm "${CONTAINER_NAME}" 2>/dev/null || true
    fi
    
    docker run \
        --name "${CONTAINER_NAME}" \
        -p "${DEV_PORT}:5173" \
        -v "${SCRIPT_DIR}:/app" \
        -v "/app/node_modules" \
        -e "VITE_API_URL=${VITE_API_URL}" \
        -e "NODE_ENV=development" \
        --network ecommerce-network \
        "${IMAGE_NAME}:dev"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dev server running at http://localhost:${DEV_PORT}${NC}"
    fi
}

function run_production() {
    echo -e "${BLUE}🚀 Starting production container${NC}"
    
    # Check if container exists and stop it
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo -e "${YELLOW}⚠️  Container already exists. Stopping...${NC}"
        docker stop "${CONTAINER_NAME}" 2>/dev/null || true
        docker rm "${CONTAINER_NAME}" 2>/dev/null || true
    fi
    
    docker run \
        --name "${CONTAINER_NAME}" \
        -p "${PROD_PORT}:80" \
        -e "VITE_API_URL=${VITE_API_URL}" \
        -d \
        --network ecommerce-network \
        "${IMAGE_NAME}:${IMAGE_TAG}"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Production container running at http://localhost:${PROD_PORT}${NC}"
        echo -e "${GREEN}View logs with: docker logs -f ${CONTAINER_NAME}${NC}"
    fi
}

function stop_container() {
    echo -e "${BLUE}⏹️  Stopping container...${NC}"
    docker stop "${CONTAINER_NAME}" 2>/dev/null || echo -e "${YELLOW}Container not running${NC}"
    docker rm "${CONTAINER_NAME}" 2>/dev/null || echo -e "${YELLOW}Container not found${NC}"
    echo -e "${GREEN}✅ Done${NC}"
}

function show_logs() {
    echo -e "${BLUE}📋 Container logs${NC}"
    docker logs -f "${CONTAINER_NAME}"
}

function open_shell() {
    echo -e "${BLUE}💻 Opening shell in container${NC}"
    docker exec -it "${CONTAINER_NAME}" sh
}

function clean_docker() {
    echo -e "${YELLOW}⚠️  Removing Docker resources...${NC}"
    
    # Stop and remove container
    docker stop "${CONTAINER_NAME}" 2>/dev/null || true
    docker rm "${CONTAINER_NAME}" 2>/dev/null || true
    
    # Remove images
    docker rmi "${IMAGE_NAME}:${IMAGE_TAG}" 2>/dev/null || true
    docker rmi "${IMAGE_NAME}:dev" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Parse arguments
COMMAND="${1:-help}"
shift || true

while [[ $# -gt 0 ]]; do
    case $1 in
        --api-url)
            VITE_API_URL="$2"
            shift 2
            ;;
        --port)
            if [ "$COMMAND" = "dev" ]; then
                DEV_PORT="$2"
            else
                PROD_PORT="$2"
            fi
            shift 2
            ;;
        --image)
            IMAGE_NAME="$2"
            shift 2
            ;;
        --container)
            CONTAINER_NAME="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            print_usage
            exit 1
            ;;
    esac
done

# Execute command
case "$COMMAND" in
    dev)
        build_development
        run_development
        ;;
    prod)
        build_production
        run_production
        ;;
    build)
        build_production
        ;;
    build-dev)
        build_development
        ;;
    stop)
        stop_container
        ;;
    logs)
        show_logs
        ;;
    shell)
        open_shell
        ;;
    clean)
        clean_docker
        ;;
    help|"")
        print_usage
        ;;
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        print_usage
        exit 1
        ;;
esac
