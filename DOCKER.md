# Docker - Frontend E-commerce

Guía completa para trabajar con Docker localmente en este proyecto.

## 📋 Prerequisitos

- Docker Desktop instalado y ejecutándose
- Docker Compose v2.0+
- 4GB de RAM disponible mínimo

### Instalar Docker

**Windows:**
```powershell
# Con Chocolatey
choco install docker-desktop

# O descargar desde
https://www.docker.com/products/docker-desktop
```

**macOS:**
```bash
brew install docker
# O descargar Docker Desktop
https://www.docker.com/products/docker-desktop
```

**Linux:**
```bash
sudo apt-get install docker.io docker-compose
sudo usermod -aG docker $USER
```

## 🚀 Inicio Rápido

### Opción 1: Desarrollo con Hot Reload (Recomendado)

```bash
# Clonar variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo con hot reload
docker-compose up

# En otra terminal, ver logs
docker logs -f frontendecommerce-dev
```

Accede a: **http://localhost:5173**

Los cambios en el código se reflejan automáticamente.

### Opción 2: Producción Local

```bash
# Compilar y ejecutar con Nginx
docker-compose -f docker-compose.prod.yml up

# O en background
docker-compose -f docker-compose.prod.yml up -d
```

Accede a: **http://localhost:8080**

## 📁 Archivos Docker

### `Dockerfile` (Producción)
Build multi-stage optimizado:
- **Stage 1**: Node 20 Alpine - construye la aplicación con Vite
- **Stage 2**: Nginx 1.27 Alpine - sirve los assets estáticos

