// file: controllers/atividadeController.js
import { PrismaClient } from '@prisma/client';
import { notificarInscritosCurso } from './notificacaoController.js';

const prisma = new PrismaClient();

class AtividadeController {

  // ========================================
  // CRIAR ATIVIDADE
  // ========================================
  static async criarAtividade(req, res) {
    try {
      const { titulo, materia, conteudo, ordem, lista_id, prazo } = req.body;
      const usuario_id = req.user.id;

      // Validações
      if (!titulo || !materia || !conteudo) {
        return res.status(400).json({ 
          success: false, 
          message: 'Título, matéria e conteúdo são obrigatórios' 
        });
      }

      // Validar JSON do conteúdo
      let conteudoJSON;
      try {
        conteudoJSON = typeof conteudo === 'string' ? JSON.parse(conteudo) : conteudo;
      } catch (error) {
        return res.status(400).json({ 
          success: false, 
          message: 'Conteúdo deve ser um JSON válido' 
        });
      }

      // Verificar se a lista pertence a um curso do professor
      const lista = await prisma.lista.findUnique({
        where: { id: parseInt(lista_id) },
        include: {
          curso: {
            select: { id: true, titulo: true, usuario_id: true }
          }
        }
      });

      if (!lista) {
        return res.status(404).json({ 
          success: false, 
          message: 'Lista não encontrada' 
        });
      }

      const eDono = lista.curso.usuario_id === usuario_id;
      const eAdmin = req.user.tipo === 'administrador';

      if (!eDono && !eAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Sem permissão para criar atividades neste curso' 
        });
      }

      // Determinar ordem automática se não fornecida
      let ordemFinal = ordem ? parseInt(ordem) : null;
      if (!ordemFinal) {
        const ultimaAtividade = await prisma.atividade.findFirst({
          where: { lista_id: parseInt(lista_id) },
          orderBy: { ordem: 'desc' }
        });
        ordemFinal = ultimaAtividade ? ultimaAtividade.ordem + 1 : 1;
      }

      // Criar atividade
      const atividade = await prisma.atividade.create({
        data: {
          titulo,
          materia,
          conteudo: conteudoJSON,
          ordem: ordemFinal,
          lista_id: parseInt(lista_id),
          usuario_id,
          prazo: prazo ? new Date(prazo) : null
        }
      });

      // Notificar todos os inscritos do curso
      await notificarInscritosCurso(lista.curso.id, {
        tipo: 'nova_atividade',
        titulo: `📝 Nova Atividade: ${titulo}`,
        mensagem: `Uma nova atividade foi adicionada em "${lista.curso.titulo}"${prazo ? ` - Prazo: ${new Date(prazo).toLocaleDateString('pt-BR')}` : ''}`,
        link: `/curso/${lista.curso.id}?aba=atividades`
      });

