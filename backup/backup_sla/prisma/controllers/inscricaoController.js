// file: controllers/inscricaoController.js
import prisma from '../config/prisma.js';

/**
 * POST /cursos/:id/inscrever
 * Inscreve o usuário no curso
 */
export const inscreverNoCurso = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const usuarioId = req.user.id;
    const { senha_acesso } = req.body;

    if (isNaN(cursoId)) {
        return res.status(400).json({ error: 'ID do curso inválido.' });
    }

    try {
        // Buscar o curso
        const curso = await prisma.curso.findUnique({
            where: { id: cursoId },
            select: { id: true, titulo: true, senha_acesso: true, usuario_id: true }
        });

        if (!curso) {
            return res.status(404).json({ error: 'Curso não encontrado.' });
        }

        // Não pode se inscrever no próprio curso
        if (curso.usuario_id === usuarioId) {
            return res.status(400).json({ error: 'Você é o professor deste curso.' });
        }

        // Verificar se já está inscrito
        const inscricaoExistente = await prisma.inscricao.findUnique({
            where: {
                usuario_id_curso_id: {
                    usuario_id: usuarioId,
                    curso_id: cursoId
                }
            }
        });

        if (inscricaoExistente) {
            return res.status(400).json({ error: 'Você já está inscrito neste curso.' });
        }

        // Verificar senha de acesso (se existir)
        if (curso.senha_acesso) {
            if (!senha_acesso) {
                return res.status(403).json({ 
                    error: 'Este curso requer senha de acesso.',
                    requer_senha: true 
                });
            }
            if (senha_acesso !== curso.senha_acesso) {
                return res.status(403).json({ error: 'Senha de acesso incorreta.' });
            }
        }

        // Criar inscrição
        const inscricao = await prisma.inscricao.create({
            data: {
                usuario_id: usuarioId,
                curso_id: cursoId
            }
        });

        // Criar notificação para o professor
        await prisma.notificacao.create({
            data: {
                tipo: 'inscricao_curso',
                titulo: 'Nova inscrição',
                mensagem: `${req.user.nome} se inscreveu no curso "${curso.titulo}".`,
                link: `/cursos/${cursoId}/pessoas`,
                usuario_id: curso.usuario_id
            }
        });

        return res.status(201).json({ 
            message: 'Inscrição realizada com sucesso!',
            inscricao 
        });

    } catch (error) {
        console.error('Erro ao inscrever no curso:', error);
        return res.status(500).json({ error: 'Erro ao processar inscrição.' });
    }
};

/**
 * POST /cursos/:id/cancelar-inscricao
 * Cancela a inscrição do usuário no curso
 */
export const cancelarInscricao = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const usuarioId = req.user.id;

    if (isNaN(cursoId)) {
        return res.status(400).json({ error: 'ID do curso inválido.' });
    }

    try {
        // Verificar se está inscrito
        const inscricao = await prisma.inscricao.findUnique({
            where: {
                usuario_id_curso_id: {
                    usuario_id: usuarioId,
                    curso_id: cursoId
                }
            }
        });

        if (!inscricao) {
            return res.status(404).json({ error: 'Você não está inscrito neste curso.' });
        }

        // Deletar inscrição (cascade deleta progresso)
        await prisma.inscricao.delete({
            where: { id: inscricao.id }
        });

        return res.status(200).json({ message: 'Inscrição cancelada com sucesso.' });

    } catch (error) {
        console.error('Erro ao cancelar inscrição:', error);
        return res.status(500).json({ error: 'Erro ao cancelar inscrição.' });
    }
};

/**
 * GET /cursos/:id/verificar-inscricao
 * Verifica se o usuário está inscrito no curso
 */
export const verificarInscricao = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const usuarioId = req.user.id;

    if (isNaN(cursoId)) {
        return res.status(400).json({ error: 'ID do curso inválido.' });
    }

    try {
        const curso = await prisma.curso.findUnique({
            where: { id: cursoId },
            select: { id: true, usuario_id: true, senha_acesso: true }
        });

        if (!curso) {
            return res.status(404).json({ error: 'Curso não encontrado.' });
        }

        // Verificar se é o dono
        const eDono = curso.usuario_id === usuarioId || req.user.tipo === 'administrador';

        // Verificar inscrição
        const inscricao = await prisma.inscricao.findUnique({
            where: {
                usuario_id_curso_id: {
                    usuario_id: usuarioId,
                    curso_id: cursoId
                }
            }
        });

        return res.json({
            inscrito: !!inscricao,
            eDono,
            requer_senha: !!curso.senha_acesso && !inscricao && !eDono
        });

    } catch (error) {
        console.error('Erro ao verificar inscrição:', error);
        return res.status(500).json({ error: 'Erro ao verificar inscrição.' });
    }
};