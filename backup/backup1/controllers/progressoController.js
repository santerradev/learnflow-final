// file: controllers/progressoController.js
import prisma from '../config/prisma.js';

// Este controller implementa o novo schema relacional de progresso [cite: 719, 736]

// Marcar Aula como Concluída (Aluno)
export const concluirAula = async (req, res) => {
  const { aulaId } = req.params;
  const alunoId = req.session.usuario.id;

  try {
    // 1. Encontrar a inscrição do aluno para o curso desta aula
    const aula = await prisma.aula.findUnique({ where: { id: parseInt(aulaId) }, select: { curso_id: true } });
    if (!aula) return res.status(404).json({ error: 'Aula não encontrada.' });

    const inscricao = await prisma.inscricao.findUnique({
      where: {
        usuario_id_curso_id: {
          usuario_id: alunoId,
          curso_id: aula.curso_id,
        },
      },
      select: { id: true },
    });
    if (!inscricao) return res.status(403).json({ error: 'Aluno não inscrito neste curso.' });

    // 2. Criar o registro de progresso
    const progresso = await prisma.progresso.create({
      data: {
        inscricao_id: inscricao.id,
        aula_id: parseInt(aulaId),
        concluida: true,
      },
    });
    res.status(201).json(progresso);
  } catch (error) {
    if (error.code === 'P2002') { // Já concluiu
      return res.status(409).json({ error: 'Aula já marcada como concluída.' });
    }
    res.status(500).json({ error: 'Erro ao marcar aula como concluída.' });
  }
};

// ... (Implementar lógica similar para 'submeterAtividade'
// que salva o progresso com 'atividade_id' e 'pontuacao_obtida')