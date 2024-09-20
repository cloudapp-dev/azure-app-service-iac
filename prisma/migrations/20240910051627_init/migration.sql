/*
  Warnings:

  - Added the required column `accessKey` to the `StorageAccount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StorageAccount" ADD COLUMN     "accessKey" TEXT NOT NULL;
