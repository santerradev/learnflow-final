// file: controllers/notificacaoController.js
import prisma from '../config/prisma.js';

/**
 * GET /notificacoes
 * Renderiza a página de notificações
 */
export const renderNotificacoes = async (req, res) => {
    const usuarioId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    try {
        const [notificacoes, total, naoLidas] = await Promise.all([
            prisma.notificacao.findMany({
                where: { usuario_id: usuarioId },
                orderBy: { data_criacao: 'desc' },
                skip,
                take: limit
            }),
            prisma.notificacao.count({ where: { usuario_id: usuarioId } }),
            prisma.notificacao.count({ 
                where: { usuario_id: usuarioId, status: 'nao_lida' } 
            })
        ]);

        res.render('plataforma/notificacoes', {
            activeLink: 'notificacoes',
            notificacoes,
            naoLidas,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Erro ao carregar notificações:', error);
        req.flash('error', 'Erro ao carregar notificações.');
        res.redirect('/inicio');
    }
};

/**
 * GET /api/notificacoes
 * Retorna notificações do usuário (API)
 */
export const listarNotificacoes = async (req, res) => {
    const usuarioId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const apenasNaoLidas = req.query.nao_lidas === 'true';

    try {
        const where = { usuario_id: usuarioId };
        if (apenasNaoLidas) {
            where.status = 'nao_lida';
        }

        const [notificacoes, total] = await Promise.all([
            prisma.notificacao.findMany({
                where,
                orderBy: { data_criacao: 'desc' },
                skip,
                take: limit
            }),
            prisma.notificacao.count({ where })
        ]);

        return res.json({
            notificacoes,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Erro ao listar notificações:', error);
        return res.status(500).json({ error: 'Erro ao buscar notificações.' });
    }
};

/**
 * GET /api/notificacoes/contagem
 * Retorna contagem de notificações não lidas
 */
export const contarNaoLidas = async (req, res) => {
    const usuarioId = req.user.id;

    try {
        const count = await prisma.notificacao.count({
            where: { 
                usuario_id: usuarioId,
                status: 'nao_lida'
            }
        });

        return res.json({ nao_lidas: count });

    } catch (error) {
        console.error('Erro ao contar notificações:', error);
        return res.status(500).json({ error: 'Erro ao contar notificações.' });
    }
};

/**
 * PUT /api/notificacoes/:id/ler
 * Marca uma notificação como lida
 */
export const marcarComoLida = async (req, res) => {
    const notificacaoId = parseInt(req.params.id);
    const usuarioId = req.user.id;

    try {
        const notificacao = await prisma.notificacao.findFirst({
            where: { id: notificacaoId, usuario_id: usuarioId }
        });

        if (!notificacao) {
            return res.status(404).json({ error: 'Notificação não encontrada.' });
        }

        await prisma.notificacao.update({
            where: { id: notificacaoId },
            data: { status: 'lida' }
        });

        return res.json({ message: 'Notificação marcada como lida.' });

    } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        return res.status(500).json({ error: 'Erro ao atualizar notificação.' });
    }
};

/**
 * PUT /api/notificacoes/ler-todas
 * Marca todas as notificações como lidas
 */
export const marcarTodasComoLidas = async (req, res) => {
    const usuarioId = req.user.id;

    try {
        await prisma.notificacao.updateMany({
            where: { 
                usuario_id: usuarioId,
                status: 'nao_lida'
            },
            data: { status: 'lida' }
        });

        return res.json({ message: 'Todas as notificações foram marcadas como lidas.' });

    } catch (error) {
        console.error('Erro ao marcar notificações como lidas:', error);
        return res.status(500).json({ error: 'Erro ao atualizar notificações.' });
    }
};

/**
 * DELETE /api/notificacoes/:id
 * Deleta uma notificação
 */
export const deletarNotificacao = async (req, res) => {
    const notificacaoId = parseInt(req.params.id);
    const usuarioId = req.user.id;

    try {
        const notificacao = await prisma.notificacao.findFirst({
            where: { id: notificacaoId, usuario_id: usuarioId }
        });

        if (!notificacao) {
            return res.status(404).json({ error: 'Notificação não encontrada.' });
        }

        await prisma.notificacao.delete({
            where: { id: notificacaoId }
        });

        return res.json({ message: 'Notificação deletada com sucesso.' });

    } catch (error) {
        console.error('Erro ao deletar notificação:', error);
        return res.status(500).json({ error: 'Erro ao deletar notificação.' });
    }
};

/**
 * DELETE /api/notificacoes/limpar
 * Deleta todas as notificações do usuário
 */
export const limparNotificacoes = async (req, res) => {
    const usuarioId = req.user.id;

    try {
        await prisma.notificacao.deleteMany({
            where: { usuario_id: usuarioId }
        });

        return res.json({ message: 'Todas as notificações foram removidas.' });

    } catch (error) {
        console.error('Erro ao limpar notificações:', error);
        return res.status(500).json({ error: 'Erro ao limpar notificações.' });
    }
};