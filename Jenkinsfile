pipeline {
    agent any

    options {
        timestamps()
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
    }

    stages {
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

                    echo "[CI] Effective VITE_API_URL: ${env.EFFECTIVE_VITE_API_URL}"
                    echo "[CI] Effective DOCKER_IMAGE: ${env.EFFECTIVE_DOCKER_IMAGE}"
                    echo "[CI] Effective SMOKE_TEST_PORT: ${env.EFFECTIVE_SMOKE_TEST_PORT}"
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