-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `status` ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo';
