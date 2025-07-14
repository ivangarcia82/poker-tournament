-- CreateTable
CREATE TABLE `TournamentSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `tournamentId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL,
    `currentLevel` INTEGER NULL,
    `timeRemaining` INTEGER NULL,
    `isPaused` BOOLEAN NOT NULL DEFAULT false,
    `pausedAt` DATETIME(3) NULL,
    `pausedTimeRemaining` INTEGER NULL,
    `players` JSON NOT NULL,
    `transactions` JSON NULL,
    `payments` JSON NULL,
    `bonuses` JSON NULL,
    `description` VARCHAR(191) NULL,
    `isAutomatic` BOOLEAN NOT NULL DEFAULT true,

    INDEX `TournamentSnapshot_tournamentId_createdAt_idx`(`tournamentId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TournamentSnapshot` ADD CONSTRAINT `TournamentSnapshot_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
