// file: controllers/aulaController.js
import prisma from '../config/prisma.js';

// ✅ CORRIGIDO: Todas as referências agora usam req.user

// Criar Aula (Professor/Admin)
export const criarAula = async (req, res) => {
  const { cursoId } = req.params;
  const { titulo, materia, descricao, ordem } = req.body;
  
  // ✅ CORRIGIDO: Usa req.user do Passport
  const professorId = req.user.id;

  // Lógica para obter os nomes dos arquivos do uploadAula
  if (!req.files || !req.files.capa_aula || !req.files.video) {
    return res.status(400).json({ 
      error: 'É obrigatório enviar a capa da aula e o vídeo.' 
    });
  }

  const capa_aula = req.files.capa_aula[0].filename;
  const video = req.files.video[0].filename;

  try {
    // Checagem de posse
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

    const aula = await prisma.aula.create({
      data: {
        titulo,
        materia,
        descricao,
        capa_aula,
        video,
        ordem: parseInt(ordem),
        curso_id: parseInt(cursoId),
        usuario_id: professorId,
      },
    });

    res.status(201).json(aula);
  } catch (error) {
    console.error('Erro ao criar aula:', error);
    res.status(500).json({ error: 'Erro ao criar aula.' });
  }
};

// Listar Aulas de um Curso
export const listarAulas = async (req, res) => {
  const { cursoId } = req.params;

  try {
    const aulas = await prisma.aula.findMany({
      where: { curso_id: parseInt(cursoId) },
      orderBy: { ordem: 'asc' },
      select: {
        id: true,
        titulo: true,
        materia: true,
        descricao: true,
        capa_aula: true,
        ordem: true,
      }
    });

    res.status(200).json(aulas);
  } catch (error) {
    console.error('Erro ao listar aulas:', error);
    res.status(500).json({ error: 'Erro ao buscar aulas.' });
  }
};

// Buscar Detalhes de uma Aula
export const buscarAula = async (req, res) => {
  const { aulaId } = req.params;

  try {
    const aula = await prisma.aula.findUnique({
      where: { id: parseInt(aulaId) },
      include: {
        curso: {
          select: { titulo: true }
        },
        professor: {
          select: { nome: true, foto_perfil: true }
        }
      }
    });

    if (!aula) {
      return res.status(404).json({ error: 'Aula não encontrada.' });
    }

    res.status(200).json(aula);
  } catch (error) {
    console.error('Erro ao buscar aula:', error);
    res.status(500).json({ error: 'Erro ao buscar aula.' });
  }
};

// Atualizar Aula
export const atualizarAula = async (req, res) => {
  const { aulaId } = req.params;
  const { titulo, materia, descricao, ordem } = req.body;
  
  // ✅ CORRIGIDO: Usa req.user do Passport
  const usuarioId = req.user.id;
  const usuarioTipo = req.user.tipo;

  try {
    const aulaExistente = await prisma.aula.findUnique({
      where: { id: parseInt(aulaId) },
      select: { usuario_id: true, curso_id: true }
    });

    if (!aulaExistente) {
      return res.status(404).json({ error: 'Aula não encontrada.' });
    }

    // Verificar permissão
    if (aulaExistente.usuario_id !== usuarioId && usuarioTipo !== 'administrador') {
      return res.status(403).json({ error: 'Sem permissão para editar esta aula.' });
    }

    const dadosAtualizacao = {
      titulo,
      materia,
      descricao,
      ordem: parseInt(ordem)
    };

    // TODO: Adicionar lógica para atualizar capa_aula e video se enviados

    const aulaAtualizada = await prisma.aula.update({
      where: { id: parseInt(aulaId) },
      data: dadosAtualizacao
    });

    res.status(200).json(aulaAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar aula:', error);
    res.status(500).json({ error: 'Erro ao atualizar aula.' });
  }
};

// Deletar Aula
export const deletarAula = async (req, res) => {
  const { aulaId } = req.params;
  
  // ✅ CORRIGIDO: Usa req.user do Passport
  const usuarioId = req.user.id;
  const usuarioTipo = req.user.tipo;

  try {
    const aula = await prisma.aula.findUnique({
      where: { id: parseInt(aulaId) },
      select: { usuario_id: true, capa_aula: true, video: true }
    });

    if (!aula) {
      return res.status(404).json({ error: 'Aula não encontrada.' });
    }

    if (aula.usuario_id !== usuarioId && usuarioTipo !== 'administrador') {
      return res.status(403).json({ error: 'Sem permissão para deletar esta aula.' });
    }

    await prisma.aula.delete({
      where: { id: parseInt(aulaId) }
    });

    // TODO: Adicionar lógica para deletar arquivos (capa_aula e video) do servidor

    res.status(200).json({ message: 'Aula deletada com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar aula:', error);
    res.status(500).json({ error: 'Erro ao deletar aula.' });
  }
};