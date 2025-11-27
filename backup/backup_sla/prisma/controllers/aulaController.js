// file: controllers/aulaController.js
import prisma from '../config/prisma.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

/**
 * POST /cursos/:cursoId/aulas
 * Cria uma nova aula
 */
export const criarAula = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const usuarioId = req.user.id;
    const { titulo, descricao, lista_id, data_prazo, duracao } = req.body;

    // Validações
    if (!titulo || titulo.trim() === '') {
        return res.status(400).json({ error: 'O título da aula é obrigatório.' });
    }

    if (!req.files || !req.files.video || !req.files.video[0]) {
        return res.status(400).json({ error: 'O vídeo da aula é obrigatório.' });
    }

    try {
        // Buscar maior ordem atual
        const ultimaAula = await prisma.aula.findFirst({
            where: { curso_id: cursoId },
            orderBy: { ordem: 'desc' },
            select: { ordem: true }
        });

        const novaOrdem = (ultimaAula?.ordem || 0) + 1;

        // Obter arquivos
        const capa_aula = req.files.capa_aula?.[0]?.filename || null;
        const video = req.files.video[0].filename;

        const aula = await prisma.aula.create({
            data: {
                titulo: titulo.trim(),
                descricao: descricao?.trim() || '',
                capa_aula,
                video,
                duracao: duracao ? parseInt(duracao) : null,
                ordem: novaOrdem,
                data_prazo: data_prazo ? new Date(data_prazo) : null,
                curso_id: cursoId,
                lista_id: lista_id ? parseInt(lista_id) : null,
                usuario_id: usuarioId
            }
        });

        // Criar notificações para alunos inscritos
        const inscricoes = await prisma.inscricao.findMany({
            where: { curso_id: cursoId },
            select: { usuario_id: true }
        });

        if (inscricoes.length > 0) {
            const curso = await prisma.curso.findUnique({
                where: { id: cursoId },
                select: { titulo: true }
            });

            await prisma.notificacao.createMany({
                data: inscricoes.map(i => ({
                    tipo: 'nova_aula',
                    titulo: 'Nova aula disponível',
                    mensagem: `A aula "${aula.titulo}" foi adicionada ao curso "${curso.titulo}".`,
                    link: `/cursos/${cursoId}/aulas/${aula.id}`,
                    usuario_id: i.usuario_id
                }))
            });
        }

        return res.status(201).json({
            message: 'Aula criada com sucesso!',
            aula
        });

    } catch (error) {
        console.error('Erro ao criar aula:', error);
        return res.status(500).json({ error: 'Erro ao criar aula.' });
    }
};

/**
 * GET /cursos/:cursoId/aulas/:aulaId/dados
 * Retorna dados de uma aula específica
 */
export const obterAula = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const aulaId = parseInt(req.params.aulaId);

    try {
        const aula = await prisma.aula.findFirst({
            where: { id: aulaId, curso_id: cursoId },
            include: {
                lista: true,
                professor: {
                    select: { id: true, nome: true, foto_perfil: true }
                }
            }
        });

        if (!aula) {
            return res.status(404).json({ error: 'Aula não encontrada.' });
        }

        return res.json(aula);

    } catch (error) {
        console.error('Erro ao buscar aula:', error);
        return res.status(500).json({ error: 'Erro ao buscar aula.' });
    }
};

/**
 * PUT /cursos/:cursoId/aulas/:aulaId
 * Atualiza uma aula
 */
