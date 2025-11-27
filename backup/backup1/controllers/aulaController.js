// file: controllers/aulaController.js
import prisma from '../config/prisma.js';

// Criar Aula (Professor/Admin)
export const criarAula = async (req, res) => {
  const { cursoId } = req.params;
  const { titulo, materia, descricao, ordem } = req.body;
  const professorId = req.session.usuario.id;

  // Lógica para obter os nomes dos arquivos do uploadAula
  const capa_aula = req.files.capa_aula[0].filename;
  const video = req.files.video[0].filename;

  try {
    // Checagem de posse (Opcional, mas boa prática)
    const curso = await prisma.curso.findUnique({ where: { id: parseInt(cursoId) } });
    if (curso.usuario_id !== professorId && req.session.usuario.tipo !== 'administrador') {
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
        usuario_id: professorId, // Professor criador [cite: 718]
      },
    });
    res.status(201).json(aula);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar aula.' });
  }
};

// ... (Implementar outros métodos CRUD para Aulas) ...