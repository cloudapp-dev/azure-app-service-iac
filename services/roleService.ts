import { DefaultAzureCredential } from "@azure/identity";
import {
  AuthorizationManagementClient,
  RoleAssignmentCreateParameters,
} from "@azure/arm-authorization";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import * as dotenv from "dotenv";

dotenv.config();

// Ensure the Azure subscription ID is set in environment variables
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || "";

/**
 * Assign a specific role to a user in a given scope within the Azure subscription.
 */
export async function assignRoleToUser(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  userObjectId: string,
  roleName: string
): Promise<void> {
  const credential = new DefaultAzureCredential();
  const client = new AuthorizationManagementClient(credential, subscriptionId);

  const scope = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Storage/storageAccounts/${accountName}`;

  // Get Role Definition ID for the specified role name
  const roleDefinitionId = await getRoleDefinitionId(roleName, subscriptionId);

  if (!roleDefinitionId) {
    throw new Error(`Role definition for "${roleName}" not found.`);
  }

  const roleAssignmentParameters: RoleAssignmentCreateParameters = {
    principalId: userObjectId,
    roleDefinitionId: `/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/${roleDefinitionId}`,
  };

  const roleAssignmentName = uuidv4(); // Generate a new UUID for the role assignment

  try {
    // Create role assignment
    await client.roleAssignments.create(
      scope,
      roleAssignmentName,
      roleAssignmentParameters
    );
    console.log(
      `Role "${roleName}" assigned successfully to user "${userObjectId}" in scope "${scope}".`
    );
  } catch (error) {
    console.error("Error creating role assignment:", error);
    throw error; // Rethrow error to be caught by caller
  }
}

/**
 * Retrieve the Role Definition ID for a given role name within the Azure subscription.
 */
export async function getRoleDefinitionId(
  roleName: string,
  subscriptionId: string
): Promise<string> {
  const credential = new DefaultAzureCredential();
  const token = await credential.getToken(
    "https://management.azure.com/.default"
  );
  const accessToken = token?.token;

  const url = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleDefinitions?api-version=2022-04-01&$filter=roleName eq '${roleName}'`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const roleDefinition = response.data.value.find(
      (role: any) => role.properties.roleName === roleName
    );

    if (!roleDefinition) {
      throw new Error(`Role "${roleName}" not found in the subscription.`);
    }
    return roleDefinition.name;
  } catch (error) {
    console.error("Error retrieving role definition ID:", error);
    throw new Error("Failed to retrieve role definition ID.");
  }
}