export const atualizarAula = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const aulaId = parseInt(req.params.aulaId);
    const { titulo, descricao, lista_id, data_prazo, duracao, ordem } = req.body;

    try {
        const aulaExistente = await prisma.aula.findFirst({
            where: { id: aulaId, curso_id: cursoId }
        });

        if (!aulaExistente) {
            return res.status(404).json({ error: 'Aula não encontrada.' });
        }

        const dadosAtualizacao = {
            titulo: titulo?.trim() || aulaExistente.titulo,
            descricao: descricao?.trim() || aulaExistente.descricao,
            lista_id: lista_id !== undefined ? (lista_id ? parseInt(lista_id) : null) : aulaExistente.lista_id,
            data_prazo: data_prazo ? new Date(data_prazo) : aulaExistente.data_prazo,
            duracao: duracao !== undefined ? (duracao ? parseInt(duracao) : null) : aulaExistente.duracao,
            ordem: ordem !== undefined ? parseInt(ordem) : aulaExistente.ordem
        };

        // Atualizar arquivos se enviados
        if (req.files) {
            if (req.files.capa_aula?.[0]) {
                // Deletar capa antiga
                if (aulaExistente.capa_aula) {
                    const capaAntiga = path.join(projectRoot, 'public', 'uploads', 'images', aulaExistente.capa_aula);
                    if (fs.existsSync(capaAntiga)) {
                        fs.unlinkSync(capaAntiga);
                    }
                }
                dadosAtualizacao.capa_aula = req.files.capa_aula[0].filename;
            }

            if (req.files.video?.[0]) {
                // Deletar vídeo antigo
                const videoAntigo = path.join(projectRoot, 'public', 'uploads', 'videos', aulaExistente.video);
                if (fs.existsSync(videoAntigo)) {
                    fs.unlinkSync(videoAntigo);
                }
                dadosAtualizacao.video = req.files.video[0].filename;
            }
        }

        const aulaAtualizada = await prisma.aula.update({
            where: { id: aulaId },
            data: dadosAtualizacao
        });

        return res.json({
            message: 'Aula atualizada com sucesso!',
            aula: aulaAtualizada
        });

    } catch (error) {
        console.error('Erro ao atualizar aula:', error);
        return res.status(500).json({ error: 'Erro ao atualizar aula.' });
    }
};

/**
 * DELETE /cursos/:cursoId/aulas/:aulaId
 * Deleta uma aula
 */
export const deletarAula = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const aulaId = parseInt(req.params.aulaId);

    try {
        const aula = await prisma.aula.findFirst({
            where: { id: aulaId, curso_id: cursoId }
        });

        if (!aula) {
            return res.status(404).json({ error: 'Aula não encontrada.' });
        }

        // Deletar arquivos
        if (aula.capa_aula) {
            const capaPath = path.join(projectRoot, 'public', 'uploads', 'images', aula.capa_aula);
            if (fs.existsSync(capaPath)) {
                fs.unlinkSync(capaPath);
            }
        }

        const videoPath = path.join(projectRoot, 'public', 'uploads', 'videos', aula.video);
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
        }

        await prisma.aula.delete({
            where: { id: aulaId }
        });

        return res.json({ message: 'Aula deletada com sucesso.' });

    } catch (error) {
        console.error('Erro ao deletar aula:', error);
        return res.status(500).json({ error: 'Erro ao deletar aula.' });
    }
};

/**
 * POST /cursos/:cursoId/aulas/:aulaId/concluir
 * Marca uma aula como concluída
 */
export const concluirAula = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const aulaId = parseInt(req.params.aulaId);
    const usuarioId = req.user.id;

    try {
        // Verificar inscrição
        const inscricao = await prisma.inscricao.findUnique({
            where: {
                usuario_id_curso_id: {
                    usuario_id: usuarioId,
                    curso_id: cursoId
                }
            }
        });

        if (!inscricao) {
            return res.status(403).json({ error: 'Você não está inscrito neste curso.' });
        }

        // Verificar se a aula existe
        const aula = await prisma.aula.findFirst({
            where: { id: aulaId, curso_id: cursoId }
        });

        if (!aula) {
            return res.status(404).json({ error: 'Aula não encontrada.' });
        }

        // Criar ou atualizar progresso
        const progresso = await prisma.progresso.upsert({
            where: {
                inscricao_id_aula_id: {
                    inscricao_id: inscricao.id,
                    aula_id: aulaId
                }
            },
            update: {
                concluida: true,
                data_conclusao: new Date()
            },
            create: {
                inscricao_id: inscricao.id,
                aula_id: aulaId,
                concluida: true
            }
        });

        return res.json({
            message: 'Aula marcada como concluída!',
            progresso
        });

    } catch (error) {
        console.error('Erro ao concluir aula:', error);
        return res.status(500).json({ error: 'Erro ao marcar aula como concluída.' });
    }
};