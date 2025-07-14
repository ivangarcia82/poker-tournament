-- AlterTable
ALTER TABLE `bonuses` ADD COLUMN `availableInBuyIn` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `availableInRebuy` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `description` VARCHAR(191) NULL;
