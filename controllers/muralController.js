// file: controllers/muralController.js
import prisma from '../config/prisma.js';

// ==========================================
// ============= PUBLICAÇÕES ================
// ==========================================

/**
 * POST /cursos/:cursoId/publicacoes
 * Cria uma nova publicação no mural
 */
export const criarPublicacao = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const usuarioId = req.user.id;
    const { conteudo } = req.body;

    if (!conteudo || conteudo.trim() === '') {
        return res.status(400).json({ error: 'O conteúdo da publicação é obrigatório.' });
    }

    try {
        const publicacao = await prisma.publicacao.create({
            data: {
                conteudo: conteudo.trim(),
                curso_id: cursoId,
                usuario_id: usuarioId
            },
            include: {
                autor: {
                    select: { id: true, nome: true, foto_perfil: true, tipo: true }
                }
            }
        });

        // Criar notificações (apenas se for professor postando)
        if (req.user.tipo === 'professor' || req.user.tipo === 'administrador') {
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
                        tipo: 'nova_publicacao',
                        titulo: 'Nova publicação no mural',
                        mensagem: `${req.user.nome} publicou no mural do curso "${curso.titulo}".`,
                        link: `/cursos/${cursoId}/mural`,
                        usuario_id: i.usuario_id
                    }))
                });
            }
        }

        return res.status(201).json({
            message: 'Publicação criada com sucesso!',
            publicacao
        });

    } catch (error) {
        console.error('Erro ao criar publicação:', error);
        return res.status(500).json({ error: 'Erro ao criar publicação.' });
    }
};

/**
 * GET /cursos/:cursoId/publicacoes
 * Lista todas as publicações do curso
 */
export const listarPublicacoes = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const [publicacoes, total] = await Promise.all([
            prisma.publicacao.findMany({
                where: { curso_id: cursoId },
                include: {
                    autor: {
                        select: { id: true, nome: true, foto_perfil: true, tipo: true }
                    },
                    comentarios: {
                        include: {
                            autor: {
                                select: { id: true, nome: true, foto_perfil: true, tipo: true }
                            }
                        },
                        orderBy: { data_criacao: 'asc' }
                    },
                    _count: {
                        select: { comentarios: true }
                    }
                },
                orderBy: { data_criacao: 'desc' },
                skip,
                take: limit
            }),
            prisma.publicacao.count({ where: { curso_id: cursoId } })
        ]);

        return res.json({
            publicacoes,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Erro ao listar publicações:', error);
        return res.status(500).json({ error: 'Erro ao buscar publicações.' });
    }
};

/**
 * PUT /cursos/:cursoId/publicacoes/:publicacaoId
 * Atualiza uma publicação
 */
export const atualizarPublicacao = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const publicacaoId = parseInt(req.params.publicacaoId);
    const usuarioId = req.user.id;
    const { conteudo } = req.body;

    if (!conteudo || conteudo.trim() === '') {
        return res.status(400).json({ error: 'O conteúdo da publicação é obrigatório.' });
    }

    try {
        const publicacao = await prisma.publicacao.findFirst({
            where: { id: publicacaoId, curso_id: cursoId }
        });

        if (!publicacao) {
            return res.status(404).json({ error: 'Publicação não encontrada.' });
        }

        // Verificar permissão (autor ou admin)
        if (publicacao.usuario_id !== usuarioId && req.user.tipo !== 'administrador') {
            return res.status(403).json({ error: 'Você não tem permissão para editar esta publicação.' });
        }

        const publicacaoAtualizada = await prisma.publicacao.update({
            where: { id: publicacaoId },
            data: { conteudo: conteudo.trim() },
            include: {
                autor: {
                    select: { id: true, nome: true, foto_perfil: true, tipo: true }
                }
            }
        });

        return res.json({
            message: 'Publicação atualizada com sucesso!',
            publicacao: publicacaoAtualizada
        });

    } catch (error) {
        console.error('Erro ao atualizar publicação:', error);
        return res.status(500).json({ error: 'Erro ao atualizar publicação.' });
    }
};

/**
 * DELETE /cursos/:cursoId/publicacoes/:publicacaoId
 * Deleta uma publicação
 */
export const deletarPublicacao = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const publicacaoId = parseInt(req.params.publicacaoId);
    const usuarioId = req.user.id;

    try {
        const publicacao = await prisma.publicacao.findFirst({
            where: { id: publicacaoId, curso_id: cursoId }
        });

        if (!publicacao) {
            return res.status(404).json({ error: 'Publicação não encontrada.' });
        }

        // Verificar permissão (autor, dono do curso ou admin)
        const eDonoCurso = req.curso?.usuario_id === usuarioId;
        if (publicacao.usuario_id !== usuarioId && !eDonoCurso && req.user.tipo !== 'administrador') {
            return res.status(403).json({ error: 'Você não tem permissão para deletar esta publicação.' });
        }

        await prisma.publicacao.delete({
            where: { id: publicacaoId }
        });

        return res.json({ message: 'Publicação deletada com sucesso.' });

    } catch (error) {
        console.error('Erro ao deletar publicação:', error);
        return res.status(500).json({ error: 'Erro ao deletar publicação.' });
    }
};

