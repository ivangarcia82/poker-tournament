/*
  Warnings:

  - Added the required column `clubId` to the `ClubPlayer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ClubPlayer` ADD COLUMN `clubId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `ClubPlayer` ADD CONSTRAINT `ClubPlayer_clubId_fkey` FOREIGN KEY (`clubId`) REFERENCES `Club`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
