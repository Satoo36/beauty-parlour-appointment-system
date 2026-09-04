pipeline {

    agent any

    environment {
        DOCKERHUB_REPO = "jen567/beauty-parlour"

        FRONTEND_IMAGE = "${DOCKERHUB_REPO}-frontend"
        BACKEND_IMAGE  = "${DOCKERHUB_REPO}-backend"

        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    npm ci
                    npm ci --prefix client
                    npm ci --prefix server
                '''
            }
        }

        stage('Frontend Build') {
            steps {
                sh '''
                    npm run build --prefix client
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    docker build \
                      -t ${FRONTEND_IMAGE}:${IMAGE_TAG} \
                      -t ${FRONTEND_IMAGE}:latest \
                      ./client

                    docker build \
                      -t ${BACKEND_IMAGE}:${IMAGE_TAG} \
                      -t ${BACKEND_IMAGE}:latest \
                      ./server
                '''
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {
                    sh '''
                        echo "$DOCKER_PASSWORD" | docker login \
                            --username "$DOCKER_USERNAME" \
                            --password-stdin
                    '''
                }
            }
        }

        stage('Push Images') {
            steps {
                sh '''
                    docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                    docker push ${FRONTEND_IMAGE}:latest

                    docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                    docker push ${BACKEND_IMAGE}:latest
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    echo "Stopping old containers..."

                    docker compose down || true

                    echo "Pulling latest Docker images..."

                    docker pull ${FRONTEND_IMAGE}:latest
                    docker pull ${BACKEND_IMAGE}:latest

                    echo "Starting application..."

                    docker compose up -d

                    echo "Removing unused Docker images..."

                    docker image prune -f

                    echo "Running containers:"

                    docker ps
                '''
            }
        }
    }

    post {

        success {
            echo '========================================='
            echo 'DEPLOYMENT SUCCESSFUL!'
            echo '========================================='
        }

        failure {
            echo '========================================='
            echo 'DEPLOYMENT FAILED!'
            echo '========================================='
        }

        always {
            sh 'docker logout || true'
        }
    }
}
