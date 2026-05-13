# Terraform - Docker Local

Configuración de Terraform para construir y levantar la app frontend en Docker localmente.

## Uso

```bash
cd terraform

# Inicializar Terraform
terraform init

# Ver cambios antes de aplicar
terraform plan -var "vite_api_url=http://localhost:3000/api" -var "image_name=frontendecommerce" -var "image_tag=local" -var "host_port=8081"

# Construir imagen y crear contenedor
terraform apply -auto-approve -var "vite_api_url=http://localhost:3000/api" -var "image_name=frontendecommerce" -var "image_tag=local" -var "host_port=8081"

# Ver outputs
terraform output

# Limpiar todo
terraform destroy -auto-approve
```

## Variables

- `vite_api_url`: URL de la API (default: http://localhost:3000/api)
- `image_name`: Nombre de la imagen Docker (default: frontendecommerce)
- `image_tag`: Tag de la imagen (default: local)
- `host_port`: Puerto en el host (default: 8080)
- `docker_host`: Docker daemon socket (default: npipe para Windows)

## Archivos

- `main.tf`: Configuración principal (provider Docker, imagen, contenedor)
- `terraform.tfvars.example`: Ejemplo de valores
- `.gitignore`: Archivos a ignorar

## URL Local

```
http://localhost:8081
```