      res.json({ 
        success: true, 
        message: 'Atividade criada com sucesso!',
        atividade
      });

    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao criar atividade' 
      });
    }
  }

  // ========================================
  // LISTAR ATIVIDADES DE UMA LISTA
  // ========================================
  static async listarAtividades(req, res) {
    try {
      const { lista_id } = req.params;

      const atividades = await prisma.atividade.findMany({
        where: { lista_id: parseInt(lista_id) },
        include: {
          professor: {
            select: { id: true, nome: true, foto_perfil: true }
          },
          _count: {
            select: { progressos: true }
          }
        },
        orderBy: { ordem: 'asc' }
      });

      // Se for aluno, verificar quais atividades já foram concluídas
      let progressos = [];
      if (req.user.tipo === 'aluno') {
        const lista = await prisma.lista.findUnique({
          where: { id: parseInt(lista_id) },
          select: { curso_id: true }
        });

        const inscricao = await prisma.inscricao.findUnique({
          where: {
            usuario_id_curso_id: {
              usuario_id: req.user.id,
              curso_id: lista.curso_id
            }
          }
        });

        if (inscricao) {
          progressos = await prisma.progresso.findMany({
            where: {
              inscricao_id: inscricao.id,
              atividade_id: { not: null }
            },
            select: { 
              atividade_id: true, 
              concluida: true,
              pontuacao_obtida: true 
            }
          });
        }
      }

      // Adicionar informação de conclusão e pontuação
      const atividadesComProgresso = atividades.map(atividade => {
        const progresso = progressos.find(p => p.atividade_id === atividade.id);
        return {
          ...atividade,
          concluida: progresso ? progresso.concluida : false,
          pontuacao_obtida: progresso ? progresso.pontuacao_obtida : null
        };
      });

      res.json({ 
        success: true, 
        atividades: atividadesComProgresso
      });

    } catch (error) {
      console.error('Erro ao listar atividades:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao carregar atividades' 
      });
    }
  }

  // ========================================
  // DETALHES DA ATIVIDADE
  // ========================================
  static async detalhesAtividade(req, res) {
    try {
      const { id } = req.params;

      const atividade = await prisma.atividade.findUnique({
        where: { id: parseInt(id) },
        include: {
          professor: {
            select: { id: true, nome: true, foto_perfil: true }
          },
          lista: {
            include: {
              curso: {
                select: { id: true, titulo: true, usuario_id: true }
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

      // Verificar se está inscrito no curso
      const inscricao = await prisma.inscricao.findUnique({
        where: {
          usuario_id_curso_id: {
            usuario_id: req.user.id,
            curso_id: atividade.lista.curso.id
          }
        }
      });

      const eDono = atividade.lista.curso.usuario_id === req.user.id;
      const eAdmin = req.user.tipo === 'administrador';
      const estaInscrito = inscricao && inscricao.status === 'aprovada';

      if (!estaInscrito && !eDono && !eAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Você precisa estar inscrito neste curso' 
        });
      }

      // Verificar se já foi concluída
      let concluida = false;
      let pontuacao_obtida = null;
      if (inscricao) {
        const progresso = await prisma.progresso.findUnique({
          where: {
            inscricao_id_atividade_id: {
              inscricao_id: inscricao.id,
              atividade_id: parseInt(id)
            }
          }
        });
        if (progresso) {
          concluida = progresso.concluida;
          pontuacao_obtida = progresso.pontuacao_obtida;
        }
      }

      res.json({ 
        success: true, 
        atividade: {
          ...atividade,
          concluida,
          pontuacao_obtida
        }
      });

    } catch (error) {
      console.error('Erro ao carregar atividade:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao carregar atividade' 
      });
    }
  }

  // ========================================
  // VISUALIZAR ATIVIDADE (Renderizar página)
  // ========================================
  static async visualizarAtividade(req, res) {
    try {
      const { id } = req.params;

      const atividade = await prisma.atividade.findUnique({
        where: { id: parseInt(id) },
        include: {
          professor: {
            select: { id: true, nome: true, foto_perfil: true }
          },
          lista: {
            include: {
              curso: {
                select: { id: true, titulo: true, usuario_id: true }
              },
              atividades: {
                orderBy: { ordem: 'asc' },
                select: { id: true, titulo: true, ordem: true }
              }
            }
          }
        }
      });

      if (!atividade) {
        req.flash('error', 'Atividade não encontrada.');
        return res.redirect('/cursos');
      }

      // Verificar permissões
      const inscricao = await prisma.inscricao.findUnique({
        where: {
          usuario_id_curso_id: {
            usuario_id: req.user.id,
            curso_id: atividade.lista.curso.id
          }
        }
      });

      const eDono = atividade.lista.curso.usuario_id === req.user.id;
      const eAdmin = req.user.tipo === 'administrador';
      const estaInscrito = inscricao && inscricao.status === 'aprovada';

      if (!estaInscrito && !eDono && !eAdmin) {
        req.flash('error', 'Você precisa estar inscrito neste curso.');
        return res.redirect(`/curso/${atividade.lista.curso.id}`);
      }

      // Verificar conclusão
      let concluida = false;
      let pontuacao_obtida = null;
      if (inscricao) {
        const progresso = await prisma.progresso.findUnique({
          where: {
            inscricao_id_atividade_id: {
              inscricao_id: inscricao.id,
              atividade_id: parseInt(id)
            }
          }
        });
        if (progresso) {
          concluida = progresso.concluida;
          pontuacao_obtida = progresso.pontuacao_obtida;
        }
      }

      // Próxima e anterior
      const atividadeAtualIndex = atividade.lista.atividades.findIndex(a => a.id === atividade.id);
      const proximaAtividade = atividade.lista.atividades[atividadeAtualIndex + 1] || null;
      const atividadeAnterior = atividade.lista.atividades[atividadeAtualIndex - 1] || null;

      // Verificar se está atrasada
      const agora = new Date();
      const estaAtrasada = atividade.prazo && new Date(atividade.prazo) < agora && !concluida;

      res.render('plataforma/visualizar_atividade', {
        usuario: req.user,
        atividade,
        concluida,
        pontuacao_obtida,
        estaAtrasada,
        proximaAtividade,
        atividadeAnterior,
        pageTitle: atividade.titulo
      });

    } catch (error) {
      console.error('Erro ao visualizar atividade:', error);
      res.status(500).send('Erro ao carregar atividade');
    }
  }

  // ========================================
  // EDITAR ATIVIDADE
  // ========================================
  static async editarAtividade(req, res) {
    try {
      const { id } = req.params;
      const { titulo, materia, conteudo, ordem, prazo } = req.body;
      const usuario_id = req.user.id;

      const atividade = await prisma.atividade.findUnique({
        where: { id: parseInt(id) },
        include: {
          lista: {
            include: {
              curso: { select: { usuario_id: true } }
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

      const eDono = atividade.lista.curso.usuario_id === usuario_id;
      const eAdmin = req.user.tipo === 'administrador';

      if (!eDono && !eAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Sem permissão para editar esta atividade' 
        });
      }

      // Validar JSON do conteúdo
      let conteudoJSON;
      try {
        conteudoJSON = typeof conteudo === 'string' ? JSON.parse(conteudo) : conteudo;
      } catch (error) {
        return res.status(400).json({ 
          success: false, 
          message: 'Conteúdo deve ser um JSON válido' 
        });
      }

      await prisma.atividade.update({
        where: { id: parseInt(id) },
        data: {
          titulo,
          materia,
          conteudo: conteudoJSON,
          ordem: ordem ? parseInt(ordem) : atividade.ordem,
          prazo: prazo ? new Date(prazo) : null
        }
      });

      res.json({ 
        success: true, 
        message: 'Atividade atualizada com sucesso!' 
      });

    } catch (error) {
      console.error('Erro ao editar atividade:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao editar atividade' 
      });
    }
  }

  // ========================================
  // DELETAR ATIVIDADE
  // ========================================
  static async deletarAtividade(req, res) {
    try {
      const { id } = req.params;
      const usuario_id = req.user.id;

      const atividade = await prisma.atividade.findUnique({
        where: { id: parseInt(id) },
        include: {
          lista: {
            include: {
              curso: { 
                select: { id: true, titulo: true, usuario_id: true } 
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

      const eDono = atividade.lista.curso.usuario_id === usuario_id;
      const eAdmin = req.user.tipo === 'administrador';

      if (!eDono && !eAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Sem permissão para deletar esta atividade' 
        });
      }

      // Notificar inscritos
      await notificarInscritosCurso(atividade.lista.curso.id, {
        tipo: 'geral',
        titulo: '🗑️ Atividade Removida',
        mensagem: `A atividade "${atividade.titulo}" foi removida de "${atividade.lista.curso.titulo}"`,
        link: `/curso/${atividade.lista.curso.id}?aba=atividades`
      });

      await prisma.atividade.delete({
        where: { id: parseInt(id) }
      });

      res.json({ 
        success: true, 
        message: 'Atividade deletada com sucesso!' 
      });

    } catch (error) {
      console.error('Erro ao deletar atividade:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao deletar atividade' 
      });
    }
  }

  // ========================================
  // REORDENAR ATIVIDADES
  // ========================================
  static async reordenarAtividades(req, res) {
    try {
      const { lista_id } = req.params;
      const { atividades } = req.body; // Array: [{ id: 1, ordem: 1 }, { id: 2, ordem: 2 }]

      if (!Array.isArray(atividades)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Formato inválido' 
        });
      }

      // Verificar permissão
      const lista = await prisma.lista.findUnique({
        where: { id: parseInt(lista_id) },
        include: {
          curso: { select: { usuario_id: true } }
        }
      });

      const eDono = lista.curso.usuario_id === req.user.id;
      const eAdmin = req.user.tipo === 'administrador';

      if (!eDono && !eAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Sem permissão' 
        });
      }

      // Atualizar ordem de cada atividade
      const promises = atividades.map(atividade =>
        prisma.atividade.update({
          where: { id: parseInt(atividade.id) },
          data: { ordem: parseInt(atividade.ordem) }
        })
      );

      await Promise.all(promises);

      res.json({ 
        success: true, 
        message: 'Ordem das atividades atualizada!' 
      });

    } catch (error) {
      console.error('Erro ao reordenar atividades:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao reordenar atividades' 
      });
    }
  }

  // ========================================
  // SUBMETER RESPOSTA (Para alunos)
  // ========================================
  static async submeterResposta(req, res) {
    try {
      const { id } = req.params;
      const { respostas, pontuacao } = req.body;
      const usuario_id = req.user.id;

      const atividade = await prisma.atividade.findUnique({
        where: { id: parseInt(id) },
        include: {
          lista: {
            include: {
              curso: { select: { id: true } }
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

      const inscricao = await prisma.inscricao.findUnique({
        where: {
          usuario_id_curso_id: {
            usuario_id,
            curso_id: atividade.lista.curso.id
          }
        }
      });

      if (!inscricao || inscricao.status !== 'aprovada') {
        return res.status(403).json({ 
          success: false, 
          message: 'Você não está inscrito neste curso' 
        });
      }

      // Salvar ou atualizar progresso
      await prisma.progresso.upsert({
        where: {
          inscricao_id_atividade_id: {
            inscricao_id: inscricao.id,
            atividade_id: parseInt(id)
          }
        },
        update: {
          pontuacao_obtida: pontuacao ? parseInt(pontuacao) : null,
          concluida: true
        },
        create: {
          inscricao_id: inscricao.id,
          atividade_id: parseInt(id),
          pontuacao_obtida: pontuacao ? parseInt(pontuacao) : null,
          concluida: true
        }
      });

      res.json({ 
        success: true, 
        message: 'Resposta submetida com sucesso!',
        pontuacao: pontuacao || null
      });

    } catch (error) {
      console.error('Erro ao submeter resposta:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao submeter resposta' 
      });
    }
  }
}

export default AtividadeController;