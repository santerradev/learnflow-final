-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `instituicao` ENUM('IFSUL_Gravatai', 'Outro') NOT NULL DEFAULT 'IFSUL_Gravatai';
