-- AlterTable
ALTER TABLE `tournaments` ADD COLUMN `pauseLevel` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `pausedAt` DATETIME(3) NULL,
    ADD COLUMN `pausedTimeRemaining` INTEGER NULL;

-- CreateTable
CREATE TABLE `bonuses` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `chips` INTEGER NOT NULL,
    `price` DOUBLE NOT NULL DEFAULT 0,
    `tournamentId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `player_bonuses` (
    `id` VARCHAR(191) NOT NULL,
    `playerId` VARCHAR(191) NOT NULL,
    `bonusId` VARCHAR(191) NOT NULL,
    `appliedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `player_bonuses_playerId_bonusId_key`(`playerId`, `bonusId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bonuses` ADD CONSTRAINT `bonuses_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `player_bonuses` ADD CONSTRAINT `player_bonuses_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `player_bonuses` ADD CONSTRAINT `player_bonuses_bonusId_fkey` FOREIGN KEY (`bonusId`) REFERENCES `bonuses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
