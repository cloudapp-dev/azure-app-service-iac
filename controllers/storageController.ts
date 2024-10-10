import { Request, Response } from "express";
import {
  createAzureStorageAccount,
  listResourceGroups,
  deleteResourceGroups,
  listContainersInStorageAccount,
  deleteAzureStorageAccount,
} from "../services/azureService";
import { assignRoleToUser } from "../services/roleService";
import { sendEmail } from "../services/emailService";
import prisma from "../prisma";

// Controller for creating a storage account
export const createStorageAccount = async (req: Request, res: Response) => {
  const {
    resourceGroupName,
    accountName,
    location,
    tags,
    containerName,
    user_az_id,
    user_email,
  } = req.body;

  if (
    !resourceGroupName ||
    !accountName ||
    !location ||
    !containerName ||
    !user_az_id ||
    !user_email
  ) {
    return res
      .status(400)
      .send(
        "resourceGroupName, accountName, location, containerName, user_az_id, and user_email are required."
      );
  }

  try {
    // Create Azure resources
    const { storageAccount, accessKey } = await createAzureStorageAccount(
      resourceGroupName,
      accountName,
      location,
      tags,
      containerName
    );

    // Assign role to user
    await assignRoleToUser(
      process.env.AZURE_SUBSCRIPTION_ID || "",
      resourceGroupName,
      accountName,
      user_az_id,
      "Storage Blob Data Contributor"
    );

    // Save the ResourceGroup to the database
    const savedResourceGroup = await prisma.resourceGroup.create({
      data: {
        name: resourceGroupName,
        userId: user_az_id,
        storageAccounts: {
          create: {
            userId: user_az_id,
            storageAccountName: accountName,
            accessKey: accessKey, // Save the access key
            containers: {
              create: {
                containerName: containerName,
              },
            },
          },
        },
      },
    });

    const operationGetResult = await prisma.operations.findFirst({
      where: {
        resourcegroup: resourceGroupName,
      },
    });

    const creationvalue = "Success";

    const operationResult = await prisma.operations.update({
      where: {
        id: operationGetResult?.id,
      },
      data: {
        creation: creationvalue,
        updatedAt: new Date(),
      },
    });

    console.log(
      `Storage account "${accountName}" for user "${user_az_id}" saved to PostgreSQL successfully.`
    );

    // Send an email to the user
    await sendEmail(
      user_email,
      "Your Azure Storage Account has been created",
      `Hello, your storage account "${accountName}" has been successfully created in the "${resourceGroupName}" resource group.`
    );

    res.status(201).json({
      message:
        "Storage account and resource group created successfully with CORS rules set.",
      storageAccount,
      accessKey,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating resource group or storage account.");
  }
};

// Controller for searching resource groups by tag
export const searchResourceGroups = async (req: Request, res: Response) => {
  const { tagKey, tagValue } = req.body;

  if (!tagKey || !tagValue) {
    return res.status(400).send("tagKey and tagValue are required.");
  }

  try {
    const resourceGroups = await listResourceGroups(tagKey, tagValue);

    if (resourceGroups.length === 0) {
      return res
        .status(200)
        .send(`No resource groups with tag ${tagKey}=${tagValue} found.`);
    }

    res.status(200).json({
      message: `Resource groups with tag ${tagKey}=${tagValue} retrieved successfully.`,
      taggedResourceGroups: resourceGroups,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving resource groups.");
  }
};

// Controller for deleting resource groups by tag
export const deleteResourceGroupsByTag = async (
  req: Request,
  res: Response
) => {
  const { tagKey, tagValue, resourceGroupName, user_email } = req.body;

  if (!tagKey || !tagValue || !user_email) {
    return res
      .status(400)
      .send("tagKey, tagValue and user_email are required.");
  }

  try {
    const message = await deleteResourceGroups(tagKey, tagValue);

    const RgGroupId = await prisma.resourceGroup.findFirst({
      where: {
        name: resourceGroupName,
      },
    });

    // Remove the Storage Account entry from the database
    const deleteRgGroup = await prisma.resourceGroup.delete({
      where: {
        id: RgGroupId?.id,
      },
    });

    const operationGetResult = await prisma.operations.findFirst({
      where: {
        resourcegroup: resourceGroupName,
      },
    });

    const creationvalue = "Success";

    const operationResult = await prisma.operations.update({
      where: {
        id: operationGetResult?.id,
      },
      data: {
        deletion: creationvalue,
        updatedAt: new Date(),
      },
    });

    console.log(
      `Rg Group "${deleteRgGroup.name}" removed from PostgreSQL database successfully.`
    );

    await sendEmail(
      user_email,
      "Your Azure Storage Account has been deleted",
      `Hello, your resource group "${resourceGroupName}" has been successfully deleted`
    );

    res.status(200).send(message);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting resource groups.");
  }
};

// Controller for deleting a specific storage account
export const deleteStorageAccount = async (req: Request, res: Response) => {
  const { resourceGroupName, accountName } = req.body;

  if (!resourceGroupName || !accountName) {
    return res
      .status(400)
      .send("resourceGroupName and accountName are required.");
  }

  try {
    const message = await deleteAzureStorageAccount(
      resourceGroupName,
      accountName
    );
    res.status(200).json({ message });
  } catch (error) {
    console.error("Error deleting storage account:", error);
    res.status(500).send("Error deleting storage account.");
  }

  try {
    const storageAccountId = await prisma.storageAccount.findFirst({
      where: {
        storageAccountName: accountName,
        resourceGroup: resourceGroupName,
      },
    });

    // Delete related Container records first
    await prisma.container.deleteMany({
      where: {
        storageAccountId: storageAccountId?.id, // Use the storageAccount ID to delete related containers
      },
    });
    console.log(
      `All related containers for storage account "${accountName}" deleted from PostgreSQL database successfully.`
    );

    // Remove the Storage Account entry from the database
    const deletedStorageAccount = await prisma.storageAccount.delete({
      where: {
        id: storageAccountId?.id,
        storageAccountName: accountName,
        resourceGroup: resourceGroupName,
      },
    });

    console.log(
      `Storage account "${deletedStorageAccount.storageAccountName}" removed from PostgreSQL database successfully.`
    );
    return `Storage Account "${accountName}" deleted successfully from Azure and database.`;
  } catch (error) {
    console.error(
      `Error deleting storage account "${accountName}" from the database: `,
      error
    );
    throw new Error(
      `Storage Account "${accountName}" deleted from Azure, but failed to delete from the database.`
    );
  }
};

// Controller for getting all containers in a specified storage account
export const getStorageContainers = async (req: Request, res: Response) => {
  const storageAccountName = req.query.storageAccountName as string;
  const storageAccountKey = req.query.storageAccountKey as string;

  if (!storageAccountName) {
    return res
      .status(400)
      .send("Storage account name is required as a query parameter.");
  }

  if (!storageAccountKey) {
    return res
      .status(400)
      .send("Storage account key is required as a query parameter.");
  }

  try {
    const containers = await listContainersInStorageAccount(
      storageAccountName,
      storageAccountKey
    );

    if (containers.length === 0) {
      return res
        .status(200)
        .send("No containers found in the specified storage account.");
    }

    res.status(200).json({
      message: `Containers in storage account "${storageAccountName}" retrieved successfully.`,
      containers,
    });
  } catch (error) {
    console.error("Error retrieving containers:", error);
    res.status(500).send("Error retrieving containers.");
  }
};
