// file: controllers/inscricaoController.js
import prisma from '../config/prisma.js';

// POST /inscricoes/:cursoId - Inscrever-se em um curso
export const inscreverCurso = async (req, res) => {
  const cursoId = parseInt(req.params.cursoId);
  const alunoId = req.user.id;
  const { senha_acesso } = req.body;

  if (isNaN(cursoId)) {
    return res.status(400).json({ error: 'ID de curso inválido.' });
  }

  try {
    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true, titulo: true, senha_acesso: true }
    });

    if (!curso) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    const inscricaoExistente = await prisma.inscricao.findUnique({
      where: {
        usuario_id_curso_id: {
          usuario_id: alunoId,
          curso_id: cursoId
        }
      }
    });

    if (inscricaoExistente) {
      return res.status(409).json({ error: 'Você já está inscrito neste curso.' });
    }

    if (curso.senha_acesso) {
      if (!senha_acesso) {
        return res.status(400).json({ error: 'Este curso requer uma senha de acesso.' });
      }

      if (senha_acesso !== curso.senha_acesso) {
        return res.status(403).json({ error: 'Senha de acesso incorreta.' });
      }
    }

    await prisma.inscricao.create({
      data: {
        usuario_id: alunoId,
        curso_id: cursoId
      }
    });

    await prisma.notificacao.create({
      data: {
        tipo: 'novo_curso',
        titulo: 'Inscrição realizada!',
        mensagem: `Você foi inscrito no curso "${curso.titulo}". Explore o conteúdo e comece a aprender!`,
        link: `/cursos/${cursoId}`,
        usuario_id: alunoId
      }
    });

    res.status(201).json({ 
      success: true, 
      message: 'Inscrição realizada com sucesso!' 
    });

  } catch (error) {
    console.error('Erro ao inscrever em curso:', error);
    res.status(500).json({ error: 'Erro ao realizar inscrição.' });
  }
};

// POST /inscricoes/:cursoId/validar - Valida senha de acesso (API)
export const validarSenhaAcesso = async (req, res) => {
  const cursoId = parseInt(req.params.cursoId);
  const { senha_acesso } = req.body;

  if (isNaN(cursoId)) {
    return res.status(400).json({ error: 'ID de curso inválido.' });
  }

  try {
    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: { senha_acesso: true }
    });

    if (!curso) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    if (!curso.senha_acesso) {
      return res.status(200).json({ valido: true, mensagem: 'Curso sem senha de acesso.' });
    }

    if (senha_acesso === curso.senha_acesso) {
      return res.status(200).json({ valido: true, mensagem: 'Senha válida!' });
    } else {
      return res.status(200).json({ valido: false, mensagem: 'Senha incorreta.' });
    }

  } catch (error) {
    console.error('Erro ao validar senha:', error);
    res.status(500).json({ error: 'Erro ao validar senha.' });
  }
};

// DELETE /inscricoes/:cursoId - Cancelar inscrição
export const cancelarInscricao = async (req, res) => {
  const cursoId = parseInt(req.params.cursoId);
  const alunoId = req.user.id;

  if (isNaN(cursoId)) {
    return res.status(400).json({ error: 'ID de curso inválido.' });
  }

  try {
    const inscricao = await prisma.inscricao.findUnique({
      where: {
        usuario_id_curso_id: {
          usuario_id: alunoId,
          curso_id: cursoId
        }
      }
    });

    if (!inscricao) {
      return res.status(404).json({ error: 'Você não está inscrito neste curso.' });
    }

    await prisma.inscricao.delete({
      where: {
        usuario_id_curso_id: {
          usuario_id: alunoId,
          curso_id: cursoId
        }
      }
    });

    res.status(200).json({ message: 'Inscrição cancelada com sucesso.' });

  } catch (error) {
    console.error('Erro ao cancelar inscrição:', error);
    res.status(500).json({ error: 'Erro ao cancelar inscrição.' });
  }
};

// POST /inscricoes/:cursoId/cancelar - Cancelar via formulário
export const cancelarInscricaoForm = async (req, res) => {
  const cursoId = parseInt(req.params.cursoId);
  const alunoId = req.user.id;

  try {
    await prisma.inscricao.delete({
      where: {
        usuario_id_curso_id: {
          usuario_id: alunoId,
          curso_id: cursoId
        }
      }
    });

    req.flash('success', 'Inscrição cancelada com sucesso.');
    res.redirect('/cursos');

  } catch (error) {
    console.error('Erro ao cancelar inscrição:', error);
    req.flash('error', 'Erro ao cancelar inscrição.');
    res.redirect('/cursos');
  }
};

// GET /inscricoes - Lista inscrições do usuário
export const listarInscricoes = async (req, res) => {
  const alunoId = req.user.id;

  try {
    const inscricoes = await prisma.inscricao.findMany({
      where: { usuario_id: alunoId },
      include: {
        curso: {
          include: {
            professor: {
              select: { nome: true, foto_perfil: true }
            }
          }
        }
      },
      orderBy: { data_inscricao: 'desc' }
    });

    res.render('plataforma/minhas_inscricoes', {
      inscricoes,
      activeLink: 'meus_cursos'
    });

  } catch (error) {
    console.error('Erro ao listar inscrições:', error);
    req.flash('error', 'Erro ao carregar inscrições.');
    res.status(500).render('404_app', { message: 'Erro ao carregar inscrições.' });
  }
};