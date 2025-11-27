/*
  Warnings:

  - You are about to drop the column `curso_id` on the `atividade` table. All the data in the column will be lost.
  - You are about to drop the column `curso_id` on the `aula` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `atividade` DROP FOREIGN KEY `Atividade_curso_id_fkey`;

-- DropForeignKey
ALTER TABLE `aula` DROP FOREIGN KEY `Aula_curso_id_fkey`;

-- DropForeignKey
ALTER TABLE `inscricao` DROP FOREIGN KEY `Inscricao_curso_id_fkey`;

-- DropForeignKey
ALTER TABLE `progresso` DROP FOREIGN KEY `Progresso_atividade_id_fkey`;

-- DropForeignKey
ALTER TABLE `progresso` DROP FOREIGN KEY `Progresso_aula_id_fkey`;

-- DropForeignKey
ALTER TABLE `progresso` DROP FOREIGN KEY `Progresso_inscricao_id_fkey`;

-- DropIndex
DROP INDEX `Atividade_curso_id_idx` ON `atividade`;

-- DropIndex
DROP INDEX `Aula_curso_id_idx` ON `aula`;

-- AlterTable
ALTER TABLE `atividade` DROP COLUMN `curso_id`,
    ADD COLUMN `lista_id` INTEGER NULL,
    ADD COLUMN `prazo` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `aula` DROP COLUMN `curso_id`,
    ADD COLUMN `lista_id` INTEGER NULL,
    ADD COLUMN `prazo` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `curso` ADD COLUMN `senha_acesso` VARCHAR(5) NULL;

-- AlterTable
ALTER TABLE `solicitacao` ADD COLUMN `instituicao` ENUM('IFSUL_Gravatai', 'Outro') NOT NULL DEFAULT 'IFSUL_Gravatai';

-- CreateTable
CREATE TABLE `Lista` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(255) NOT NULL,
    `descricao` TEXT NULL,
    `ordem` INTEGER NOT NULL,
    `curso_id` INTEGER NOT NULL,

    INDEX `Lista_curso_id_idx`(`curso_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Material` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(255) NOT NULL,
    `descricao` TEXT NULL,
    `tipo` VARCHAR(50) NOT NULL,
    `arquivo` VARCHAR(255) NOT NULL,
    `ordem` INTEGER NOT NULL,
    `lista_id` INTEGER NULL,
    `data_upload` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Material_lista_id_idx`(`lista_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Publicacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conteudo` TEXT NOT NULL,
    `curso_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NOT NULL,
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `editado` BOOLEAN NOT NULL DEFAULT false,

    INDEX `Publicacao_curso_id_idx`(`curso_id`),
    INDEX `Publicacao_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comentario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conteudo` TEXT NOT NULL,
    `publicacao_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NOT NULL,
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `editado` BOOLEAN NOT NULL DEFAULT false,

    INDEX `Comentario_publicacao_id_idx`(`publicacao_id`),
    INDEX `Comentario_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notificacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` ENUM('nova_aula', 'nova_atividade', 'prazo_proximo', 'prazo_atrasado', 'nova_mensagem', 'novo_curso', 'geral') NOT NULL,
    `titulo` VARCHAR(255) NOT NULL,
    `mensagem` TEXT NOT NULL,
    `link` VARCHAR(255) NULL,
    `lida` BOOLEAN NOT NULL DEFAULT false,
    `usuario_id` INTEGER NOT NULL,
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notificacao_usuario_id_idx`(`usuario_id`),
    INDEX `Notificacao_lida_idx`(`lida`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Atividade_lista_id_idx` ON `Atividade`(`lista_id`);

-- CreateIndex
CREATE INDEX `Aula_lista_id_idx` ON `Aula`(`lista_id`);

-- AddForeignKey
ALTER TABLE `Lista` ADD CONSTRAINT `Lista_curso_id_fkey` FOREIGN KEY (`curso_id`) REFERENCES `Curso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inscricao` ADD CONSTRAINT `Inscricao_curso_id_fkey` FOREIGN KEY (`curso_id`) REFERENCES `Curso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Aula` ADD CONSTRAINT `Aula_lista_id_fkey` FOREIGN KEY (`lista_id`) REFERENCES `Lista`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Atividade` ADD CONSTRAINT `Atividade_lista_id_fkey` FOREIGN KEY (`lista_id`) REFERENCES `Lista`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Material` ADD CONSTRAINT `Material_lista_id_fkey` FOREIGN KEY (`lista_id`) REFERENCES `Lista`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Progresso` ADD CONSTRAINT `Progresso_inscricao_id_fkey` FOREIGN KEY (`inscricao_id`) REFERENCES `Inscricao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Progresso` ADD CONSTRAINT `Progresso_aula_id_fkey` FOREIGN KEY (`aula_id`) REFERENCES `Aula`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Progresso` ADD CONSTRAINT `Progresso_atividade_id_fkey` FOREIGN KEY (`atividade_id`) REFERENCES `Atividade`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Publicacao` ADD CONSTRAINT `Publicacao_curso_id_fkey` FOREIGN KEY (`curso_id`) REFERENCES `Curso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Publicacao` ADD CONSTRAINT `Publicacao_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comentario` ADD CONSTRAINT `Comentario_publicacao_id_fkey` FOREIGN KEY (`publicacao_id`) REFERENCES `Publicacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comentario` ADD CONSTRAINT `Comentario_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notificacao` ADD CONSTRAINT `Notificacao_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
