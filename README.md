# Dev

npx ts-node index.ts

# Common Role Definition IDs include:

Storage Blob Data Contributor: ba92f5b4-2d11-453d-a403-e96b0029c9fe
Storage Blob Data Reader: 2a2b9908-6ea1-4ae2-8e65-a410df84e7d1

You can retrieve all available roles using the AuthorizationManagementClient and the roleDefinitions method.

# Prisma

npm install prisma --save-dev
npm install @prisma/client
npx prisma init

# Setup DATABASE_URL in .env File

DATABASE_URL="postgresql://<username>:<password>@<hostname>:<port>/<database>?schema=public"

# Adapt prisma/schema.prisma file

generator client {
provider = "prisma-client-js"
}

datasource db {
provider = "postgresql"
url = env("DATABASE_URL")
}

model StorageAccount {
id String @id @default(cuid())
resourceGroupName String
accountName String
location String
tags Json
containerName String
userAzureId String
createdAt DateTime @default(now())
}

# Generating Prisma Client

npx prisma generate

# Syncing Schema with DB - This will create a migration file and apply it to your database.

npx prisma migrate dev --name init

migrations/
└─ 20240910050925_init/
└─ migration.sql

# Apply changes in schema.prisma

npx prisma migrate dev --name add-accesskey-to-storageaccount

This will create a new migration file and apply it to your database, updating the StorageAccount table to include the new accessKey field.
