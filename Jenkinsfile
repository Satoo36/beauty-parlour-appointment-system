pipeline {

    agent any

    environment {
        IMAGE_NAME = "beauty-parlour-server"
        CONTAINER_NAME = "beauty-parlour-server"
        HOST_PORT = "5000"
        CONTAINER_PORT = "5000"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('server') {
                    sh 'npm ci'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    docker build \
                    -t ${IMAGE_NAME}:latest \
                    ./server
                '''
            }
        }

        stage('Stop Existing Container') {
            steps {
                sh '''
                    docker stop ${CONTAINER_NAME} || true
                    docker rm ${CONTAINER_NAME} || true
                '''
            }
        }

        stage('Run Docker Container') {
            steps {
                sh '''
                    docker run -d \
                    --name ${CONTAINER_NAME} \
                    -p ${HOST_PORT}:${CONTAINER_PORT} \
                    --env-file server/.env \
                    ${IMAGE_NAME}:latest
                '''
            }
        }

        stage('Check Container') {
            steps {
                sh '''
                    sleep 5
                    docker ps
                    docker logs --tail 50 ${CONTAINER_NAME}
                '''
            }
        }
    }

    post {
        success {
            echo 'Application deployed successfully!'
            echo 'Application running on port 5000'
        }

        failure {
            echo 'Deployment failed!'
            sh 'docker ps -a || true'
        }
    }
}
