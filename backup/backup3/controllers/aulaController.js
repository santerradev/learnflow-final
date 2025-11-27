// file: controllers/aulaController.js
import { PrismaClient } from '@prisma/client';
import { notificarInscritosCurso } from './notificacaoController.js';

const prisma = new PrismaClient();

class AulaController {

  // ========================================
  // CRIAR AULA
  // ========================================
  static async criarAula(req, res) {
    try {
      const { titulo, materia, descricao, ordem, lista_id, prazo } = req.body;
      const usuario_id = req.user.id;

      // Validações
      if (!titulo || !materia || !descricao) {
        return res.status(400).json({ 
          success: false, 
          message: 'Título, matéria e descrição são obrigatórios' 
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
          message: 'Sem permissão para criar aulas neste curso' 
        });
      }

      // Processar arquivos (capa e vídeo)
      let capa_aula = 'default-aula.jpg';
      let video = null;

      if (req.files) {
        if (req.files.capa_aula) {
          capa_aula = req.files.capa_aula[0].filename;
        }
        if (req.files.video) {
          video = req.files.video[0].filename;
        }
      }

      if (!video) {
        return res.status(400).json({ 
          success: false, 
          message: 'Vídeo da aula é obrigatório' 
        });
      }

      // Determinar ordem automática se não fornecida
      let ordemFinal = ordem ? parseInt(ordem) : null;
      if (!ordemFinal) {
        const ultimaAula = await prisma.aula.findFirst({
          where: { lista_id: parseInt(lista_id) },
          orderBy: { ordem: 'desc' }
        });
        ordemFinal = ultimaAula ? ultimaAula.ordem + 1 : 1;
      }

      // Criar aula
      const aula = await prisma.aula.create({
        data: {
          titulo,
          materia,
          descricao,
          capa_aula,
          video,
          ordem: ordemFinal,
          lista_id: parseInt(lista_id),
          usuario_id,
          prazo: prazo ? new Date(prazo) : null
        }
      });

      // Notificar todos os inscritos do curso
      await notificarInscritosCurso(lista.curso.id, {
        tipo: 'nova_aula',
        titulo: `📚 Nova Aula: ${titulo}`,
        mensagem: `Uma nova aula foi adicionada em "${lista.curso.titulo}"`,
        link: `/curso/${lista.curso.id}?aba=aulas`
      });

      res.json({ 
        success: true, 
        message: 'Aula criada com sucesso!',
        aula
      });

    } catch (error) {
      console.error('Erro ao criar aula:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao criar aula' 
      });
    }
  }

  // ========================================
  // LISTAR AULAS DE UMA LISTA
  // ========================================
  static async listarAulas(req, res) {
    try {
      const { lista_id } = req.params;

      const aulas = await prisma.aula.findMany({
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

      // Se for aluno, verificar quais aulas já foram concluídas
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
              aula_id: { not: null }
            },
            select: { aula_id: true, concluida: true }
          });
        }
      }

      // Adicionar informação de conclusão nas aulas
      const aulasComProgresso = aulas.map(aula => ({
        ...aula,
        concluida: progressos.some(p => p.aula_id === aula.id && p.concluida)
      }));

      res.json({ 
        success: true, 
        aulas: aulasComProgresso
      });

    } catch (error) {
      console.error('Erro ao listar aulas:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao carregar aulas' 
      });
    }
  }

  // ========================================
  // DETALHES DA AULA
  // ========================================
  static async detalhesAula(req, res) {
    try {
      const { id } = req.params;

      const aula = await prisma.aula.findUnique({
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

      if (!aula) {
        return res.status(404).json({ 
          success: false, 
          message: 'Aula não encontrada' 
        });
      }

      // Verificar se está inscrito no curso
      const inscricao = await prisma.inscricao.findUnique({
        where: {
          usuario_id_curso_id: {
            usuario_id: req.user.id,
            curso_id: aula.lista.curso.id
          }
        }
      });

      const eDono = aula.lista.curso.usuario_id === req.user.id;
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
      if (inscricao) {
        const progresso = await prisma.progresso.findUnique({
          where: {
            inscricao_id_aula_id: {
              inscricao_id: inscricao.id,
              aula_id: parseInt(id)
            }
          }
        });
        concluida = progresso ? progresso.concluida : false;
      }

      res.json({ 
        success: true, 
        aula: {
          ...aula,
          concluida
        }
      });

    } catch (error) {
      console.error('Erro ao carregar aula:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao carregar aula' 
      });
    }
  }

  // ========================================
  // VISUALIZAR AULA (Renderizar página)
  // ========================================
  static async visualizarAula(req, res) {
    try {
      const { id } = req.params;

      const aula = await prisma.aula.findUnique({
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
              aulas: {
                orderBy: { ordem: 'asc' },
                select: { id: true, titulo: true, ordem: true }
              }
            }
          }
        }
      });

      if (!aula) {
        req.flash('error', 'Aula não encontrada.');
        return res.redirect('/cursos');
      }

      // Verificar permissões
      const inscricao = await prisma.inscricao.findUnique({
        where: {
          usuario_id_curso_id: {
            usuario_id: req.user.id,
            curso_id: aula.lista.curso.id
          }
        }
      });

      const eDono = aula.lista.curso.usuario_id === req.user.id;
      const eAdmin = req.user.tipo === 'administrador';
      const estaInscrito = inscricao && inscricao.status === 'aprovada';

      if (!estaInscrito && !eDono && !eAdmin) {
        req.flash('error', 'Você precisa estar inscrito neste curso.');
        return res.redirect(`/curso/${aula.lista.curso.id}`);
      }

      // Verificar conclusão
      let concluida = false;
      if (inscricao) {
        const progresso = await prisma.progresso.findUnique({
          where: {
            inscricao_id_aula_id: {
              inscricao_id: inscricao.id,
              aula_id: parseInt(id)
            }
          }
        });
        concluida = progresso ? progresso.concluida : false;
      }

      // Próxima e anterior aulas
      const aulaAtualIndex = aula.lista.aulas.findIndex(a => a.id === aula.id);
      const proximaAula = aula.lista.aulas[aulaAtualIndex + 1] || null;
      const aulaAnterior = aula.lista.aulas[aulaAtualIndex - 1] || null;

      res.render('plataforma/visualizar_aula', {
        usuario: req.user,
        aula,
        concluida,
        proximaAula,
        aulaAnterior,
        pageTitle: aula.titulo
      });

    } catch (error) {
      console.error('Erro ao visualizar aula:', error);
      res.status(500).send('Erro ao carregar aula');
    }
  }

  // ========================================
  // EDITAR AULA
  // ========================================
  static async editarAula(req, res) {
    try {
      const { id } = req.params;
      const { titulo, materia, descricao, ordem, prazo } = req.body;
      const usuario_id = req.user.id;

      const aula = await prisma.aula.findUnique({
        where: { id: parseInt(id) },
        include: {
          lista: {
            include: {
              curso: { select: { usuario_id: true } }
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

      const eDono = aula.lista.curso.usuario_id === usuario_id;
      const eAdmin = req.user.tipo === 'administrador';

      if (!eDono && !eAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Sem permissão para editar esta aula' 
        });
      }

      // Processar novos arquivos se enviados
      let capa_aula = aula.capa_aula;
      let video = aula.video;

      if (req.files) {
        if (req.files.capa_aula) {
          capa_aula = req.files.capa_aula[0].filename;
        }
        if (req.files.video) {
          video = req.files.video[0].filename;
        }
      }

      await prisma.aula.update({
        where: { id: parseInt(id) },
        data: {
          titulo,
          materia,
          descricao,
          capa_aula,
          video,
          ordem: ordem ? parseInt(ordem) : aula.ordem,
          prazo: prazo ? new Date(prazo) : null
        }
      });

      res.json({ 
        success: true, 
        message: 'Aula atualizada com sucesso!' 
      });

    } catch (error) {
      console.error('Erro ao editar aula:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao editar aula' 
      });
    }
  }

  // ========================================
  // DELETAR AULA
  // ========================================
  static async deletarAula(req, res) {
    try {
      const { id } = req.params;
      const usuario_id = req.user.id;

      const aula = await prisma.aula.findUnique({
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

      if (!aula) {
        return res.status(404).json({ 
          success: false, 
          message: 'Aula não encontrada' 
        });
      }

      const eDono = aula.lista.curso.usuario_id === usuario_id;
      const eAdmin = req.user.tipo === 'administrador';

      if (!eDono && !eAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Sem permissão para deletar esta aula' 
        });
      }

      // Notificar inscritos
      await notificarInscritosCurso(aula.lista.curso.id, {
        tipo: 'geral',
        titulo: '🗑️ Aula Removida',
        mensagem: `A aula "${aula.titulo}" foi removida de "${aula.lista.curso.titulo}"`,
        link: `/curso/${aula.lista.curso.id}?aba=aulas`
      });

      await prisma.aula.delete({
        where: { id: parseInt(id) }
      });

      res.json({ 
        success: true, 
        message: 'Aula deletada com sucesso!' 
      });

    } catch (error) {
      console.error('Erro ao deletar aula:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao deletar aula' 
      });
    }
  }

  // ========================================
  // REORDENAR AULAS
  // ========================================
  static async reordenarAulas(req, res) {
    try {
      const { lista_id } = req.params;
      const { aulas } = req.body; // Array: [{ id: 1, ordem: 1 }, { id: 2, ordem: 2 }]

      if (!Array.isArray(aulas)) {
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

      // Atualizar ordem de cada aula
      const promises = aulas.map(aula =>
        prisma.aula.update({
          where: { id: parseInt(aula.id) },
          data: { ordem: parseInt(aula.ordem) }
        })
      );

      await Promise.all(promises);

      res.json({ 
        success: true, 
        message: 'Ordem das aulas atualizada!' 
      });

    } catch (error) {
      console.error('Erro ao reordenar aulas:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao reordenar aulas' 
      });
    }
  }
}

export default AulaController;