// file: controllers/notificacaoController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ========================================
// CLASSE PRINCIPAL DO CONTROLLER
// ========================================
class NotificacaoController {
  
  // ========================================
  // CRIAR NOTIFICAÇÃO
  // ========================================
  static async criar(req, res) {
    try {
      const { usuario_id, tipo, titulo, mensagem, link, curso_id } = req.body;

      const notificacao = await prisma.notificacao.create({
        data: {
          usuario_id: parseInt(usuario_id),
          tipo: tipo || 'geral',
          titulo,
          mensagem,
          link: link || null,
          curso_id: curso_id ? parseInt(curso_id) : null,
          lida: false
        }
      });

      res.json({ 
        success: true, 
        message: 'Notificação criada',
        notificacao 
      });

    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao criar notificação' 
      });
    }
  }

  // ========================================
  // LISTAR NOTIFICAÇÕES DO USUÁRIO
  // ========================================
  static async listar(req, res) {
    try {
      const usuario_id = req.user.id;
      const { limite = 50, page = 1 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limite);

      const [notificacoes, total] = await Promise.all([
        prisma.notificacao.findMany({
          where: { usuario_id },
          include: {
            curso: {
              select: { id: true, titulo: true }
            }
          },
          orderBy: { data_criacao: 'desc' },
          skip,
          take: parseInt(limite)
        }),
        prisma.notificacao.count({ where: { usuario_id } })
      ]);

      res.json({ 
        success: true, 
        notificacoes,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limite))
      });

    } catch (error) {
      console.error('Erro ao listar notificações:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao carregar notificações' 
      });
    }
  }

  // ========================================
  // CONTAR NÃO LIDAS
  // ========================================
  static async contarNaoLidas(req, res) {
    try {
      const usuario_id = req.user.id;

      const count = await prisma.notificacao.count({
        where: { 
          usuario_id,
          lida: false 
        }
      });

      res.json({ 
        success: true, 
        count 
      });

    } catch (error) {
      console.error('Erro ao contar notificações:', error);
      res.status(500).json({ 
        success: false, 
        count: 0 
      });
    }
  }

  // ========================================
  // MARCAR COMO LIDA
  // ========================================
  static async marcarLida(req, res) {
    try {
      const { id } = req.params;
      const usuario_id = req.user.id;

      await prisma.notificacao.updateMany({
        where: { 
          id: parseInt(id),
          usuario_id 
        },
        data: { lida: true }
      });

      res.json({ 
        success: true, 
        message: 'Notificação marcada como lida' 
      });

    } catch (error) {
      console.error('Erro ao marcar notificação:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao marcar notificação' 
      });
    }
  }

  // ========================================
  // MARCAR TODAS COMO LIDAS
  // ========================================
  static async marcarTodasLidas(req, res) {
    try {
      const usuario_id = req.user.id;

      const result = await prisma.notificacao.updateMany({
        where: { 
          usuario_id,
          lida: false 
        },
        data: { lida: true }
      });

      res.json({ 
        success: true, 
        message: `${result.count} notificações marcadas como lidas`,
        count: result.count
      });

    } catch (error) {
      console.error('Erro ao marcar todas:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao marcar notificações' 
      });
    }
  }

  // ========================================
  // DELETAR NOTIFICAÇÃO
  // ========================================
  static async deletar(req, res) {
    try {
      const { id } = req.params;
      const usuario_id = req.user.id;

      await prisma.notificacao.deleteMany({
        where: { 
          id: parseInt(id),
          usuario_id 
        }
      });

      res.json({ 
        success: true, 
        message: 'Notificação deletada' 
      });

    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao deletar notificação' 
      });
    }
  }

  // ========================================
  // LIMPAR TODAS (DELETAR LIDAS)
  // ========================================
  static async limparLidas(req, res) {
    try {
      const usuario_id = req.user.id;

      const result = await prisma.notificacao.deleteMany({
        where: { 
          usuario_id,
          lida: true 
        }
      });

      res.json({ 
        success: true, 
        message: `${result.count} notificações removidas`,
        count: result.count
      });

    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao limpar notificações' 
      });
    }
  }

  // ========================================
  // VIEW - PÁGINA DE NOTIFICAÇÕES
  // ========================================
  static async viewNotificacoes(req, res) {
    try {
      const usuario_id = req.user.id;

      const notificacoes = await prisma.notificacao.findMany({
        where: { usuario_id },
        include: {
          curso: {
            select: { id: true, titulo: true }
          }
        },
        orderBy: { data_criacao: 'desc' }
      });

      const naoLidas = notificacoes.filter(n => !n.lida).length;

      res.render('notificacoes', {
        usuario: req.user,
        notificacoes,
        naoLidas,
        pageTitle: 'Notificações'
      });

    } catch (error) {
      console.error('Erro ao carregar view de notificações:', error);
      res.status(500).send('Erro ao carregar notificações');
    }
  }
}

