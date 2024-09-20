import { PrismaClient } from "@prisma/client";

// Declare a global variable for PrismaClient to avoid creating multiple instances
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Initialize PrismaClient only once and store it globally
const prisma = global.prisma || new PrismaClient();

// In development mode, attach the Prisma instance to the global object to reuse it across module reloads
if (process.env.NODE_ENV === "development") {
  global.prisma = prisma;
}

export default prisma;
