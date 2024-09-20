import { Router } from "express";
import {
  createStorageAccount,
  searchResourceGroups,
  deleteResourceGroupsByTag,
  getStorageContainers,
  deleteStorageAccount, // Import the deleteStorageAccount controller
} from "../controllers/storageController";

const router = Router();

// Route to create storage account and send email
router.post("/create-storage-account", createStorageAccount);

// Route to search resource groups by tag
router.post("/search-resource-groups", searchResourceGroups);

// Route to delete resource groups by tag
router.delete("/delete-resource-groups-by-tag", deleteResourceGroupsByTag);

// Route to get all containers in a specified storage account
router.get("/get-storage-containers", getStorageContainers);

// Route to delete a specific storage account
router.delete("/delete-storage-account", deleteStorageAccount);

export default router;
