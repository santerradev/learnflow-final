// file: controllers/muralController.js
import prisma from '../config/prisma.js';

// POST /mural/:cursoId/publicacoes - Criar publicação
export const criarPublicacao = async (req, res) => {
  const cursoId = parseInt(req.params.cursoId);
  const { conteudo } = req.body;
  const usuarioId = req.user.id;

  try {
    const publicacao = await prisma.publicacao.create({
      data: {
        conteudo,
        curso_id: cursoId,
        usuario_id: usuarioId
      }
    });

    // Criar notificação para inscritos no curso (exceto o autor)
    const inscricoes = await prisma.inscricao.findMany({
      where: { 
        curso_id: cursoId,
        usuario_id: { not: usuarioId }
      },
      select: { usuario_id: true }
    });

    const notificacoes = inscricoes.map(i => ({
      tipo: 'nova_mensagem',
      titulo: 'Nova publicação no mural',
      mensagem: `${req.user.nome} publicou algo no mural`,
      link: `/cursos/${cursoId}?aba=mural`,
      usuario_id: i.usuario_id
    }));

    if (notificacoes.length > 0) {
      await prisma.notificacao.createMany({ data: notificacoes });
    }

    res.status(201).json({ success: true, publicacao });
  } catch (error) {
    console.error('Erro ao criar publicação:', error);
    res.status(500).json({ error: 'Erro ao criar publicação.' });
  }
};

// DELETE /mural/publicacoes/:id - Deletar publicação
export const deletarPublicacao = async (req, res) => {
  const pubId = parseInt(req.params.id);
  const usuarioId = req.user.id;
  const usuarioTipo = req.user.tipo;

  try {
    const pub = await prisma.publicacao.findUnique({
      where: { id: pubId },
      include: { curso: { select: { usuario_id: true } } }
    });

    if (!pub) {
      return res.status(404).json({ error: 'Publicação não encontrada.' });
    }

    const eDono = pub.curso.usuario_id === usuarioId;
    const eAutor = pub.usuario_id === usuarioId;
    const eAdmin = usuarioTipo === 'administrador';

    if (!eAutor && !eDono && !eAdmin) {
      return res.status(403).json({ error: 'Sem permissão.' });
    }

    await prisma.publicacao.delete({ where: { id: pubId } });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar publicação:', error);
    res.status(500).json({ error: 'Erro ao deletar publicação.' });
  }
};

// POST /mural/publicacoes/:id/comentarios - Criar comentário
export const criarComentario = async (req, res) => {
  const pubId = parseInt(req.params.id);
  const { conteudo } = req.body;
  const usuarioId = req.user.id;

  try {
    const comentario = await prisma.comentario.create({
      data: {
        conteudo,
        publicacao_id: pubId,
        usuario_id: usuarioId
      }
    });

    res.status(201).json({ success: true, comentario });
  } catch (error) {
    console.error('Erro ao criar comentário:', error);
    res.status(500).json({ error: 'Erro ao criar comentário.' });
  }
};

// DELETE /mural/comentarios/:id - Deletar comentário
export const deletarComentario = async (req, res) => {
  const comId = parseInt(req.params.id);
  const usuarioId = req.user.id;
  const usuarioTipo = req.user.tipo;

  try {
    const com = await prisma.comentario.findUnique({
      where: { id: comId },
      include: {
        publicacao: {
          include: {
            curso: { select: { usuario_id: true } }
          }
        }
      }
    });

    if (!com) {
      return res.status(404).json({ error: 'Comentário não encontrado.' });
    }

    const eDono = com.publicacao.curso.usuario_id === usuarioId;
    const eAutor = com.usuario_id === usuarioId;
    const eAdmin = usuarioTipo === 'administrador';

    if (!eAutor && !eDono && !eAdmin) {
      return res.status(403).json({ error: 'Sem permissão.' });
    }

    await prisma.comentario.delete({ where: { id: comId } });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar comentário:', error);
    res.status(500).json({ error: 'Erro ao deletar comentário.' });
  }
};