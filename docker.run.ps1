#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script para ejecutar un contenedor Docker del frontend
.DESCRIPTION
    Inicia un contenedor en modo producción
.PARAMETER ImageName
    Nombre de la imagen Docker (default: frontendecommerce:latest)
.PARAMETER ContainerName
    Nombre del contenedor (default: frontendecommerce)
.PARAMETER Port
    Puerto en el host (default: 8080)
.PARAMETER ApiUrl
    URL de la API (default: http://localhost:3000/api)
.PARAMETER Detach
    Ejecutar en background (default: $false)
.EXAMPLE
    .\docker.run.ps1
    .\docker.run.ps1 -Port 9000 -ApiUrl "http://api.example.com" -Detach
#>

param(
    [string]$ImageName = "frontendecommerce:latest",
    [string]$ContainerName = "frontendecommerce",
    [int]$Port = 8080,
    [string]$ApiUrl = "http://localhost:3000/api",
    [switch]$Detach = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Docker container: $ContainerName" -ForegroundColor Cyan
Write-Host "Image: $ImageName" -ForegroundColor Yellow
Write-Host "Port: $Port`:80" -ForegroundColor Yellow
Write-Host "API URL: $ApiUrl" -ForegroundColor Yellow

# Check if container is already running
$existingContainer = docker ps -q -f "name=$ContainerName"
if ($existingContainer) {
    Write-Host "⚠️  Container already running: $ContainerName" -ForegroundColor Yellow
    Write-Host "Stopping existing container..." -ForegroundColor Yellow
    docker stop $ContainerName
    docker rm $ContainerName
}

# Run the container
$dockerArgs = @(
    "run"
    "--name=$ContainerName"
    "-p", "$Port`:80"
    "-e", "VITE_API_URL=$ApiUrl"
)

if ($Detach) {
    $dockerArgs += "-d"
}

$dockerArgs += $ImageName

docker @dockerArgs

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Container started successfully" -ForegroundColor Green
    Write-Host "🌐 Access at: http://localhost:$Port" -ForegroundColor Green
    
    if ($Detach) {
        Write-Host "📊 View logs with: docker logs -f $ContainerName" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Failed to start container" -ForegroundColor Red
    exit 1
}
