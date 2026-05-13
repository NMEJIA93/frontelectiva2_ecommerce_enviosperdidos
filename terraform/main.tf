################################################################################
# Terraform Configuration - Frontend E-commerce (Docker Local)
# 
# Minimal consolidated config for local development using Docker provider.
#
# Version: 1.14.9+ recommended
################################################################################

################################################################################
# Terraform Configuration - Local Docker Only
# Consolidated minimal config for local development using the Docker provider.
################################################################################

terraform {
  required_version = ">= 1.5"
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 4.2"
    }
  }
}

################################################################################
# Provider - Docker (local)
################################################################################
provider "docker" {
  host = var.docker_host
}

################################################################################
# Variables
################################################################################
variable "docker_host" {
  description = "Docker host (npipe for Windows, unix socket for Linux/macOS)"
  type        = string
  default     = "npipe:////./pipe/docker_engine"
}

variable "image_name" {
  description = "Name for the local Docker image"
  type        = string
  default     = "frontendecommerce"
}

variable "image_tag" {
  description = "Tag for the built image"
  type        = string
  default     = "local"
}

variable "dockerfile" {
  description = "Dockerfile to use for build (relative to repo root)"
  type        = string
  default     = "Dockerfile"
}

variable "build_context" {
  description = "Build context path (relative to this module)"
  type        = string
  default     = ".."
}

variable "vite_api_url" {
  description = "API URL injected at build time"
  type        = string
  default     = "http://localhost:3000/api"
}

variable "host_port" {
  description = "Host port to map to container port 80"
  type        = number
  default     = 8080
}

################################################################################
# Resources - Build image and run container locally
################################################################################

resource "docker_image" "app" {
  name = "${var.image_name}:${var.image_tag}"

  build {
    context    = var.build_context
    dockerfile = var.dockerfile
    # Build args removed: Docker provider build block may not support build args.
    # The Dockerfile defines a default ARG VITE_API_URL which will be used.
  }

  keep_locally = true
}

resource "docker_container" "app" {
  name  = "${var.image_name}-local"
  image = "${var.image_name}:${var.image_tag}"

  ports {
    internal = 80
    external = var.host_port
  }

  env = ["VITE_API_URL=${var.vite_api_url}", "NODE_ENV=production"]

  restart = "unless-stopped"
}

################################################################################
# Outputs
################################################################################

output "image_id" {
  value       = docker_image.app.id
  description = "Built image id"
}

output "container_id" {
  value       = docker_container.app.id
  description = "Container id running locally"
}

output "app_url" {
  value       = "http://localhost:${var.host_port}"
  description = "Local URL to access the application"
}
