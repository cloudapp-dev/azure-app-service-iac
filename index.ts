import express from "express";
import * as dotenv from "dotenv";
import storageRoutes from "./routes/storageRoutes";

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Register routes
app.use("/api/storage", storageRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
