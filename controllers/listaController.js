// file: controllers/listaController.js
import prisma from '../config/prisma.js';

/**
 * POST /cursos/:cursoId/listas
 * Cria uma nova lista/tópico no curso
 */
export const criarLista = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const usuarioId = req.user.id;
    const { titulo, descricao } = req.body;

    if (!titulo || titulo.trim() === '') {
        return res.status(400).json({ error: 'O título da lista é obrigatório.' });
    }

    try {
        // Buscar maior ordem atual
        const ultimaLista = await prisma.lista.findFirst({
            where: { curso_id: cursoId },
            orderBy: { ordem: 'desc' },
            select: { ordem: true }
        });

        const novaOrdem = (ultimaLista?.ordem || 0) + 1;

        const lista = await prisma.lista.create({
            data: {
                titulo: titulo.trim(),
                descricao: descricao?.trim() || null,
                ordem: novaOrdem,
                curso_id: cursoId,
                usuario_id: usuarioId
            }
        });

        return res.status(201).json({
            message: 'Lista criada com sucesso!',
            lista
        });

    } catch (error) {
        console.error('Erro ao criar lista:', error);
        return res.status(500).json({ error: 'Erro ao criar lista.' });
    }
};

/**
 * GET /cursos/:cursoId/listas
 * Retorna todas as listas do curso
 */
export const listarListas = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);

    try {
        const listas = await prisma.lista.findMany({
            where: { curso_id: cursoId },
            include: {
                _count: {
                    select: {
                        aulas: true,
                        atividades: true,
                        materiais: true
                    }
                }
            },
            orderBy: { ordem: 'asc' }
        });

        return res.json(listas);

    } catch (error) {
        console.error('Erro ao listar listas:', error);
        return res.status(500).json({ error: 'Erro ao buscar listas.' });
    }
};

/**
 * PUT /cursos/:cursoId/listas/:listaId
 * Atualiza uma lista
 */
export const atualizarLista = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const listaId = parseInt(req.params.listaId);
    const { titulo, descricao, ordem } = req.body;

    try {
        const lista = await prisma.lista.findFirst({
            where: { id: listaId, curso_id: cursoId }
        });

        if (!lista) {
            return res.status(404).json({ error: 'Lista não encontrada.' });
        }

        const listaAtualizada = await prisma.lista.update({
            where: { id: listaId },
            data: {
                titulo: titulo?.trim() || lista.titulo,
                descricao: descricao?.trim() || lista.descricao,
                ordem: ordem !== undefined ? parseInt(ordem) : lista.ordem
            }
        });

        return res.json({
            message: 'Lista atualizada com sucesso!',
            lista: listaAtualizada
        });

    } catch (error) {
        console.error('Erro ao atualizar lista:', error);
        return res.status(500).json({ error: 'Erro ao atualizar lista.' });
    }
};

/**
 * DELETE /cursos/:cursoId/listas/:listaId
 * Deleta uma lista (itens ficam com lista_id = null)
 */
export const deletarLista = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const listaId = parseInt(req.params.listaId);

    try {
        const lista = await prisma.lista.findFirst({
            where: { id: listaId, curso_id: cursoId }
        });

        if (!lista) {
            return res.status(404).json({ error: 'Lista não encontrada.' });
        }

        await prisma.lista.delete({
            where: { id: listaId }
        });

        return res.json({ message: 'Lista deletada com sucesso.' });

    } catch (error) {
        console.error('Erro ao deletar lista:', error);
        return res.status(500).json({ error: 'Erro ao deletar lista.' });
    }
};