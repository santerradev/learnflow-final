-- CreateTable
CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `senha` VARCHAR(255) NOT NULL,
    `foto_perfil` VARCHAR(255) NULL,
    `tipo` ENUM('aluno', 'professor', 'administrador') NOT NULL,
    `data_cadastro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Solicitacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `senha_hash` VARCHAR(255) NOT NULL,
    `foto_perfil` VARCHAR(255) NULL,
    `status` ENUM('pendente', 'aprovada', 'rejeitada') NOT NULL DEFAULT 'pendente',
    `data_solicitacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Solicitacao_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Curso` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(255) NOT NULL,
    `materia` VARCHAR(100) NOT NULL,
    `capa_curso` VARCHAR(255) NOT NULL,
    `usuario_id` INTEGER NOT NULL,

    INDEX `Curso_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Inscricao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `curso_id` INTEGER NOT NULL,
    `data_inscricao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Inscricao_curso_id_idx`(`curso_id`),
    UNIQUE INDEX `Inscricao_usuario_id_curso_id_key`(`usuario_id`, `curso_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Aula` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(255) NOT NULL,
    `materia` VARCHAR(100) NOT NULL,
    `descricao` TEXT NOT NULL,
    `capa_aula` VARCHAR(255) NOT NULL,
    `video` VARCHAR(255) NOT NULL,
    `ordem` INTEGER NOT NULL,
    `curso_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NOT NULL,

    INDEX `Aula_curso_id_idx`(`curso_id`),
    INDEX `Aula_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Atividade` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(255) NOT NULL,
    `materia` VARCHAR(100) NOT NULL,
    `conteudo` JSON NOT NULL,
    `ordem` INTEGER NOT NULL,
    `curso_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NOT NULL,

    INDEX `Atividade_curso_id_idx`(`curso_id`),
    INDEX `Atividade_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Progresso` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `inscricao_id` INTEGER NOT NULL,
    `aula_id` INTEGER NULL,
    `atividade_id` INTEGER NULL,
    `pontuacao_obtida` INTEGER NULL,
    `concluida` BOOLEAN NOT NULL DEFAULT true,
    `data_conclusao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Progresso_aula_id_idx`(`aula_id`),
    INDEX `Progresso_atividade_id_idx`(`atividade_id`),
    UNIQUE INDEX `Progresso_inscricao_id_aula_id_key`(`inscricao_id`, `aula_id`),
    UNIQUE INDEX `Progresso_inscricao_id_atividade_id_key`(`inscricao_id`, `atividade_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Curso` ADD CONSTRAINT `Curso_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inscricao` ADD CONSTRAINT `Inscricao_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inscricao` ADD CONSTRAINT `Inscricao_curso_id_fkey` FOREIGN KEY (`curso_id`) REFERENCES `Curso`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Aula` ADD CONSTRAINT `Aula_curso_id_fkey` FOREIGN KEY (`curso_id`) REFERENCES `Curso`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Aula` ADD CONSTRAINT `Aula_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Atividade` ADD CONSTRAINT `Atividade_curso_id_fkey` FOREIGN KEY (`curso_id`) REFERENCES `Curso`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Atividade` ADD CONSTRAINT `Atividade_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Progresso` ADD CONSTRAINT `Progresso_inscricao_id_fkey` FOREIGN KEY (`inscricao_id`) REFERENCES `Inscricao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Progresso` ADD CONSTRAINT `Progresso_aula_id_fkey` FOREIGN KEY (`aula_id`) REFERENCES `Aula`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Progresso` ADD CONSTRAINT `Progresso_atividade_id_fkey` FOREIGN KEY (`atividade_id`) REFERENCES `Atividade`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
