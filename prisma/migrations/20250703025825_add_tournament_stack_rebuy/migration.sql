-- AlterTable
ALTER TABLE `tournaments` ADD COLUMN `doubleRebuy` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `initialStack` INTEGER NOT NULL DEFAULT 5000,
    ADD COLUMN `rebuy` DOUBLE NULL;
