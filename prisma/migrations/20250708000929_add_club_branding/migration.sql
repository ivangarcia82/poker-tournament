-- CreateTable
CREATE TABLE `Club` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `logoUrl` VARCHAR(191) NULL,
    `colorPrimary` VARCHAR(191) NULL DEFAULT '#2563eb',
    `colorSecondary` VARCHAR(191) NULL DEFAULT '#f3f4f6',
    `colorAccent` VARCHAR(191) NULL DEFAULT '#22c55e',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
