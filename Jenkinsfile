pipeline {

    agent any

    environment {
        DOCKERHUB_REPO = "YOUR_DOCKERHUB_USERNAME/beauty-parlour"

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
                          -u "$DOCKER_USERNAME" \
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
                sshagent(['ec2-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ubuntu@YOUR_EC2_IP << EOF

                        cd /opt/beauty-parlour

                        docker pull ${FRONTEND_IMAGE}:latest
                        docker pull ${BACKEND_IMAGE}:latest

                        docker compose down

                        docker compose up -d

                        docker image prune -f

                        EOF
                    '''
                }
            }
        }
    }

    post {

        success {
            echo 'Deployment successful!'
        }

        failure {
            echo 'Deployment failed!'
        }

        always {
            sh 'docker logout || true'
        }
    }
}
