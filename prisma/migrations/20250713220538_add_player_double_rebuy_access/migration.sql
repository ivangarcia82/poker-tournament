-- DropForeignKey
ALTER TABLE `ClubPlayer` DROP FOREIGN KEY `ClubPlayer_clubId_fkey`;

-- DropForeignKey
ALTER TABLE `PlayerPayment` DROP FOREIGN KEY `PlayerPayment_playerId_fkey`;

-- DropForeignKey
ALTER TABLE `PlayerPayment` DROP FOREIGN KEY `PlayerPayment_tournamentId_fkey`;

-- DropForeignKey
ALTER TABLE `TournamentSnapshot` DROP FOREIGN KEY `TournamentSnapshot_tournamentId_fkey`;

-- DropForeignKey
ALTER TABLE `audit_logs` DROP FOREIGN KEY `audit_logs_userId_fkey`;

-- DropForeignKey
ALTER TABLE `blind_structures` DROP FOREIGN KEY `blind_structures_tournamentId_fkey`;

-- DropForeignKey
ALTER TABLE `bonuses` DROP FOREIGN KEY `bonuses_tournamentId_fkey`;

-- DropForeignKey
ALTER TABLE `player_bonuses` DROP FOREIGN KEY `player_bonuses_bonusId_fkey`;

-- DropForeignKey
ALTER TABLE `player_bonuses` DROP FOREIGN KEY `player_bonuses_playerId_fkey`;

-- DropForeignKey
ALTER TABLE `players` DROP FOREIGN KEY `players_clubPlayerId_fkey`;

-- DropForeignKey
ALTER TABLE `players` DROP FOREIGN KEY `players_tournamentId_fkey`;

-- DropForeignKey
ALTER TABLE `players` DROP FOREIGN KEY `players_userId_fkey`;

-- DropForeignKey
ALTER TABLE `prizes` DROP FOREIGN KEY `prizes_tournamentId_fkey`;

-- DropForeignKey
ALTER TABLE `tournaments` DROP FOREIGN KEY `tournaments_organizerId_fkey`;

-- DropForeignKey
ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_playerId_fkey`;

-- DropForeignKey
ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_tournamentId_fkey`;

-- DropForeignKey
ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_userId_fkey`;

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_clubId_fkey`;

-- DropIndex
DROP INDEX `ClubPlayer_clubId_fkey` ON `ClubPlayer`;

-- DropIndex
DROP INDEX `PlayerPayment_playerId_fkey` ON `PlayerPayment`;

-- DropIndex
DROP INDEX `PlayerPayment_tournamentId_fkey` ON `PlayerPayment`;

-- DropIndex
DROP INDEX `audit_logs_userId_fkey` ON `audit_logs`;

-- DropIndex
DROP INDEX `blind_structures_tournamentId_fkey` ON `blind_structures`;

-- DropIndex
DROP INDEX `bonuses_tournamentId_fkey` ON `bonuses`;

-- DropIndex
DROP INDEX `player_bonuses_bonusId_fkey` ON `player_bonuses`;

-- DropIndex
DROP INDEX `players_clubPlayerId_fkey` ON `players`;

-- DropIndex
DROP INDEX `players_tournamentId_fkey` ON `players`;

-- DropIndex
DROP INDEX `players_userId_fkey` ON `players`;

-- DropIndex
DROP INDEX `prizes_tournamentId_fkey` ON `prizes`;

-- DropIndex
DROP INDEX `tournaments_organizerId_fkey` ON `tournaments`;

-- DropIndex
DROP INDEX `transactions_playerId_fkey` ON `transactions`;

-- DropIndex
DROP INDEX `transactions_tournamentId_fkey` ON `transactions`;

-- DropIndex
DROP INDEX `transactions_userId_fkey` ON `transactions`;

-- DropIndex
DROP INDEX `users_clubId_fkey` ON `users`;
