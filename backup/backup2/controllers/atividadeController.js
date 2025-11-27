// file: controllers/atividadeController.js
import prisma from '../config/prisma.js';

// ✅ CORRIGIDO: Todas as referências agora usam req.user

// Criar Atividade (Professor/Admin)
export const criarAtividade = async (req, res) => {
  const { cursoId } = req.params;
  const { titulo, materia, conteudo, ordem } = req.body;
  
  // ✅ CORRIGIDO: Usa req.user do Passport
  const professorId = req.user.id;

  try {
    // Verificar se o curso existe e se o professor é o dono
    const curso = await prisma.curso.findUnique({ 
      where: { id: parseInt(cursoId) } 
    });

    if (!curso) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    // ✅ CORRIGIDO: Verifica permissão usando req.user
    if (curso.usuario_id !== professorId && req.user.tipo !== 'administrador') {
      return res.status(403).json({ error: 'Você não é o dono deste curso.' });
    }

    const atividade = await prisma.atividade.create({
      data: {
        titulo,
        materia,
        conteudo, // JSON com perguntas e respostas
        ordem: parseInt(ordem),
        curso_id: parseInt(cursoId),
        usuario_id: professorId,
      },
    });

    res.status(201).json(atividade);
  } catch (error) {
    console.error('Erro ao criar atividade:', error);
    res.status(500).json({ error: 'Erro ao criar atividade.' });
  }
};

// Listar Atividades de um Curso
export const listarAtividades = async (req, res) => {
  const { cursoId } = req.params;

  try {
    const atividades = await prisma.atividade.findMany({
      where: { curso_id: parseInt(cursoId) },
      orderBy: { ordem: 'asc' },
      select: {
        id: true,
        titulo: true,
        materia: true,
        ordem: true,
      }
    });

    res.status(200).json(atividades);
  } catch (error) {
    console.error('Erro ao listar atividades:', error);
    res.status(500).json({ error: 'Erro ao buscar atividades.' });
  }
};

// Buscar Detalhes de uma Atividade
export const buscarAtividade = async (req, res) => {
  const { atividadeId } = req.params;
  
  // ✅ CORRIGIDO: Usa req.user do Passport
  const usuarioId = req.user.id;
  const usuarioTipo = req.user.tipo;

  try {
    const atividade = await prisma.atividade.findUnique({
      where: { id: parseInt(atividadeId) },
      include: {
        curso: {
          select: { titulo: true, usuario_id: true }
        },
        professor: {
          select: { nome: true }
        }
      }
    });

    if (!atividade) {
      return res.status(404).json({ error: 'Atividade não encontrada.' });
    }

    // Se for aluno, não mostrar as respostas corretas
    let conteudoFiltrado = atividade.conteudo;
    if (usuarioTipo === 'aluno') {
      // Assumindo que conteudo é um array de perguntas
      // cada pergunta tem { pergunta, opcoes[], respostaCorreta }
      conteudoFiltrado = atividade.conteudo.map(q => ({
        pergunta: q.pergunta,
        opcoes: q.opcoes,
        // Remove respostaCorreta para alunos
      }));
    }

    res.status(200).json({
      ...atividade,
      conteudo: conteudoFiltrado
    });
  } catch (error) {
    console.error('Erro ao buscar atividade:', error);
    res.status(500).json({ error: 'Erro ao buscar atividade.' });
  }
};

// Atualizar Atividade
export const atualizarAtividade = async (req, res) => {
  const { atividadeId } = req.params;
  const { titulo, materia, conteudo, ordem } = req.body;
  
  // ✅ CORRIGIDO: Usa req.user do Passport
  const usuarioId = req.user.id;
  const usuarioTipo = req.user.tipo;

  try {
    const atividadeExistente = await prisma.atividade.findUnique({
      where: { id: parseInt(atividadeId) },
      select: { usuario_id: true }
    });

    if (!atividadeExistente) {
      return res.status(404).json({ error: 'Atividade não encontrada.' });
    }

    if (atividadeExistente.usuario_id !== usuarioId && usuarioTipo !== 'administrador') {
      return res.status(403).json({ error: 'Sem permissão para editar esta atividade.' });
    }

    const atividadeAtualizada = await prisma.atividade.update({
      where: { id: parseInt(atividadeId) },
      data: {
        titulo,
        materia,
        conteudo,
        ordem: parseInt(ordem)
      }
    });

    res.status(200).json(atividadeAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar atividade:', error);
    res.status(500).json({ error: 'Erro ao atualizar atividade.' });
  }
};

// Deletar Atividade
export const deletarAtividade = async (req, res) => {
  const { atividadeId } = req.params;
  
  // ✅ CORRIGIDO: Usa req.user do Passport
  const usuarioId = req.user.id;
  const usuarioTipo = req.user.tipo;

  try {
    const atividade = await prisma.atividade.findUnique({
      where: { id: parseInt(atividadeId) },
      select: { usuario_id: true }
    });

    if (!atividade) {
      return res.status(404).json({ error: 'Atividade não encontrada.' });
    }

    if (atividade.usuario_id !== usuarioId && usuarioTipo !== 'administrador') {
      return res.status(403).json({ error: 'Sem permissão para deletar esta atividade.' });
    }

    await prisma.atividade.delete({
      where: { id: parseInt(atividadeId) }
    });

    res.status(200).json({ message: 'Atividade deletada com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar atividade:', error);
    res.status(500).json({ error: 'Erro ao deletar atividade.' });
  }
};