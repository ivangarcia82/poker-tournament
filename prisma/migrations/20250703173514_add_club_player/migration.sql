-- AlterTable
ALTER TABLE `players` ADD COLUMN `clubPlayerId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `ClubPlayer` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ClubPlayer_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `players` ADD CONSTRAINT `players_clubPlayerId_fkey` FOREIGN KEY (`clubPlayerId`) REFERENCES `ClubPlayer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