// ==========================================
// ============= COMENTÁRIOS ================
// ==========================================

/**
 * POST /cursos/:cursoId/publicacoes/:publicacaoId/comentarios
 * Cria um comentário em uma publicação
 */
export const criarComentario = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const publicacaoId = parseInt(req.params.publicacaoId);
    const usuarioId = req.user.id;
    const { conteudo } = req.body;

    if (!conteudo || conteudo.trim() === '') {
        return res.status(400).json({ error: 'O conteúdo do comentário é obrigatório.' });
    }

    try {
        // Verificar se publicação existe
        const publicacao = await prisma.publicacao.findFirst({
            where: { id: publicacaoId, curso_id: cursoId }
        });

        if (!publicacao) {
            return res.status(404).json({ error: 'Publicação não encontrada.' });
        }

        const comentario = await prisma.comentario.create({
            data: {
                conteudo: conteudo.trim(),
                publicacao_id: publicacaoId,
                usuario_id: usuarioId
            },
            include: {
                autor: {
                    select: { id: true, nome: true, foto_perfil: true, tipo: true }
                }
            }
        });

        // Notificar autor da publicação (se não for ele mesmo)
        if (publicacao.usuario_id !== usuarioId) {
            await prisma.notificacao.create({
                data: {
                    tipo: 'novo_comentario',
                    titulo: 'Novo comentário',
                    mensagem: `${req.user.nome} comentou em sua publicação.`,
                    link: `/cursos/${cursoId}/mural`,
                    usuario_id: publicacao.usuario_id
                }
            });
        }

        return res.status(201).json({
            message: 'Comentário criado com sucesso!',
            comentario
        });

    } catch (error) {
        console.error('Erro ao criar comentário:', error);
        return res.status(500).json({ error: 'Erro ao criar comentário.' });
    }
};

/**
 * PUT /cursos/:cursoId/publicacoes/:publicacaoId/comentarios/:comentarioId
 * Atualiza um comentário
 */
export const atualizarComentario = async (req, res) => {
    const comentarioId = parseInt(req.params.comentarioId);
    const usuarioId = req.user.id;
    const { conteudo } = req.body;

    if (!conteudo || conteudo.trim() === '') {
        return res.status(400).json({ error: 'O conteúdo do comentário é obrigatório.' });
    }

    try {
        const comentario = await prisma.comentario.findUnique({
            where: { id: comentarioId }
        });

        if (!comentario) {
            return res.status(404).json({ error: 'Comentário não encontrado.' });
        }

        // Verificar permissão (autor ou admin)
        if (comentario.usuario_id !== usuarioId && req.user.tipo !== 'administrador') {
            return res.status(403).json({ error: 'Você não tem permissão para editar este comentário.' });
        }

        const comentarioAtualizado = await prisma.comentario.update({
            where: { id: comentarioId },
            data: { conteudo: conteudo.trim() },
            include: {
                autor: {
                    select: { id: true, nome: true, foto_perfil: true, tipo: true }
                }
            }
        });

        return res.json({
            message: 'Comentário atualizado com sucesso!',
            comentario: comentarioAtualizado
        });

    } catch (error) {
        console.error('Erro ao atualizar comentário:', error);
        return res.status(500).json({ error: 'Erro ao atualizar comentário.' });
    }
};

/**
 * DELETE /cursos/:cursoId/publicacoes/:publicacaoId/comentarios/:comentarioId
 * Deleta um comentário
 */
export const deletarComentario = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const comentarioId = parseInt(req.params.comentarioId);
    const usuarioId = req.user.id;

    try {
        const comentario = await prisma.comentario.findUnique({
            where: { id: comentarioId }
        });

        if (!comentario) {
            return res.status(404).json({ error: 'Comentário não encontrado.' });
        }

        // Verificar permissão (autor, dono do curso ou admin)
        const eDonoCurso = req.curso?.usuario_id === usuarioId;
        if (comentario.usuario_id !== usuarioId && !eDonoCurso && req.user.tipo !== 'administrador') {
            return res.status(403).json({ error: 'Você não tem permissão para deletar este comentário.' });
        }

        await prisma.comentario.delete({
            where: { id: comentarioId }
        });

        return res.json({ message: 'Comentário deletado com sucesso.' });

    } catch (error) {
        console.error('Erro ao deletar comentário:', error);
        return res.status(500).json({ error: 'Erro ao deletar comentário.' });
    }
};