**Variables de build:**
- `VITE_API_URL`: URL de la API (default: http://localhost:3000/api)

### `Dockerfile.dev` (Desarrollo)
Imagen para desarrollo:
- Node 20 Alpine
- Monta el código fuente como volumen
- Ejecuta `npm run dev` para Vite
- Hot reload automático

### `docker-compose.yml` (Desarrollo)
Servicio de desarrollo con:
- Hot reload
- Volúmenes montados
- Health checks
- Variables de entorno

### `docker-compose.prod.yml` (Producción Local)
Simula el ambiente de producción:
- Build optimizado
- Nginx
- Sin volúmenes
- Health checks

### `.dockerignore`
Archivos excluidos del build:
- `node_modules/` - Se instalan en el contenedor
- `dist/` - Generado en el build
- `.git/` - No necesario
- `.env*` - Sensible

## 🎮 Comandos Útiles

### Desarrollo

```bash
# Iniciar con hot reload
docker-compose up

# En background
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Detener
docker-compose down

# Detener y limpiar volúmenes
docker-compose down -v

# Reconstruir imagen
docker-compose build --no-cache
```

### Producción Local

```bash
# Iniciar
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Detener
docker-compose -f docker-compose.prod.yml down
```

### Scripts PowerShell (Windows)

```powershell
# Construir imagen
.\docker.build.ps1
.\docker.build.ps1 -ApiUrl "http://api.example.com" -ImageTag "v1.0.0"

# Ejecutar contenedor
.\docker.run.ps1
.\docker.run.ps1 -Port 9000 -Detach
.\docker.run.ps1 -ApiUrl "http://api.example.com"
```

### Scripts Bash (Linux/macOS)

```bash
# Hacer ejecutable
chmod +x docker.sh

# Desarrollo
./docker.sh dev
./docker.sh dev --api-url http://api.example.com

# Producción
./docker.sh prod
./docker.sh prod --port 9000

# Build
./docker.sh build --api-url http://api.example.com

# Otros
./docker.sh logs
./docker.sh stop
./docker.sh clean
```

## 🔧 Configuración

### Variables de Entorno

Copiar `.env.example` a `.env`:

```bash
# Backend API
VITE_API_URL=http://localhost:3000/api

# Puertos
DEV_PORT=5173
PROD_PORT=8080

# Node environment
NODE_ENV=development
```

### Cambiar API URL

**En desarrollo:**
```bash
VITE_API_URL=http://api.example.com docker-compose up
```

**En producción:**
```bash
docker build --build-arg VITE_API_URL=http://api.example.com -t frontendecommerce:v1 .
docker run -p 8080:80 frontendecommerce:v1
```

## 🐳 Operaciones Comunes

### Ver logs del contenedor

```bash
# Modo desarrollo
docker-compose logs -f frontendecommerce-dev

# Modo producción
docker-compose -f docker-compose.prod.yml logs -f frontendecommerce-prod

# Logs de todo
docker-compose logs -f
```

### Acceder a shell en el contenedor

```bash
# Desarrollo
docker-compose exec frontendecommerce-dev sh

# Producción
docker-compose -f docker-compose.prod.yml exec frontendecommerce-prod sh
```

### Ejecutar npm commands

```bash
# En desarrollo (via docker-compose)
docker-compose exec frontendecommerce-dev npm install react-router-dom

# Manual
docker exec frontendecommerce-dev npm run lint
docker exec frontendecommerce-dev npm run build
```

### Verificar health status

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Limpiar recursos

```bash
# Detener todo
docker-compose down

# Limpiar volúmenes
docker-compose down -v

# Limpiar imágenes no usadas
docker image prune

# Limpiar todo
docker system prune -a
```

## 🚨 Solución de Problemas

### Puerto ya en uso

```bash
# Cambiar puerto en .env
DEV_PORT=5174

# O encontrar proceso usando el puerto
netstat -tulpn | grep 5173

# O usar script con --port
./docker.sh dev --port 5174
```

### Contenedor no inicia

```bash
# Ver logs detallados
docker-compose logs

# Reconstruir sin cache
docker-compose build --no-cache

# Limpiar y reiniciar
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Hot reload no funciona

```bash
# Asegurar que el volumen está montado correctamente
docker-compose ps
docker-compose exec frontendecommerce-dev ls -la /app

# Reiniciar contenedor
docker-compose restart
```

### Errores de permisos en Linux

```bash
# Agregar usuario a grupo docker
sudo usermod -aG docker $USER
newgrp docker

# O usar sudo
sudo docker-compose up
```

### Problemas con node_modules

```bash
# Limpiar volúmenes e reinstalar
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

## 📊 Estructura de Capas

### Dockerfile (Producción)

```
┌─────────────────────────────────┐
│  Stage 1: Builder (Node 20)     │
│  - npm ci                       │
│  - npm run build (Vite)         │
│  - Output: /app/dist            │
└─────────────────────────────────┘
                ↓
┌─────────────────────────────────┐
│  Stage 2: Runtime (Nginx)       │
│  - COPY dist → /usr/share/nginx │
│  - Expose port 80               │
│  - SPA routing: try_files       │
└─────────────────────────────────┘
```

### Tamaño de Imágenes

```
Desarrollo (Dockerfile.dev):    ~1.2GB (node_modules incluido)
Producción (Dockerfile):        ~50-100MB (solo assets)
```

## 🔐 Seguridad

### Best Practices Aplicadas

✅ **Alpine Linux**: Base mínima (reduce vulnerabilidades)
✅ **Multi-stage**: No incluye build tools en imagen final
✅ **npm ci**: Instala versiones exactas (reproducible)
✅ **No root**: Nginx corre como non-root
✅ **.dockerignore**: Excluye archivos sensibles

### No hacer en producción

❌ Usar `npm install` (sin hash file)
❌ Cambiar a root user
❌ Exponer secrets en ARG (usar secrets durante build)
❌ Confiar en latest tags

## 📈 Performance

### Build Time

```
Primer build:     ~2-3 minutos (descarga node image)
Builds posteriores: ~30-60 segundos
Con cache:         ~5 segundos
```

### Tamaño de Transferencia

```
Development:  ~1.2GB (no es para producción)
Production:   ~50-100MB (optimizado)
Compressed:   ~20-30MB
```

## 🔄 Integración con Terraform

Para desplegar en AWS ECS, la imagen se sube a ECR:

```bash
# En próximas iteraciones de Terraform (Iteración 3)
# 1. Push a ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# 2. Tag y push
docker tag frontendecommerce:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/frontendecommerce:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/frontendecommerce:latest

# 3. Terraform usa la imagen de ECR
```

## 📚 Referencias

- [Docker Official Docs](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Best Practices for Python/Node.js](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

## 💡 Tips

1. **Usa `.dockerignore`** para excluir archivos innecesarios
2. **Copia package.json primero** para aprovechar cache de capas
3. **Usa Alpine** para reducir tamaño de imagen
4. **Multi-stage** para producción (excluye build tools)
5. **Health checks** para saber si el contenedor está listo
6. **Volúmenes** para desarrollo (hot reload)
7. **Networks** para comunicación entre contenedores

## 🆘 Support

Si encuentras problemas:

1. Revisa los logs: `docker-compose logs`
2. Verifica el Dockerfile y docker-compose.yml
3. Asegúrate que Docker/Docker Compose están instalados
4. Limpia recursos: `docker system prune -a`

