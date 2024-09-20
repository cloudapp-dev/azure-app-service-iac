# Create a resource group

az group create --name cloudappmessaging --location westeurope

# Create a Service Bus Namespace

az servicebus namespace create --resource-group cloudappmessaging --name cloudappServiceBus --location westeurope --sku Standard

# Create Service Bus Queues

az servicebus queue create --resource-group cloudappmessaging --namespace-name cloudappServiceBus --name create-container-queue --enable-dead-lettering-on-message-expiration true

az servicebus queue create --resource-group cloudappmessaging --namespace-name cloudappServiceBus --name delete-container-queue --enable-dead-lettering-on-message-expiration true

# Storage Account Creation for Azure Function

az storage account create --name cloudappmessagingstorage --resource-group cloudappmessaging --location westeurope --sku Standard_LRS

# Create a Premium Plan

az functionapp plan create --resource-group cloudappmessaging --name CloudappPremiumFunctionPlan --location westeurope --sku EP1 --min-instances 1 --max-instances 5

# Create a Function App using Premium Plan

az functionapp create --resource-group cloudappmessaging --name CloudappFunctionAppPremium --plan CloudappPremiumFunctionPlan --runtime node --runtime-version 18 --functions-version 4 --storage-account cloudappmessagingstorage

# Create a Function with the Consumption Plan

az functionapp create --resource-group cloudappmessaging --consumption-plan-location westeurope --runtime node --runtime-version 18 --functions-version 4 --name CloudappFunctionAppConsum --storage-account cloudappmessagingstorage

# Deployment Function App

func azure functionapp publish CloudappFunctionAppConsum
