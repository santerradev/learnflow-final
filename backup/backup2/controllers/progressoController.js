// file: controllers/progressoController.js
import prisma from '../config/prisma.js';

// ✅ CORRIGIDO: Todas as referências agora usam req.user

// Marcar Aula como Concluída (Aluno)
export const concluirAula = async (req, res) => {
  const { aulaId } = req.params;
  
  // ✅ CORRIGIDO: Usa req.user do Passport
  const alunoId = req.user.id;

  try {
    // 1. Encontrar a inscrição do aluno para o curso desta aula
    const aula = await prisma.aula.findUnique({ 
      where: { id: parseInt(aulaId) }, 
      select: { curso_id: true } 
    });

    if (!aula) {
      return res.status(404).json({ error: 'Aula não encontrada.' });
    }

    const inscricao = await prisma.inscricao.findUnique({
      where: {
        usuario_id_curso_id: {
          usuario_id: alunoId,
          curso_id: aula.curso_id,
        },
      },
      select: { id: true },
    });

    if (!inscricao) {
      return res.status(403).json({ 
        error: 'Aluno não inscrito neste curso.' 
      });
    }

    // 2. Criar o registro de progresso
    const progresso = await prisma.progresso.create({
      data: {
        inscricao_id: inscricao.id,
        aula_id: parseInt(aulaId),
        concluida: true,
      },
    });

    res.status(201).json({ 
      message: 'Aula marcada como concluída!',
      progresso 
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Aula já marcada como concluída.' 
      });
    }
    console.error('Erro ao marcar aula como concluída:', error);
    res.status(500).json({ error: 'Erro ao marcar aula como concluída.' });
  }
};

// Submeter Respostas de Atividade (Aluno)
export const submeterAtividade = async (req, res) => {
  const { atividadeId } = req.params;
  const { respostas } = req.body; // Array de respostas do aluno
  
  // ✅ CORRIGIDO: Usa req.user do Passport
  const alunoId = req.user.id;

  try {
    // 1. Buscar a atividade e suas respostas corretas
    const atividade = await prisma.atividade.findUnique({
      where: { id: parseInt(atividadeId) },
      select: { 
        curso_id: true, 
        conteudo: true // JSON com perguntas e respostas corretas
      }
    });

    if (!atividade) {
      return res.status(404).json({ error: 'Atividade não encontrada.' });
    }

    // 2. Verificar se o aluno está inscrito no curso
    const inscricao = await prisma.inscricao.findUnique({
      where: {
        usuario_id_curso_id: {
          usuario_id: alunoId,
          curso_id: atividade.curso_id,
        },
      },
      select: { id: true },
    });

    if (!inscricao) {
      return res.status(403).json({ 
        error: 'Aluno não inscrito neste curso.' 
      });
    }

    // 3. Calcular pontuação
    // Assumindo que conteudo é um array: [{ pergunta, opcoes, respostaCorreta }]
    let pontuacaoObtida = 0;
    const totalPerguntas = atividade.conteudo.length;

    atividade.conteudo.forEach((pergunta, index) => {
      if (respostas[index] === pergunta.respostaCorreta) {
        pontuacaoObtida++;
      }
    });

    // Converter para porcentagem (0-100)
    const pontuacaoPercentual = Math.round((pontuacaoObtida / totalPerguntas) * 100);

    // 4. Criar o registro de progresso
    const progresso = await prisma.progresso.create({
      data: {
        inscricao_id: inscricao.id,
        atividade_id: parseInt(atividadeId),
        pontuacao_obtida: pontuacaoPercentual,
        concluida: true,
      },
    });

    res.status(201).json({ 
      message: 'Atividade concluída!',
      pontuacao: pontuacaoPercentual,
      acertos: pontuacaoObtida,
      total: totalPerguntas,
      progresso 
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Atividade já foi submetida.' 
      });
    }
    console.error('Erro ao submeter atividade:', error);
    res.status(500).json({ error: 'Erro ao submeter atividade.' });
  }
};

// Buscar Progresso do Aluno em um Curso
export const buscarProgressoCurso = async (req, res) => {
  const { cursoId } = req.params;
  
  // ✅ CORRIGIDO: Usa req.user do Passport
  const alunoId = req.user.id;

  try {
    const inscricao = await prisma.inscricao.findUnique({
      where: {
        usuario_id_curso_id: {
          usuario_id: alunoId,
          curso_id: parseInt(cursoId),
        },
      },
      include: {
        progresso: {
          include: {
            aula: {
              select: { id: true, titulo: true, ordem: true }
            },
            atividade: {
              select: { id: true, titulo: true, ordem: true }
            }
          }
        }
      }
    });

    if (!inscricao) {
      return res.status(404).json({ 
        error: 'Aluno não inscrito neste curso.' 
      });
    }

    // Separar progresso de aulas e atividades
    const aulasCompletas = inscricao.progresso
      .filter(p => p.aula_id !== null)
      .map(p => ({
        aulaId: p.aula.id,
        titulo: p.aula.titulo,
        ordem: p.aula.ordem,
        dataConlusao: p.data_conclusao
      }));

    const atividadesCompletas = inscricao.progresso
      .filter(p => p.atividade_id !== null)
      .map(p => ({
        atividadeId: p.atividade.id,
        titulo: p.atividade.titulo,
        ordem: p.atividade.ordem,
        pontuacao: p.pontuacao_obtida,
        dataConclusao: p.data_conclusao
      }));

    res.status(200).json({
      cursoId: parseInt(cursoId),
      dataInscricao: inscricao.data_inscricao,
      aulasCompletas,
      atividadesCompletas
    });
  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    res.status(500).json({ error: 'Erro ao buscar progresso.' });
  }
};

// Listar Todo o Progresso do Aluno (Todos os Cursos)
export const listarTodoProgresso = async (req, res) => {
  // ✅ CORRIGIDO: Usa req.user do Passport
  const alunoId = req.user.id;

  try {
    const inscricoes = await prisma.inscricao.findMany({
      where: { usuario_id: alunoId },
      include: {
        curso: {
          select: { 
            id: true, 
            titulo: true, 
            capa_curso: true 
          }
        },
        progresso: {
          select: {
            aula_id: true,
            atividade_id: true,
            pontuacao_obtida: true,
            concluida: true
          }
        }
      }
    });

    const progressoGeral = inscricoes.map(inscricao => {
      const aulasCompletas = inscricao.progresso.filter(p => p.aula_id !== null).length;
      const atividadesCompletas = inscricao.progresso.filter(p => p.atividade_id !== null).length;
      
      const pontuacaoMedia = inscricao.progresso
        .filter(p => p.atividade_id !== null && p.pontuacao_obtida !== null)
        .reduce((acc, p, _, arr) => acc + p.pontuacao_obtida / arr.length, 0);

      return {
        curso: inscricao.curso,
        dataInscricao: inscricao.data_inscricao,
        aulasCompletas,
        atividadesCompletas,
        pontuacaoMedia: Math.round(pontuacaoMedia) || 0
      };
    });

    res.status(200).json(progressoGeral);
  } catch (error) {
    console.error('Erro ao listar progresso:', error);
    res.status(500).json({ error: 'Erro ao listar progresso.' });
  }
};