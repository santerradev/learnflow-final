// file: controllers/progressoController.js
import { PrismaClient } from '@prisma/client';
import { criarNotificacao } from './notificacaoController.js';

const prisma = new PrismaClient();

class ProgressoController {

  // ========================================
  // MARCAR AULA COMO CONCLUÍDA
  // ========================================
  static async marcarAulaConcluida(req, res) {
    try {
      const { aula_id } = req.params;
      const usuario_id = req.user.id;

      // Buscar aula e verificar inscrição
      const aula = await prisma.aula.findUnique({
        where: { id: parseInt(aula_id) },
        include: {
          lista: {
            include: {
              curso: {
                select: { id: true, titulo: true }
              }
            }
          }
        }
      });

      if (!aula) {
        return res.status(404).json({ 
          success: false, 
          message: 'Aula não encontrada' 
        });
      }

      const curso_id = aula.lista.curso.id;

      const inscricao = await prisma.inscricao.findUnique({
        where: {
          usuario_id_curso_id: {
            usuario_id,
            curso_id
          }
        }
      });

      if (!inscricao || inscricao.status !== 'aprovada') {
        return res.status(403).json({ 
          success: false, 
          message: 'Você não está inscrito neste curso' 
        });
      }

      // Verificar se já está concluída
      const progressoExistente = await prisma.progresso.findUnique({
        where: {
          inscricao_id_aula_id: {
            inscricao_id: inscricao.id,
            aula_id: parseInt(aula_id)
          }
        }
      });

      if (progressoExistente) {
        return res.json({ 
          success: true, 
          message: 'Aula já estava concluída',
          jaConcluida: true
        });
      }

      // Marcar como concluída
      await prisma.progresso.create({
        data: {
          inscricao_id: inscricao.id,
          aula_id: parseInt(aula_id),
          concluida: true
        }
      });

      // Calcular novo progresso
      const progresso = await this.calcularProgresso(inscricao.id, curso_id);

      res.json({ 
        success: true, 
        message: 'Aula marcada como concluída!',
        progresso
      });

    } catch (error) {
      console.error('Erro ao marcar aula:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao marcar aula como concluída' 
      });
    }
  }

  // ========================================
  // MARCAR ATIVIDADE COMO CONCLUÍDA
  // ========================================
  static async marcarAtividadeConcluida(req, res) {
    try {
      const { atividade_id } = req.params;
      const { pontuacao } = req.body;
      const usuario_id = req.user.id;

      // Buscar atividade
      const atividade = await prisma.atividade.findUnique({
        where: { id: parseInt(atividade_id) },
        include: {
          lista: {
            include: {
              curso: {
                select: { id: true, titulo: true }
              }
            }
          }
        }
      });

      if (!atividade) {
        return res.status(404).json({ 
          success: false, 
          message: 'Atividade não encontrada' 
        });
      }

      const curso_id = atividade.lista.curso.id;

      const inscricao = await prisma.inscricao.findUnique({
        where: {
          usuario_id_curso_id: {
            usuario_id,
            curso_id
          }
        }
      });

      if (!inscricao || inscricao.status !== 'aprovada') {
        return res.status(403).json({ 
          success: false, 
          message: 'Você não está inscrito neste curso' 
        });
      }

      // Verificar se já está concluída
      const progressoExistente = await prisma.progresso.findUnique({
        where: {
          inscricao_id_atividade_id: {
            inscricao_id: inscricao.id,
            atividade_id: parseInt(atividade_id)
          }
        }
      });

      if (progressoExistente) {
        // Atualizar pontuação se fornecida
        if (pontuacao !== undefined) {
          await prisma.progresso.update({
            where: {
              inscricao_id_atividade_id: {
                inscricao_id: inscricao.id,
                atividade_id: parseInt(atividade_id)
              }
            },
            data: { pontuacao_obtida: parseInt(pontuacao) }
          });

          return res.json({ 
            success: true, 
            message: 'Pontuação atualizada',
            atualizada: true
          });
        }

        return res.json({ 
          success: true, 
          message: 'Atividade já estava concluída',
          jaConcluida: true
        });
      }

      // Marcar como concluída
      await prisma.progresso.create({
        data: {
          inscricao_id: inscricao.id,
          atividade_id: parseInt(atividade_id),
          pontuacao_obtida: pontuacao ? parseInt(pontuacao) : null,
          concluida: true
        }
      });

      // Calcular novo progresso
      const progresso = await this.calcularProgresso(inscricao.id, curso_id);

      res.json({ 
        success: true, 
        message: 'Atividade marcada como concluída!',
        progresso
      });

    } catch (error) {
      console.error('Erro ao marcar atividade:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao marcar atividade como concluída' 
      });
    }
  }

  // ========================================
  // DESMARCAR CONCLUSÃO
  // ========================================
  static async desmarcarConclusao(req, res) {
    try {
      const { tipo, id } = req.params;
      const usuario_id = req.user.id;

      if (tipo !== 'aula' && tipo !== 'atividade') {
        return res.status(400).json({ 
          success: false, 
          message: 'Tipo inválido' 
        });
      }

      // Buscar progresso
      let where = {};
      if (tipo === 'aula') {
        where = {
          aula_id: parseInt(id),
          inscricao: { usuario_id }
        };
      } else {
        where = {
          atividade_id: parseInt(id),
          inscricao: { usuario_id }
        };
      }

      await prisma.progresso.deleteMany({ where });

      res.json({ 
        success: true, 
        message: 'Conclusão desmarcada' 
      });

    } catch (error) {
      console.error('Erro ao desmarcar:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao desmarcar conclusão' 
      });
    }
  }

  // ========================================
  // OBTER PROGRESSO DO CURSO
  // ========================================
  static async obterProgresso(req, res) {
    try {
      const { curso_id } = req.params;
      const usuario_id = req.user.id;

      const inscricao = await prisma.inscricao.findUnique({
        where: {
          usuario_id_curso_id: {
            usuario_id,
            curso_id: parseInt(curso_id)
          }
        }
      });

      if (!inscricao) {
        return res.json({ 
          success: false, 
          message: 'Você não está inscrito neste curso',
          progresso: 0
        });
      }

      const progresso = await this.calcularProgresso(inscricao.id, parseInt(curso_id));

      res.json({ 
        success: true, 
        progresso 
      });

    } catch (error) {
      console.error('Erro ao obter progresso:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao obter progresso' 
      });
    }
  }

  // ========================================
  // RELATÓRIO DE PROGRESSO DETALHADO
  // ========================================
  static async relatorioProgresso(req, res) {
    try {
      const { curso_id } = req.params;
      const usuario_id = req.user.id;

      const inscricao = await prisma.inscricao.findUnique({
        where: {
          usuario_id_curso_id: {
            usuario_id,
            curso_id: parseInt(curso_id)
          }
        },
        include: {
          progresso: {
            include: {
              aula: {
                select: { id: true, titulo: true, materia: true }
              },
              atividade: {
                select: { id: true, titulo: true, materia: true }
              }
            }
          },
          curso: {
            include: {
              listas: {
                include: {
                  aulas: true,
                  atividades: true
                }
              }
            }
          }
        }
      });

      if (!inscricao) {
        return res.status(404).json({ 
          success: false, 
          message: 'Inscrição não encontrada' 
        });
      }

      // Organizar dados
      const aulasCompletas = inscricao.progresso
        .filter(p => p.aula_id)
        .map(p => p.aula);

      const atividadesCompletas = inscricao.progresso
        .filter(p => p.atividade_id)
        .map(p => ({
          ...p.atividade,
          pontuacao: p.pontuacao_obtida
        }));

      const totalAulas = inscricao.curso.listas.reduce(
        (acc, lista) => acc + lista.aulas.length, 0
      );

      const totalAtividades = inscricao.curso.listas.reduce(
        (acc, lista) => acc + lista.atividades.length, 0
      );

      const percentualAulas = totalAulas > 0 
        ? Math.round((aulasCompletas.length / totalAulas) * 100) 
        : 0;

      const percentualAtividades = totalAtividades > 0 
        ? Math.round((atividadesCompletas.length / totalAtividades) * 100) 
        : 0;

      res.json({
        success: true,
        relatorio: {
          aulasCompletas,
          atividadesCompletas,
          totalAulas,
          totalAtividades,
          percentualAulas,
          percentualAtividades,
          progressoGeral: await this.calcularProgresso(inscricao.id, parseInt(curso_id))
        }
      });

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao gerar relatório' 
      });
    }
  }

  // ========================================
  // HELPER: CALCULAR PROGRESSO DO CURSO
  // ========================================
  static async calcularProgresso(inscricao_id, curso_id) {
    try {
      // Total de conteúdo (aulas + atividades)
      const totalConteudo = await prisma.$queryRaw`
        SELECT COUNT(*) as total FROM (
          SELECT id FROM Aula WHERE lista_id IN (
            SELECT id FROM Lista WHERE curso_id = ${curso_id}
          )
          UNION ALL
          SELECT id FROM Atividade WHERE lista_id IN (
            SELECT id FROM Lista WHERE curso_id = ${curso_id}
          )
        ) as conteudos
      `;

      // Total concluído
      const concluidosCount = await prisma.progresso.count({
        where: {
          inscricao_id,
          concluida: true
        }
      });

      const total = Number(totalConteudo[0]?.total || 0);
      const progresso = total > 0 ? Math.round((concluidosCount / total) * 100) : 0;

      // Se completou 100%, notificar
      if (progresso === 100) {
        const inscricao = await prisma.inscricao.findUnique({
          where: { id: inscricao_id },
          include: {
            curso: { select: { titulo: true } }
          }
        });

        await criarNotificacao({
          usuario_id: inscricao.usuario_id,
          tipo: 'geral',
          titulo: '🎉 Parabéns!',
          mensagem: `Você completou 100% do curso "${inscricao.curso.titulo}"!`,
          link: `/curso/${curso_id}`,
          curso_id
        });
      }

      return progresso;

    } catch (error) {
      console.error('Erro ao calcular progresso:', error);
      return 0;
    }
  }
}

export default ProgressoController;