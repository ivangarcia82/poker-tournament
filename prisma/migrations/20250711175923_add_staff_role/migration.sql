-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('ADMIN', 'ORGANIZER', 'STAFF', 'USER') NOT NULL DEFAULT 'USER';
