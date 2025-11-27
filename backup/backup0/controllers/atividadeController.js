// file: controllers/atividadeController.js
import prisma from '../config/prisma.js';

// Criar Atividade (Professor/Admin)
export const criarAtividade = async (req, res) => {
  const { cursoId } = req.params;
  // O 'conteudo' (JSON) deve ser enviado pelo frontend
  const { titulo, materia, conteudo, ordem } = req.body;
  const professorId = req.session.usuario.id;

  try {
    // (Adicionar checagem de posse do curso aqui)

    const atividade = await prisma.atividade.create({
      data: {
        titulo,
        materia,
        conteudo, // Prisma aceita o objeto JSON diretamente [cite: 718]
        ordem: parseInt(ordem),
        curso_id: parseInt(cursoId),
        usuario_id: professorId,
      },
    });
    res.status(201).json(atividade);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar atividade.' });
  }
};
// ... (Implementar outros métodos CRUD para Atividades) ...