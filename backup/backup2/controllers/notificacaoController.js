// controllers/notificacaoController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
          tipo,
          titulo,
          mensagem,
          link,
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
      const usuario_id = req.session.usuario.id;
      const { limite = 50 } = req.query;

      const notificacoes = await prisma.notificacao.findMany({
        where: { usuario_id },
        include: {
          curso: {
            select: { id: true, titulo: true }
          }
        },
        orderBy: { criado_em: 'desc' },
        take: parseInt(limite)
      });

      res.json({ 
        success: true, 
        notificacoes,
        total: notificacoes.length
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
      const usuario_id = req.session.usuario.id;

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
      const usuario_id = req.session.usuario.id;

      const notificacao = await prisma.notificacao.updateMany({
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
      const usuario_id = req.session.usuario.id;

      await prisma.notificacao.updateMany({
        where: { 
          usuario_id,
          lida: false 
        },
        data: { lida: true }
      });

      res.json({ 
        success: true, 
        message: 'Todas notificações marcadas como lidas' 
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
      const usuario_id = req.session.usuario.id;

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
      const usuario_id = req.session.usuario.id;

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
      const usuario_id = req.session.usuario.id;

      const notificacoes = await prisma.notificacao.findMany({
        where: { usuario_id },
        include: {
          curso: {
            select: { id: true, titulo: true }
          }
        },
        orderBy: { criado_em: 'desc' }
      });

      const naoLidas = notificacoes.filter(n => !n.lida).length;

      res.render('notificacoes', {
        usuario: req.session.usuario,
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
// HELPER: CRIAR NOTIFICAÇÃO AUTOMÁTICA
// ========================================
async function criarNotificacao(dados) {
  try {
    await prisma.notificacao.create({
      data: {
        usuario_id: dados.usuario_id,
        tipo: dados.tipo || 'info',
        titulo: dados.titulo,
        mensagem: dados.mensagem,
        link: dados.link || null,
        curso_id: dados.curso_id || null,
        lida: false
      }
    });
  } catch (error) {
    console.error('Erro ao criar notificação automática:', error);
  }
}

// ========================================
// NOTIFICAR TODOS OS INSCRITOS DE UM CURSO
// ========================================
async function notificarInscritosCurso(curso_id, dados) {
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
        tipo: dados.tipo || 'curso',
        titulo: dados.titulo,
        mensagem: dados.mensagem,
        link: dados.link || `/curso/${curso_id}`,
        curso_id
      })
    );

    await Promise.all(promises);
    
  } catch (error) {
    console.error('Erro ao notificar inscritos:', error);
  }
}

module.exports = {
  NotificacaoController,
  criarNotificacao,
  notificarInscritosCurso
};