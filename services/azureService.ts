import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient } from "@azure/arm-resources";
import { StorageManagementClient } from "@azure/arm-storage";
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import * as dotenv from "dotenv";

dotenv.config();

const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || "";

/**
 * Delete a specified Azure Storage Account.
 */
export const deleteAzureStorageAccount = async (
  resourceGroupName: string,
  accountName: string
) => {
  const credential = new DefaultAzureCredential();

  // Create Storage Management Client
  const storageClient = new StorageManagementClient(credential, subscriptionId);

  console.log(`Deleting Storage Account "${accountName}"...`);

  // Delete the Storage Account
  await storageClient.storageAccounts.delete(resourceGroupName, accountName);

  console.log(`Storage Account "${accountName}" deleted successfully.`);
  return `Storage Account "${accountName}" deleted successfully.`;
};

/**
 * Create an Azure Storage Account with a specified container and set CORS rules.
 */
export const createAzureStorageAccount = async (
  resourceGroupName: string,
  accountName: string,
  location: string,
  tags: Record<string, string>,
  containerName: string
) => {
  const credential = new DefaultAzureCredential();

  // Create Resource Management Client
  const resourceClient = new ResourceManagementClient(
    credential,
    subscriptionId
  );

  // Create Resource Group
  await resourceClient.resourceGroups.createOrUpdate(resourceGroupName, {
    location,
    tags: tags || {},
  });

  console.log(
    `Resource Group "${resourceGroupName}" created or already exists.`
  );

  // Create Storage Management Client
  const storageClient = new StorageManagementClient(credential, subscriptionId);

  // Create the Storage Account
  const storageAccount = await storageClient.storageAccounts.beginCreateAndWait(
    resourceGroupName,
    accountName,
    {
      sku: { name: "Standard_LRS" },
      kind: "StorageV2",
      location,
      tags: tags || {},
    }
  );

  console.log(`Storage Account "${accountName}" created successfully.`);

  // Set CORS rules for the Blob service of the Storage Account
  await storageClient.blobServices.setServiceProperties(
    resourceGroupName,
    accountName,
    {
      cors: {
        corsRules: [
          {
            allowedOrigins: ["*"],
            allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["*"],
            exposedHeaders: ["*"],
            maxAgeInSeconds: 3600,
          },
        ],
      },
    }
  );

  console.log(`CORS rules set for Storage Account "${accountName}".`);

  // Get the storage account keys
  const keys = await storageClient.storageAccounts.listKeys(
    resourceGroupName,
    accountName
  );
  const accessKey = keys.keys ? keys.keys[0].value : null;

  if (!accessKey) {
    throw new Error("Failed to retrieve the storage account access key.");
  }

  // Create Blob Service Client
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    new DefaultAzureCredential()
  );

  // Create the container
  const containerClient = blobServiceClient.getContainerClient(containerName);
  await containerClient.create();
  console.log(
    `Container "${containerName}" created successfully in Storage Account "${accountName}".`
  );

  return { storageAccount, accessKey };
};

/**
 * List all resource groups filtered by a specific tag key and value.
 */
export const listResourceGroups = async (tagKey: string, tagValue: string) => {
  const credential = new DefaultAzureCredential();
  const resourceClient = new ResourceManagementClient(
    credential,
    subscriptionId
  );

  // List all resource groups
  const resourceGroupsIterator = resourceClient.resourceGroups.list();

  // Convert PagedAsyncIterableIterator to an array
  const resourceGroups = [];
  for await (const rg of resourceGroupsIterator) {
    resourceGroups.push(rg);
  }

  // Filter resource groups by the specified tag
  const taggedResourceGroups = resourceGroups.filter(
    (rg) => rg.tags && rg.tags[tagKey] === tagValue
  );

  return taggedResourceGroups;
};

/**
 * Delete all resource groups that match a specific tag key and value.
 */
export const deleteResourceGroups = async (
  tagKey: string,
  tagValue: string
) => {
  const credential = new DefaultAzureCredential();
  const resourceClient = new ResourceManagementClient(
    credential,
    subscriptionId
  );

  // List all resource groups
  const resourceGroupsIterator = resourceClient.resourceGroups.list();

  // Convert PagedAsyncIterableIterator to an array
  const resourceGroups = [];
  for await (const rg of resourceGroupsIterator) {
    resourceGroups.push(rg);
  }

  // Filter resource groups by the specified tag
  const taggedResourceGroups = resourceGroups.filter(
    (rg) => rg.tags && rg.tags[tagKey] === tagValue
  );

  if (taggedResourceGroups.length === 0) {
    return `No resource groups with tag ${tagKey}=${tagValue} found.`;
  }

  // Delete each resource group using Azure SDK
  for (const rg of taggedResourceGroups) {
    if (rg.name) {
      console.log(`Deleting resource group ${rg.name}...`);
      await resourceClient.resourceGroups.beginDeleteAndWait(rg.name);
      console.log(`Resource group ${rg.name} deleted successfully.`);
    }
  }

  return `All resource groups with tag ${tagKey}=${tagValue} have been deleted.`;
};

/**
 * List all containers in a specified storage account using the storage account key.
 */
export const listContainersInStorageAccount = async (
  storageAccountName: string,
  storageAccountKey: string
) => {
  // Create a StorageSharedKeyCredential using the provided storage account key
  const sharedKeyCredential = new StorageSharedKeyCredential(
    storageAccountName,
    storageAccountKey
  );

  // Create BlobServiceClient with the shared key credential
  const blobServiceClient = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net`,
    sharedKeyCredential
  );

  // List all containers in the specified storage account
  const containers = [];
  for await (const container of blobServiceClient.listContainers()) {
    containers.push(container.name); // Push container name to the list
  }

  return containers;
};
