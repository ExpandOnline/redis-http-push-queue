# redis-http-push-queue
Listens to a specific redis queue and posts the payload body to the payload endpoint.

### Deploying for the first time on Kubernetes
If you want dynamic configuration, you will need to insert the `ConfigMap` resource with `kubectl`

1. Create a ConfigMap resource from your desired configuration file

    ```bash
    kubectl create configmap redis-http-push-queue-config \
    --from-file=config/staging-parameters.yml \
    --namespace=”my-app-staging”
    ```
2. Mount the config file with in your deployment.yml file
