// file: controllers/materialController.js
import prisma from '../config/prisma.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

/**
 * POST /cursos/:cursoId/materiais
 * Cria um novo material
 */
export const criarMaterial = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const usuarioId = req.user.id;
    const { titulo, descricao, lista_id } = req.body;

    // Validações
    if (!titulo || titulo.trim() === '') {
        return res.status(400).json({ error: 'O título do material é obrigatório.' });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'O arquivo é obrigatório.' });
    }

    try {
        // Buscar maior ordem atual
        const ultimoMaterial = await prisma.material.findFirst({
            where: { curso_id: cursoId },
            orderBy: { ordem: 'desc' },
            select: { ordem: true }
        });

        const novaOrdem = (ultimoMaterial?.ordem || 0) + 1;

        // Obter informações do arquivo
        const arquivo = req.file.filename;
        const tipo_arquivo = path.extname(req.file.originalname).slice(1).toLowerCase();
        const tamanho = req.file.size;

        const material = await prisma.material.create({
            data: {
                titulo: titulo.trim(),
                descricao: descricao?.trim() || null,
                arquivo,
                tipo_arquivo,
                tamanho,
                ordem: novaOrdem,
                curso_id: cursoId,
                lista_id: lista_id ? parseInt(lista_id) : null,
                usuario_id: usuarioId
            }
        });

        return res.status(201).json({
            message: 'Material criado com sucesso!',
            material
        });

    } catch (error) {
        console.error('Erro ao criar material:', error);
        return res.status(500).json({ error: 'Erro ao criar material.' });
    }
};

/**
 * GET /cursos/:cursoId/materiais/:materialId/dados
 * Retorna dados de um material específico
 */
export const obterMaterial = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const materialId = parseInt(req.params.materialId);

    try {
        const material = await prisma.material.findFirst({
            where: { id: materialId, curso_id: cursoId },
            include: {
                lista: true,
                professor: {
                    select: { id: true, nome: true, foto_perfil: true }
                }
            }
        });

        if (!material) {
            return res.status(404).json({ error: 'Material não encontrado.' });
        }

        return res.json(material);

    } catch (error) {
        console.error('Erro ao buscar material:', error);
        return res.status(500).json({ error: 'Erro ao buscar material.' });
    }
};

/**
 * PUT /cursos/:cursoId/materiais/:materialId
 * Atualiza um material
 */
export const atualizarMaterial = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const materialId = parseInt(req.params.materialId);
    const { titulo, descricao, lista_id, ordem } = req.body;

    try {
        const materialExistente = await prisma.material.findFirst({
            where: { id: materialId, curso_id: cursoId }
        });

        if (!materialExistente) {
            return res.status(404).json({ error: 'Material não encontrado.' });
        }

        const dadosAtualizacao = {
            titulo: titulo?.trim() || materialExistente.titulo,
            descricao: descricao !== undefined ? descricao?.trim() : materialExistente.descricao,
            lista_id: lista_id !== undefined ? (lista_id ? parseInt(lista_id) : null) : materialExistente.lista_id,
            ordem: ordem !== undefined ? parseInt(ordem) : materialExistente.ordem
        };

        // Atualizar arquivo se enviado
        if (req.file) {
            // Deletar arquivo antigo
            const arquivoAntigo = path.join(projectRoot, 'public', 'uploads', 'materials', materialExistente.arquivo);
            if (fs.existsSync(arquivoAntigo)) {
                fs.unlinkSync(arquivoAntigo);
            }

            dadosAtualizacao.arquivo = req.file.filename;
            dadosAtualizacao.tipo_arquivo = path.extname(req.file.originalname).slice(1).toLowerCase();
            dadosAtualizacao.tamanho = req.file.size;
        }

        const materialAtualizado = await prisma.material.update({
            where: { id: materialId },
            data: dadosAtualizacao
        });

        return res.json({
            message: 'Material atualizado com sucesso!',
            material: materialAtualizado
        });

    } catch (error) {
        console.error('Erro ao atualizar material:', error);
        return res.status(500).json({ error: 'Erro ao atualizar material.' });
    }
};

/**
 * DELETE /cursos/:cursoId/materiais/:materialId
 * Deleta um material
 */
export const deletarMaterial = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const materialId = parseInt(req.params.materialId);

    try {
        const material = await prisma.material.findFirst({
            where: { id: materialId, curso_id: cursoId }
        });

        if (!material) {
            return res.status(404).json({ error: 'Material não encontrado.' });
        }

        // Deletar arquivo
        const arquivoPath = path.join(projectRoot, 'public', 'uploads', 'materials', material.arquivo);
        if (fs.existsSync(arquivoPath)) {
            fs.unlinkSync(arquivoPath);
        }

        await prisma.material.delete({
            where: { id: materialId }
        });

        return res.json({ message: 'Material deletado com sucesso.' });

    } catch (error) {
        console.error('Erro ao deletar material:', error);
        return res.status(500).json({ error: 'Erro ao deletar material.' });
    }
};

/**
 * GET /cursos/:cursoId/materiais/:materialId/download
 * Download de um material
 */
export const downloadMaterial = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const materialId = parseInt(req.params.materialId);

    try {
        const material = await prisma.material.findFirst({
            where: { id: materialId, curso_id: cursoId }
        });

        if (!material) {
            return res.status(404).json({ error: 'Material não encontrado.' });
        }

        const arquivoPath = path.join(projectRoot, 'public', 'uploads', 'materials', material.arquivo);

        if (!fs.existsSync(arquivoPath)) {
            return res.status(404).json({ error: 'Arquivo não encontrado.' });
        }

        const nomeDownload = `${material.titulo}.${material.tipo_arquivo}`;
        res.download(arquivoPath, nomeDownload);

    } catch (error) {
        console.error('Erro ao baixar material:', error);
        return res.status(500).json({ error: 'Erro ao baixar material.' });
    }
};