// ========================================
// FUNÇÕES HELPER PARA CRIAR NOTIFICAÇÕES
// ========================================

/**
 * Cria uma notificação para um usuário específico
 * @param {Object} dados - { usuario_id, tipo, titulo, mensagem, link?, curso_id? }
 */
export async function criarNotificacao(dados) {
  try {
    await prisma.notificacao.create({
      data: {
        usuario_id: dados.usuario_id,
        tipo: dados.tipo || 'geral',
        titulo: dados.titulo,
        mensagem: dados.mensagem,
        link: dados.link || null,
        curso_id: dados.curso_id || null,
        lida: false
      }
    });
    console.log(`✅ Notificação criada para usuário ${dados.usuario_id}`);
  } catch (error) {
    console.error('❌ Erro ao criar notificação automática:', error);
  }
}

/**
 * Notifica todos os alunos inscritos em um curso
 * @param {Number} curso_id - ID do curso
 * @param {Object} dados - { tipo, titulo, mensagem, link? }
 */
export async function notificarInscritosCurso(curso_id, dados) {
  try {
    const inscritos = await prisma.inscricao.findMany({
      where: { 
        curso_id,
        status: 'aprovada'
      },
      select: { usuario_id: true }
    });

    const promises = inscritos.map(inscrito => 
      criarNotificacao({
        usuario_id: inscrito.usuario_id,
        tipo: dados.tipo || 'novo_curso',
        titulo: dados.titulo,
        mensagem: dados.mensagem,
        link: dados.link || `/curso/${curso_id}`,
        curso_id
      })
    );

    await Promise.all(promises);
    console.log(`✅ ${inscritos.length} alunos notificados no curso ${curso_id}`);
    
  } catch (error) {
    console.error('❌ Erro ao notificar inscritos do curso:', error);
  }
}

/**
 * Notifica sobre prazos próximos (para usar em cronjobs)
 */
export async function notificarPrazosProximos() {
  try {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(23, 59, 59, 999);

    // Buscar atividades com prazo para amanhã
    const atividades = await prisma.atividade.findMany({
      where: {
        prazo: {
          gte: new Date(),
          lte: amanha
        }
      },
      include: {
        lista: {
          include: {
            curso: {
              include: {
                inscricoes: {
                  where: { status: 'aprovada' },
                  select: { usuario_id: true }
                }
              }
            }
          }
        }
      }
    });

    for (const atividade of atividades) {
      const inscritos = atividade.lista.curso.inscricoes;
      
      for (const inscrito of inscritos) {
        await criarNotificacao({
          usuario_id: inscrito.usuario_id,
          tipo: 'prazo_proximo',
          titulo: '⏰ Prazo Próximo',
          mensagem: `A atividade "${atividade.titulo}" vence amanhã!`,
          link: `/curso/${atividade.lista.curso.id}?aba=atividades`,
          curso_id: atividade.lista.curso.id
        });
      }
    }

    console.log(`✅ Notificações de prazo enviadas`);

  } catch (error) {
    console.error('❌ Erro ao notificar prazos:', error);
  }
}

export default NotificacaoController;