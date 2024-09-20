-- CreateTable
CREATE TABLE "StorageAccount" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "storageAccountName" TEXT NOT NULL,
    "resourceGroup" TEXT NOT NULL,

    CONSTRAINT "StorageAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Container" (
    "id" SERIAL NOT NULL,
    "containerName" TEXT NOT NULL,
    "storageAccountId" INTEGER NOT NULL,

    CONSTRAINT "Container_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StorageAccount_userId_storageAccountName_key" ON "StorageAccount"("userId", "storageAccountName");

-- CreateIndex
CREATE UNIQUE INDEX "Container_storageAccountId_containerName_key" ON "Container"("storageAccountId", "containerName");
