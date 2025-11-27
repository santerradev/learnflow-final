// file: controllers/inscricaoController.js
import { PrismaClient } from '@prisma/client';
import { criarNotificacao } from './notificacaoController.js';

const prisma = new PrismaClient();

class InscricaoController {

  // ========================================
  // INSCREVER-SE EM UM CURSO
  // ========================================
  static async inscrever(req, res) {
    try {
      const { curso_id } = req.params;
      const { senha } = req.body;
      const usuario_id = req.user.id;

      // Buscar curso
      const curso = await prisma.curso.findUnique({
        where: { id: parseInt(curso_id) },
        include: {
          professor: {
            select: { id: true, nome: true }
          }
        }
      });

      if (!curso) {
        return res.status(404).json({ 
          success: false, 
          message: 'Curso não encontrado' 
        });
      }

      // Verificar se já está inscrito
      const inscricaoExistente = await prisma.inscricao.findUnique({
        where: {
          usuario_id_curso_id: {
            usuario_id,
            curso_id: parseInt(curso_id)
          }
        }
      });

      if (inscricaoExistente) {
        let mensagem = 'Você já está inscrito neste curso';
        if (inscricaoExistente.status === 'pendente') {
          mensagem = 'Sua inscrição está pendente de aprovação';
        } else if (inscricaoExistente.status === 'rejeitada') {
          mensagem = 'Sua inscrição foi rejeitada anteriormente';
        }
        return res.status(400).json({ 
          success: false, 
          message: mensagem
        });
      }

      // Validar senha de acesso se o curso tiver
      if (curso.senha_acesso) {
        if (!senha) {
          return res.status(400).json({ 
            success: false, 
            message: 'Este curso requer senha de acesso',
            requerSenha: true
          });
        }

        if (senha !== curso.senha_acesso) {
          return res.status(400).json({ 
            success: false, 
            message: 'Senha de acesso incorreta'
          });
        }
      }

      // Criar inscrição (aprovada automaticamente)
      const inscricao = await prisma.inscricao.create({
        data: {
          usuario_id,
          curso_id: parseInt(curso_id),
          status: 'aprovada'
        }
      });

      // Notificar o aluno
      await criarNotificacao({
        usuario_id,
        tipo: 'novo_curso',
        titulo: '✅ Inscrição Confirmada',
        mensagem: `Você foi inscrito no curso "${curso.titulo}"`,
        link: `/curso/${curso_id}`,
        curso_id: curso.id
      });

      // Notificar o professor
      await criarNotificacao({
        usuario_id: curso.usuario_id,
        tipo: 'geral',
        titulo: '👥 Nova Inscrição',
        mensagem: `${req.user.nome} se inscreveu no curso "${curso.titulo}"`,
        link: `/curso/${curso_id}?aba=pessoas`,
        curso_id: curso.id
      });

      res.json({ 
        success: true, 
        message: 'Inscrição realizada com sucesso!',
        inscricao
      });

    } catch (error) {
      console.error('Erro ao inscrever:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao realizar inscrição' 
      });
    }
  }

  // ========================================
  // CANCELAR INSCRIÇÃO
  // ========================================
  static async cancelarInscricao(req, res) {
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
          curso: {
            select: { id: true, titulo: true, usuario_id: true }
          }
        }
      });

      if (!inscricao) {
        return res.status(404).json({ 
          success: false, 
          message: 'Inscrição não encontrada' 
        });
      }

      // Deletar inscrição (cascata deleta progresso também)
      await prisma.inscricao.delete({
        where: {
          usuario_id_curso_id: {
            usuario_id,
            curso_id: parseInt(curso_id)
          }
        }
      });

      // Notificar professor
      await criarNotificacao({
        usuario_id: inscricao.curso.usuario_id,
        tipo: 'geral',
        titulo: '👋 Aluno Saiu do Curso',
        mensagem: `${req.user.nome} cancelou a inscrição em "${inscricao.curso.titulo}"`,
        link: `/curso/${curso_id}?aba=pessoas`,
        curso_id: inscricao.curso.id
      });

      res.json({ 
        success: true, 
        message: 'Inscrição cancelada com sucesso!' 
      });

    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao cancelar inscrição' 
      });
    }
  }

  // ========================================
  // LISTAR INSCRIÇÕES DE UM CURSO (Professor/Admin)
  // ========================================
  static async listarInscricoes(req, res) {
    try {
      const { curso_id } = req.params;
      const usuario_id = req.user.id;

      // Verificar permissão
      const curso = await prisma.curso.findUnique({
        where: { id: parseInt(curso_id) },
        select: { usuario_id: true }
      });

      if (!curso) {
        return res.status(404).json({ 
          success: false, 
          message: 'Curso não encontrado' 
        });
      }

      const eDono = curso.usuario_id === usuario_id;
      const eAdmin = req.user.tipo === 'administrador';

      if (!eDono && !eAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Sem permissão para visualizar inscrições' 
        });
      }

      // Buscar inscrições
      const inscricoes = await prisma.inscricao.findMany({
        where: { curso_id: parseInt(curso_id) },
        include: {
          aluno: {
            select: {
              id: true,
              nome: true,
              email: true,
              foto_perfil: true,
              instituicao: true
            }
          },
          progresso: {
            select: {
              concluida: true
            }
          }
        },
        orderBy: { data_inscricao: 'desc' }
      });

      // Calcular progresso de cada aluno
      const inscricoesComProgresso = inscricoes.map(inscricao => {
        const totalConcluido = inscricao.progresso.filter(p => p.concluida).length;
        return {
          ...inscricao,
          totalConcluido
        };
      });

      res.json({ 
        success: true, 
        inscricoes: inscricoesComProgresso
      });

    } catch (error) {
      console.error('Erro ao listar inscrições:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao carregar inscrições' 
      });
    }
  }

  // ========================================
  // REMOVER ALUNO DO CURSO (Professor/Admin)
  // ========================================
  static async removerAluno(req, res) {
    try {
      const { curso_id, aluno_id } = req.params;
      const usuario_id = req.user.id;

      // Verificar permissão
      const curso = await prisma.curso.findUnique({
        where: { id: parseInt(curso_id) },
        select: { id: true, titulo: true, usuario_id: true }
      });

      if (!curso) {
        return res.status(404).json({ 
          success: false, 
          message: 'Curso não encontrado' 
        });
      }

      const eDono = curso.usuario_id === usuario_id;
      const eAdmin = req.user.tipo === 'administrador';

      if (!eDono && !eAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Sem permissão para remover alunos' 
        });
      }

      // Buscar inscrição
      const inscricao = await prisma.inscricao.findUnique({
        where: {
          usuario_id_curso_id: {
            usuario_id: parseInt(aluno_id),
            curso_id: parseInt(curso_id)
          }
        },
        include: {
          aluno: {
            select: { nome: true }
          }
        }
      });

      if (!inscricao) {
        return res.status(404).json({ 
          success: false, 
          message: 'Inscrição não encontrada' 
        });
      }

      // Remover inscrição
      await prisma.inscricao.delete({
        where: {
          usuario_id_curso_id: {
            usuario_id: parseInt(aluno_id),
            curso_id: parseInt(curso_id)
          }
        }
      });

      // Notificar aluno
      await criarNotificacao({
        usuario_id: parseInt(aluno_id),
        tipo: 'geral',
        titulo: '⚠️ Removido do Curso',
        mensagem: `Você foi removido do curso "${curso.titulo}"`,
        link: '/cursos'
      });

      res.json({ 
        success: true, 
        message: `${inscricao.aluno.nome} foi removido do curso` 
      });

    } catch (error) {
      console.error('Erro ao remover aluno:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao remover aluno' 
      });
    }
  }

  // ========================================
  // MINHAS INSCRIÇÕES (Aluno)
  // ========================================
  static async minhasInscricoes(req, res) {
    try {
      const usuario_id = req.user.id;

      const inscricoes = await prisma.inscricao.findMany({
        where: { 
          usuario_id,
          status: 'aprovada'
        },
        include: {
          curso: {
            include: {
              professor: {
                select: { id: true, nome: true, foto_perfil: true }
              },
              _count: {
                select: { inscricoes: true }
              }
            }
          },
          progresso: {
            select: { concluida: true }
          }
        },
        orderBy: { data_inscricao: 'desc' }
      });

      // Calcular progresso de cada curso
      const inscricoesComProgresso = await Promise.all(
        inscricoes.map(async (inscricao) => {
          // Total de conteúdo do curso
          const totalConteudo = await prisma.$queryRaw`
            SELECT COUNT(*) as total FROM (
              SELECT id FROM Aula WHERE lista_id IN (
                SELECT id FROM Lista WHERE curso_id = ${inscricao.curso.id}
              )
              UNION ALL
              SELECT id FROM Atividade WHERE lista_id IN (
                SELECT id FROM Lista WHERE curso_id = ${inscricao.curso.id}
              )
            ) as conteudos
          `;

          const total = Number(totalConteudo[0]?.total || 0);
          const concluidos = inscricao.progresso.filter(p => p.concluida).length;
          const progresso = total > 0 ? Math.round((concluidos / total) * 100) : 0;

          return {
            ...inscricao,
            progresso
          };
        })
      );

      res.json({ 
        success: true, 
        inscricoes: inscricoesComProgresso
      });

    } catch (error) {
      console.error('Erro ao listar minhas inscrições:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao carregar inscrições' 
      });
    }
  }

  // ========================================
  // VERIFICAR STATUS DE INSCRIÇÃO
  // ========================================
  static async verificarInscricao(req, res) {
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
        select: {
          id: true,
          status: true,
          data_inscricao: true
        }
      });

      if (!inscricao) {
        return res.json({ 
          success: true, 
          inscrito: false,
          status: null
        });
      }

      res.json({ 
        success: true, 
        inscrito: true,
        status: inscricao.status,
        data_inscricao: inscricao.data_inscricao
      });

    } catch (error) {
      console.error('Erro ao verificar inscrição:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao verificar inscrição' 
      });
    }
  }

  // ========================================
  // ESTATÍSTICAS DE INSCRIÇÕES (Professor/Admin)
  // ========================================
  static async estatisticasInscricoes(req, res) {
    try {
      const { curso_id } = req.params;
      const usuario_id = req.user.id;

      // Verificar permissão
      const curso = await prisma.curso.findUnique({
        where: { id: parseInt(curso_id) },
        select: { usuario_id: true }
      });

      if (!curso) {
        return res.status(404).json({ 
          success: false, 
          message: 'Curso não encontrado' 
        });
      }

      const eDono = curso.usuario_id === usuario_id;
      const eAdmin = req.user.tipo === 'administrador';

      if (!eDono && !eAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Sem permissão' 
        });
      }

      // Estatísticas
      const [totalInscritos, aprovadas, pendentes, rejeitadas, porInstituicao] = await Promise.all([
        prisma.inscricao.count({
          where: { curso_id: parseInt(curso_id) }
        }),
        prisma.inscricao.count({
          where: { 
            curso_id: parseInt(curso_id),
            status: 'aprovada'
          }
        }),
        prisma.inscricao.count({
          where: { 
            curso_id: parseInt(curso_id),
            status: 'pendente'
          }
        }),
        prisma.inscricao.count({
          where: { 
            curso_id: parseInt(curso_id),
            status: 'rejeitada'
          }
        }),
        prisma.inscricao.groupBy({
          by: ['curso_id'],
          where: { curso_id: parseInt(curso_id) },
          _count: true
        })
      ]);

      res.json({ 
        success: true, 
        estatisticas: {
          totalInscritos,
          aprovadas,
          pendentes,
          rejeitadas
        }
      });

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao buscar estatísticas' 
      });
    }
  }

  // ========================================
  // EXPORTAR LISTA DE ALUNOS (CSV)
  // ========================================
  static async exportarAlunos(req, res) {
    try {
      const { curso_id } = req.params;
      const usuario_id = req.user.id;

      // Verificar permissão
      const curso = await prisma.curso.findUnique({
        where: { id: parseInt(curso_id) },
        select: { titulo: true, usuario_id: true }
      });

      if (!curso) {
        return res.status(404).json({ 
          success: false, 
          message: 'Curso não encontrado' 
        });
      }

      const eDono = curso.usuario_id === usuario_id;
      const eAdmin = req.user.tipo === 'administrador';

      if (!eDono && !eAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Sem permissão' 
        });
      }

      // Buscar inscrições
      const inscricoes = await prisma.inscricao.findMany({
        where: { 
          curso_id: parseInt(curso_id),
          status: 'aprovada'
        },
        include: {
          aluno: {
            select: {
              nome: true,
              email: true,
              instituicao: true
            }
          }
        },
        orderBy: { data_inscricao: 'asc' }
      });

      // Gerar CSV
      let csv = 'Nome,Email,Instituição,Data de Inscrição\n';
      inscricoes.forEach(inscricao => {
        csv += `${inscricao.aluno.nome},${inscricao.aluno.email},${inscricao.aluno.instituicao},${new Date(inscricao.data_inscricao).toLocaleDateString('pt-BR')}\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="alunos-${curso.titulo.replace(/\s+/g, '-')}.csv"`);
      res.send('\uFEFF' + csv); // BOM para UTF-8

    } catch (error) {
      console.error('Erro ao exportar alunos:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao exportar lista' 
      });
    }
  }
}

export default InscricaoController;