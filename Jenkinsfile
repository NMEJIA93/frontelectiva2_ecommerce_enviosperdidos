pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    parameters {
        string(
            name: 'VITE_API_URL',
            defaultValue: 'http://localhost:3000/api',
            description: 'API base URL injected into the Vite build'
        )
        string(
            name: 'DOCKER_IMAGE',
            defaultValue: 'frontelectiva2-ecommerce:latest',
            description: 'Docker image tag produced by the pipeline'
        )
        string(
            name: 'SMOKE_TEST_PORT',
            defaultValue: '8080',
            description: 'Local port used for the smoke test container'
        )
        string(
            name: 'DEPLOY_CONTAINER_NAME',
            defaultValue: 'frontend-app',
            description: 'Container name to recreate on each pipeline run'
        )
        string(
            name: 'DEPLOY_PORT',
            defaultValue: '8081',
            description: 'Host port mapped to container port 80 for recreated container'
        )
        booleanParam(
            name: 'TERRAFORM_APPLY',
            defaultValue: false,
            description: 'If true the pipeline will run terraform apply after plan'
        )
    }

    stages {
        stage('Terraform: Cleanup (destroy existing)') {
            steps {
                echo '[CI] Stage: Terraform cleanup - removing previous resources if they exist'
                script {
                    if (isUnix()) {
                        sh 'cd terraform && terraform init -input=false && terraform destroy -auto-approve || true'
                    } else {
                        bat 'cd terraform && terraform init -input=false && terraform destroy -auto-approve || exit /b 0'
                    }
                }
            }
        }

        stage('Resolve CI parameters') {
            steps {
                script {
                    // Some webhook-triggered runs can expose blank parameter env vars.
                    env.EFFECTIVE_VITE_API_URL = (params.VITE_API_URL ?: '').trim()
                    if (!env.EFFECTIVE_VITE_API_URL) {
                        env.EFFECTIVE_VITE_API_URL = 'http://localhost:3000/api'
                    }

                    env.EFFECTIVE_DOCKER_IMAGE = (params.DOCKER_IMAGE ?: '').trim()
                    if (!env.EFFECTIVE_DOCKER_IMAGE) {
                        env.EFFECTIVE_DOCKER_IMAGE = "frontelectiva2-ecommerce:${env.BUILD_NUMBER}"
                    }

                    env.EFFECTIVE_SMOKE_TEST_PORT = (params.SMOKE_TEST_PORT ?: '').trim()
                    if (!env.EFFECTIVE_SMOKE_TEST_PORT) {
                        env.EFFECTIVE_SMOKE_TEST_PORT = '8080'
                    }

                    env.EFFECTIVE_DEPLOY_CONTAINER_NAME = (params.DEPLOY_CONTAINER_NAME ?: '').trim()
                    if (!env.EFFECTIVE_DEPLOY_CONTAINER_NAME) {
                        env.EFFECTIVE_DEPLOY_CONTAINER_NAME = 'frontend-app'
                    }

                    env.EFFECTIVE_DEPLOY_PORT = (params.DEPLOY_PORT ?: '').trim()
                    if (!env.EFFECTIVE_DEPLOY_PORT) {
                        env.EFFECTIVE_DEPLOY_PORT = '8081'
                    }

                    echo "[CI] Effective VITE_API_URL: ${env.EFFECTIVE_VITE_API_URL}"
                    echo "[CI] Effective DOCKER_IMAGE: ${env.EFFECTIVE_DOCKER_IMAGE}"
                    echo "[CI] Effective SMOKE_TEST_PORT: ${env.EFFECTIVE_SMOKE_TEST_PORT}"
                    echo "[CI] Effective DEPLOY_CONTAINER_NAME: ${env.EFFECTIVE_DEPLOY_CONTAINER_NAME}"
                    echo "[CI] Effective DEPLOY_PORT: ${env.EFFECTIVE_DEPLOY_PORT}"
                }
            }
        }

        stage('Install dependencies') {
            steps {
                echo '[CI] Stage: Install dependencies - running npm ci'
                script {
                    if (isUnix()) {
                        sh 'npm ci'
                    } else {
                        bat 'npm ci'
                    }
                }
            }
        }

        stage('Lint') {
            steps {
                echo '[CI] Stage: Lint - running npm run lint'
                script {
                    if (isUnix()) {
                        sh 'npm run lint'
                    } else {
                        bat 'npm run lint'
                    }
                }
            }
        }

        stage('Build app') {
            steps {
                echo '[CI] Stage: Build app - generating Vite production bundle'
                script {
                    if (isUnix()) {
                        sh 'npm run build'
                    } else {
                        bat 'npm run build'
                    }
                }
            }
        }

        stage('Build Docker image') {
            steps {
                echo '[CI] Stage: Build Docker image - creating Nginx production image'
                script {
                    if (isUnix()) {
                        sh 'docker build --build-arg VITE_API_URL="$EFFECTIVE_VITE_API_URL" -t "$EFFECTIVE_DOCKER_IMAGE" .'
                    } else {
                        bat 'docker build --build-arg VITE_API_URL=%EFFECTIVE_VITE_API_URL% -t %EFFECTIVE_DOCKER_IMAGE% .'
                    }
                }
            }
        }

        stage('Terraform: Init & Validate') {
            steps {
                echo '[CI] Stage: Terraform init & validate'
                script {
                    if (isUnix()) {
                        sh 'cd terraform && terraform init -input=false'
                        sh 'cd terraform && terraform validate'
                    } else {
                        bat 'cd terraform && terraform init -input=false'
                        bat 'cd terraform && terraform validate'
                    }
                }
            }
        }

        stage('Terraform: Plan') {
            steps {
                echo '[CI] Stage: Terraform plan'
                script {
                    // split EFFECTIVE_DOCKER_IMAGE into name and tag if provided
                    def img = env.EFFECTIVE_DOCKER_IMAGE
                    def imgName = img
                    def imgTag = 'local'
                    if (img?.contains(':')) {
                        def parts = img.split(':')
                        imgName = parts[0]
                        imgTag = parts[1]
                    }

                    if (isUnix()) {
                        sh "cd terraform && terraform plan -out=tfplan -input=false -var \"vite_api_url=${env.EFFECTIVE_VITE_API_URL}\" -var \"image_name=${imgName}\" -var \"image_tag=${imgTag}\" -var \"host_port=${env.EFFECTIVE_DEPLOY_PORT}\""
                    } else {
                        bat "cd terraform && terraform plan -out=tfplan -input=false -var \"vite_api_url=%EFFECTIVE_VITE_API_URL%\" -var \"image_name=${imgName}\" -var \"image_tag=${imgTag}\" -var \"host_port=%EFFECTIVE_DEPLOY_PORT%\""
                    }
                }
            }
        }

        stage('Terraform: Apply (optional)') {
            when {
                expression { return params.TERRAFORM_APPLY == true }
            }
            steps {
                echo '[CI] Stage: Terraform apply (automatic)'
                script {
                    if (isUnix()) {
                        sh 'cd terraform && terraform apply -input=false -auto-approve tfplan'
                    } else {
                        bat 'cd terraform && terraform apply -input=false -auto-approve tfplan'
                    }
                }
            }
        }

        stage('Deployment mode') {
            steps {
                script {
                    env.USE_TERRAFORM_DEPLOY = params.TERRAFORM_APPLY ? 'true' : 'false'
                    if (env.USE_TERRAFORM_DEPLOY == 'true') {
                        echo '[CI] Deployment mode: Terraform apply is enabled. Manual docker run stage will be skipped.'
                    } else {
                        echo '[CI] Deployment mode: Terraform apply is disabled. Manual docker run stage will deploy container.'
                    }
                }
            }
        }

        stage('Ensure dependencies before deploy') {
            steps {
                echo '[CI] Stage: Ensure dependencies before deploy - validating workspace dependencies'
                script {
                    if (isUnix()) {
                        sh '[ -d node_modules ] || npm ci'
                    } else {
                        bat 'if not exist node_modules (npm ci)'
                    }
                }
            }
        }

        stage('Recreate Docker container') {
            when {
                expression { return env.USE_TERRAFORM_DEPLOY != 'true' }
            }
            steps {
                echo '[CI] Stage: Recreate Docker container - removing old container and starting a new one'
                script {
                    if (isUnix()) {
                        sh 'docker rm -f ${EFFECTIVE_DEPLOY_CONTAINER_NAME} >/dev/null 2>&1 || true'

                        def preferredRunStatus = sh(
                            script: 'docker run -d --restart unless-stopped --name ${EFFECTIVE_DEPLOY_CONTAINER_NAME} -p ${EFFECTIVE_DEPLOY_PORT}:80 ${EFFECTIVE_DOCKER_IMAGE}',
                            returnStatus: true
                        )

                        if (preferredRunStatus != 0) {
                            echo "[CI] Preferred deploy port ${env.EFFECTIVE_DEPLOY_PORT} is busy. Falling back to a dynamic host port."
                            sh 'docker rm -f ${EFFECTIVE_DEPLOY_CONTAINER_NAME} >/dev/null 2>&1 || true'
                            def fallbackRunStatus = sh(
                                script: 'docker run -d --restart unless-stopped --name ${EFFECTIVE_DEPLOY_CONTAINER_NAME} -p 0:80 ${EFFECTIVE_DOCKER_IMAGE}',
                                returnStatus: true
                            )
                            if (fallbackRunStatus != 0) {
                                sh 'docker ps -a --filter "name=${EFFECTIVE_DEPLOY_CONTAINER_NAME}" || true'
                                error('[CI] Could not start deploy container using preferred or dynamic port')
                            }
                        }

                        env.EFFECTIVE_DEPLOYED_PORT = sh(
                            script: "docker port ${env.EFFECTIVE_DEPLOY_CONTAINER_NAME} 80/tcp | awk -F: '{print \\$NF}' | tail -n 1",
                            returnStdout: true
                        ).trim()
                    } else {
                        bat 'powershell -NoProfile -Command "$ids = docker ps --filter \"publish=%EFFECTIVE_DEPLOY_PORT%\" --format \"{{.ID}}\"; if ($ids) { foreach ($id in $ids) { docker rm -f $id | Out-Null } }"'
                        bat 'docker rm -f %EFFECTIVE_DEPLOY_CONTAINER_NAME% >NUL 2>&1'

                        def preferredRunStatus = bat(
                            script: 'docker run -d --restart unless-stopped --name %EFFECTIVE_DEPLOY_CONTAINER_NAME% -p %EFFECTIVE_DEPLOY_PORT%:80 %EFFECTIVE_DOCKER_IMAGE%',
                            returnStatus: true
                        )

                        if (preferredRunStatus != 0) {
                            echo "[CI] Preferred deploy port ${env.EFFECTIVE_DEPLOY_PORT} is busy. Falling back to a dynamic host port."
                            bat 'docker rm -f %EFFECTIVE_DEPLOY_CONTAINER_NAME% >NUL 2>&1'
                            def fallbackRunStatus = bat(
                                script: 'docker run -d --restart unless-stopped --name %EFFECTIVE_DEPLOY_CONTAINER_NAME% -p 0:80 %EFFECTIVE_DOCKER_IMAGE%',
                                returnStatus: true
                            )
                            if (fallbackRunStatus != 0) {
                                bat 'docker ps -a --filter "name=%EFFECTIVE_DEPLOY_CONTAINER_NAME%"'
                                error('[CI] Could not start deploy container using preferred or dynamic port')
                            }
                        }

                        env.EFFECTIVE_DEPLOYED_PORT = bat(
                            script: '@powershell -NoProfile -Command "$m = docker port %EFFECTIVE_DEPLOY_CONTAINER_NAME% 80/tcp | Select-Object -First 1; if (-not $m) { exit 1 }; ($m.Split([char]58)[-1]).Trim()"',
                            returnStdout: true
                        ).trim()
                    }

                    if (!env.EFFECTIVE_DEPLOYED_PORT) {
                        error('[CI] Deploy container started but mapped host port could not be resolved')
                    }
                    echo "[CI] Deploy container '${env.EFFECTIVE_DEPLOY_CONTAINER_NAME}' running on host port ${env.EFFECTIVE_DEPLOYED_PORT}"
                    echo "[CI] Frontend URL (same Jenkins host): http://localhost:${env.EFFECTIVE_DEPLOYED_PORT}"
                }
            }
        }

        stage('Smoke test') {
            steps {
                echo '[CI] Stage: Smoke test - validating the container serves the SPA'
                script {
                    if (isUnix()) {
                        sh '''
                            docker rm -f frontend-smoke >/dev/null 2>&1 || true
                            docker run -d --rm --name frontend-smoke -p 0:80 ${EFFECTIVE_DOCKER_IMAGE}
                            HOST_PORT=$(docker port frontend-smoke 80/tcp | awk -F: '{print $NF}')
                            if [ -z "$HOST_PORT" ]; then
                                echo '[CI] Smoke test failed: could not resolve mapped host port'
                                docker logs frontend-smoke || true
                                exit 1
                            fi
                            echo "[CI] Smoke test host port: ${HOST_PORT}"
                            for i in $(seq 1 30); do
                                if curl -fsS http://localhost:${HOST_PORT}/ >/dev/null; then
                                    echo '[CI] Smoke test passed'
                                    exit 0
                                fi
                                sleep 2
                            done
                            echo '[CI] Smoke test failed. Recent container logs:'
                            docker logs frontend-smoke || true
                            exit 1
                        '''
                    } else {
                        bat '''
                            docker rm -f frontend-smoke >NUL 2>&1
                            docker run -d --rm --name frontend-smoke -p 0:80 %EFFECTIVE_DOCKER_IMAGE%
                            if errorlevel 1 exit /b 1
                            powershell -NoProfile -Command "$mapping = docker port frontend-smoke 80/tcp; if (-not $mapping) { Write-Host '[CI] Smoke test failed: could not resolve mapped host port'; docker logs frontend-smoke; exit 1 }; $hostPort = ($mapping -split ':')[-1].Trim(); Write-Host ('[CI] Smoke test host port: ' + $hostPort); $ok = $false; for ($i = 0; $i -lt 30; $i++) { try { Invoke-WebRequest -UseBasicParsing ('http://localhost:' + $hostPort + '/') | Out-Null; $ok = $true; break } catch { Start-Sleep -Seconds 2 } }; if (-not $ok) { Write-Host '[CI] Smoke test failed. Recent container logs:'; docker logs frontend-smoke; exit 1 }"
                        '''
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                if (isUnix()) {
                    sh 'docker rm -f frontend-smoke >/dev/null 2>&1 || true'
                } else {
                    bat 'docker rm -f frontend-smoke >NUL 2>&1'
                }
            }
        }
    }
}