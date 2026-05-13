#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script para construir la imagen Docker del frontend
.DESCRIPTION
    Compila la imagen Docker en modo producción
.PARAMETER ImageName
    Nombre de la imagen Docker (default: frontendecommerce:latest)
.PARAMETER ImageTag
    Tag de la imagen (default: latest)
.PARAMETER ApiUrl
    URL de la API para inyectar en el build (default: http://localhost:3000/api)
.EXAMPLE
    .\docker.build.ps1
    .\docker.build.ps1 -ApiUrl "http://api.example.com"
#>

param(
    [string]$ImageName = "frontendecommerce",
    [string]$ImageTag = "latest",
    [string]$ApiUrl = "http://localhost:3000/api"
)

$ErrorActionPreference = "Stop"

Write-Host "🐳 Building Docker image: $ImageName`:$ImageTag" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl" -ForegroundColor Yellow

# Build the image
docker build `
    -t "$ImageName`:$ImageTag" `
    --build-arg VITE_API_URL="$ApiUrl" `
    -f Dockerfile `
    .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Image built successfully: $ImageName`:$ImageTag" -ForegroundColor Green
    Write-Host "📦 Run with: docker run -p 8080:80 $ImageName`:$ImageTag" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
