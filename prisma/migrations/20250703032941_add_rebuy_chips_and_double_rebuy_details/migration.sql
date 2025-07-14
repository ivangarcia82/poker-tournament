-- AlterTable
ALTER TABLE `tournaments` ADD COLUMN `doubleRebuyChips` INTEGER NULL,
    ADD COLUMN `doubleRebuyPrice` DOUBLE NULL,
    ADD COLUMN `rebuyChips` INTEGER NULL;
