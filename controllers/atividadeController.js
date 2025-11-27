// file: controllers/atividadeController.js
import prisma from '../config/prisma.js';

/**
 * POST /cursos/:cursoId/atividades
 * Cria uma nova atividade
 */
export const criarAtividade = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const usuarioId = req.user.id;
    const { titulo, descricao, lista_id, data_prazo, conteudo } = req.body;

    // Validações
    if (!titulo || titulo.trim() === '') {
        return res.status(400).json({ error: 'O título da atividade é obrigatório.' });
    }

    if (!conteudo || !conteudo.perguntas || conteudo.perguntas.length === 0) {
        return res.status(400).json({ error: 'A atividade deve ter pelo menos uma pergunta.' });
    }

    try {
        // Buscar maior ordem atual
        const ultimaAtividade = await prisma.atividade.findFirst({
            where: { curso_id: cursoId },
            orderBy: { ordem: 'desc' },
            select: { ordem: true }
        });

        const novaOrdem = (ultimaAtividade?.ordem || 0) + 1;

        const atividade = await prisma.atividade.create({
            data: {
                titulo: titulo.trim(),
                descricao: descricao?.trim() || null,
                conteudo: conteudo, // JSON com perguntas
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
                    tipo: 'nova_atividade',
                    titulo: 'Nova atividade disponível',
                    mensagem: `A atividade "${atividade.titulo}" foi adicionada ao curso "${curso.titulo}".`,
                    link: `/cursos/${cursoId}/atividades/${atividade.id}`,
                    usuario_id: i.usuario_id
                }))
            });
        }

        return res.status(201).json({
            message: 'Atividade criada com sucesso!',
            atividade
        });

    } catch (error) {
        console.error('Erro ao criar atividade:', error);
        return res.status(500).json({ error: 'Erro ao criar atividade.' });
    }
};

/**
 * GET /cursos/:cursoId/atividades/:atividadeId/dados
 * Retorna dados de uma atividade específica
 */
export const obterAtividade = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const atividadeId = parseInt(req.params.atividadeId);

    try {
        const atividade = await prisma.atividade.findFirst({
            where: { id: atividadeId, curso_id: cursoId },
            include: {
                lista: true,
                professor: {
                    select: { id: true, nome: true, foto_perfil: true }
                }
            }
        });

        if (!atividade) {
            return res.status(404).json({ error: 'Atividade não encontrada.' });
        }

        return res.json(atividade);

    } catch (error) {
        console.error('Erro ao buscar atividade:', error);
        return res.status(500).json({ error: 'Erro ao buscar atividade.' });
    }
};

/**
 * PUT /cursos/:cursoId/atividades/:atividadeId
 * Atualiza uma atividade
 */
export const atualizarAtividade = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const atividadeId = parseInt(req.params.atividadeId);
    const { titulo, descricao, lista_id, data_prazo, conteudo, ordem } = req.body;

    try {
        const atividadeExistente = await prisma.atividade.findFirst({
            where: { id: atividadeId, curso_id: cursoId }
        });

        if (!atividadeExistente) {
            return res.status(404).json({ error: 'Atividade não encontrada.' });
        }

        const atividadeAtualizada = await prisma.atividade.update({
            where: { id: atividadeId },
            data: {
                titulo: titulo?.trim() || atividadeExistente.titulo,
                descricao: descricao !== undefined ? descricao?.trim() : atividadeExistente.descricao,
                conteudo: conteudo || atividadeExistente.conteudo,
                lista_id: lista_id !== undefined ? (lista_id ? parseInt(lista_id) : null) : atividadeExistente.lista_id,
                data_prazo: data_prazo ? new Date(data_prazo) : atividadeExistente.data_prazo,
                ordem: ordem !== undefined ? parseInt(ordem) : atividadeExistente.ordem
            }
        });

        return res.json({
            message: 'Atividade atualizada com sucesso!',
            atividade: atividadeAtualizada
        });

    } catch (error) {
        console.error('Erro ao atualizar atividade:', error);
        return res.status(500).json({ error: 'Erro ao atualizar atividade.' });
    }
};

/**
 * DELETE /cursos/:cursoId/atividades/:atividadeId
 * Deleta uma atividade
 */
export const deletarAtividade = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const atividadeId = parseInt(req.params.atividadeId);

    try {
        const atividade = await prisma.atividade.findFirst({
            where: { id: atividadeId, curso_id: cursoId }
        });

        if (!atividade) {
            return res.status(404).json({ error: 'Atividade não encontrada.' });
        }

        await prisma.atividade.delete({
            where: { id: atividadeId }
        });

        return res.json({ message: 'Atividade deletada com sucesso.' });

    } catch (error) {
        console.error('Erro ao deletar atividade:', error);
        return res.status(500).json({ error: 'Erro ao deletar atividade.' });
    }
};

/**
 * POST /cursos/:cursoId/atividades/:atividadeId/submeter
 * Submete respostas de uma atividade
 */
export const submeterAtividade = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const atividadeId = parseInt(req.params.atividadeId);
    const usuarioId = req.user.id;
    const { respostas } = req.body; // { perguntaId: respostaId, ... }

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

        // Verificar se a atividade existe
        const atividade = await prisma.atividade.findFirst({
            where: { id: atividadeId, curso_id: cursoId }
        });

        if (!atividade) {
            return res.status(404).json({ error: 'Atividade não encontrada.' });
        }

        // Calcular pontuação
        const perguntas = atividade.conteudo.perguntas || [];
        let acertos = 0;

        for (const pergunta of perguntas) {
            if (respostas[pergunta.id] === pergunta.resposta_correta) {
                acertos++;
            }
        }

        const pontuacao = perguntas.length > 0 
            ? Math.round((acertos / perguntas.length) * 100) 
            : 0;

        // Criar ou atualizar progresso
        const progresso = await prisma.progresso.upsert({
            where: {
                inscricao_id_atividade_id: {
                    inscricao_id: inscricao.id,
                    atividade_id: atividadeId
                }
            },
            update: {
                concluida: true,
                pontuacao_obtida: pontuacao,
                data_conclusao: new Date()
            },
            create: {
                inscricao_id: inscricao.id,
                atividade_id: atividadeId,
                concluida: true,
                pontuacao_obtida: pontuacao
            }
        });

        return res.json({
            message: 'Atividade submetida com sucesso!',
            pontuacao,
            acertos,
            total: perguntas.length,
            progresso
        });

    } catch (error) {
        console.error('Erro ao submeter atividade:', error);
        return res.status(500).json({ error: 'Erro ao submeter atividade.' });
    }
};