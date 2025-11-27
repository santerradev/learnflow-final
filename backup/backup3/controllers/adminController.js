// file: controllers/adminController.js
import { PrismaClient } from '@prisma/client';
import { criarNotificacao } from './notificacaoController.js';

const prisma = new PrismaClient();

class AdminController {

  // ========================================
  // DASHBOARD ADMIN
  // ========================================
  static async renderDashboard(req, res) {
    try {
      const [
        totalUsuarios,
        totalCursos,
        totalSolicitacoes,
        solicitacoesPendentes
      ] = await Promise.all([
        prisma.usuario.count(),
        prisma.curso.count(),
        prisma.solicitacao.count(),
        prisma.solicitacao.count({ where: { status: 'pendente' } })
      ]);

      res.render('admin/dashboard', {
        usuario: req.user,
        totalUsuarios,
        totalCursos,
        totalSolicitacoes,
        solicitacoesPendentes,
        pageTitle: 'Dashboard Admin'
      });

    } catch (error) {
      console.error('Erro ao carregar dashboard admin:', error);
      res.status(500).send('Erro ao carregar dashboard');
    }
  }

  // ========================================
  // LISTAR SOLICITAÇÕES
  // ========================================
  static async listarSolicitacoes(req, res) {
    try {
      const solicitacoes = await prisma.solicitacao.findMany({
        orderBy: { data_solicitacao: 'desc' }
      });

      res.render('admin/solicitacoes', {
        usuario: req.user,
        solicitacoes,
        pageTitle: 'Solicitações de Cadastro'
      });

    } catch (error) {
      console.error('Erro ao listar solicitações:', error);
      res.status(500).send('Erro ao carregar solicitações');
    }
  }

  // ========================================
  // APROVAR SOLICITAÇÃO
  // ========================================
  static async aprovarSolicitacao(req, res) {
    try {
      const { id } = req.params;

      const solicitacao = await prisma.solicitacao.findUnique({
        where: { id: parseInt(id) }
      });

      if (!solicitacao) {
        req.flash('error', 'Solicitação não encontrada.');
        return res.redirect('/admin/solicitacoes');
      }

      if (solicitacao.status !== 'pendente') {
        req.flash('error', 'Solicitação já foi processada.');
        return res.redirect('/admin/solicitacoes');
      }

      // Criar usuário
      const novoUsuario = await prisma.usuario.create({
        data: {
          nome: solicitacao.nome,
          email: solicitacao.email,
          senha: solicitacao.senha_hash,
          foto_perfil: solicitacao.foto_perfil,
          instituicao: solicitacao.instituicao,
          tipo: solicitacao.tipo,
          status: 'ativo'
        }
      });

      // Atualizar status da solicitação
      await prisma.solicitacao.update({
        where: { id: parseInt(id) },
        data: { status: 'aprovada' }
      });

      // Notificar usuário sobre aprovação
      await criarNotificacao({
        usuario_id: novoUsuario.id,
        tipo: 'geral',
        titulo: '✅ Cadastro Aprovado!',
        mensagem: `Bem-vindo(a) à plataforma! Seu cadastro como ${solicitacao.tipo} foi aprovado.`,
        link: '/inicio'
      });

      req.flash('success', `Solicitação de ${solicitacao.nome} aprovada!`);
      res.redirect('/admin/solicitacoes');

    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      req.flash('error', 'Erro ao aprovar solicitação.');
      res.redirect('/admin/solicitacoes');
    }
  }

  // ========================================
  // REJEITAR SOLICITAÇÃO
  // ========================================
  static async rejeitarSolicitacao(req, res) {
    try {
      const { id } = req.params;

      const solicitacao = await prisma.solicitacao.findUnique({
        where: { id: parseInt(id) }
      });

      if (!solicitacao) {
        req.flash('error', 'Solicitação não encontrada.');
        return res.redirect('/admin/solicitacoes');
      }

      // Atualizar status
      await prisma.solicitacao.update({
        where: { id: parseInt(id) },
        data: { status: 'rejeitada' }
      });

      req.flash('success', `Solicitação de ${solicitacao.nome} rejeitada.`);
      res.redirect('/admin/solicitacoes');

    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      req.flash('error', 'Erro ao rejeitar solicitação.');
      res.redirect('/admin/solicitacoes');
    }
  }

  // ========================================
  // LISTAR TODOS OS USUÁRIOS
  // ========================================
  static async listarUsuarios(req, res) {
    try {
      const usuarios = await prisma.usuario.findMany({
        orderBy: { data_cadastro: 'desc' }
      });

      res.render('admin/usuarios', {
        usuario: req.user,
        usuarios,
        pageTitle: 'Gerenciar Usuários'
      });

    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).send('Erro ao carregar usuários');
    }
  }

  // ========================================
  // DESATIVAR/ATIVAR USUÁRIO
  // ========================================
  static async toggleStatusUsuario(req, res) {
    try {
      const { id } = req.params;

      const usuario = await prisma.usuario.findUnique({
        where: { id: parseInt(id) }
      });

      if (!usuario) {
        return res.json({ success: false, message: 'Usuário não encontrado' });
      }

      // Não permitir desativar a si mesmo
      if (usuario.id === req.user.id) {
        return res.json({ success: false, message: 'Você não pode desativar sua própria conta' });
      }

      const novoStatus = usuario.status === 'ativo' ? 'inativo' : 'ativo';

      await prisma.usuario.update({
        where: { id: parseInt(id) },
        data: { status: novoStatus }
      });

      // Notificar usuário
      await criarNotificacao({
        usuario_id: usuario.id,
        tipo: 'geral',
        titulo: novoStatus === 'ativo' ? '✅ Conta Reativada' : '⚠️ Conta Desativada',
        mensagem: `Sua conta foi ${novoStatus === 'ativo' ? 'reativada' : 'desativada'} por um administrador.`,
        link: '/inicio'
      });

      res.json({ 
        success: true, 
        message: `Usuário ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso`,
        novoStatus
      });

    } catch (error) {
      console.error('Erro ao alterar status:', error);
      res.json({ success: false, message: 'Erro ao alterar status' });
    }
  }

  // ========================================
  // LISTAR TODOS OS CURSOS
  // ========================================
  static async listarCursos(req, res) {
    try {
      const cursos = await prisma.curso.findMany({
        include: {
          professor: {
            select: { nome: true, email: true }
          },
          _count: {
            select: { inscricoes: true }
          }
        },
        orderBy: { id: 'desc' }
      });

      res.render('admin/cursos', {
        usuario: req.user,
        cursos,
        pageTitle: 'Gerenciar Cursos'
      });

    } catch (error) {
      console.error('Erro ao listar cursos:', error);
      res.status(500).send('Erro ao carregar cursos');
    }
  }

  // ========================================
  // DELETAR CURSO
  // ========================================
  static async deletarCurso(req, res) {
    try {
      const { id } = req.params;

      const curso = await prisma.curso.findUnique({
        where: { id: parseInt(id) },
        include: {
          inscricoes: {
            select: { usuario_id: true }
          }
        }
      });

      if (!curso) {
        return res.json({ success: false, message: 'Curso não encontrado' });
      }

      // Notificar alunos inscritos
      for (const inscricao of curso.inscricoes) {
        await criarNotificacao({
          usuario_id: inscricao.usuario_id,
          tipo: 'geral',
          titulo: '⚠️ Curso Removido',
          mensagem: `O curso "${curso.titulo}" foi removido da plataforma.`,
          link: '/inicio'
        });
      }

      // Deletar curso
      await prisma.curso.delete({
        where: { id: parseInt(id) }
      });

      res.json({ 
        success: true, 
        message: 'Curso deletado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao deletar curso:', error);
      res.json({ success: false, message: 'Erro ao deletar curso' });
    }
  }
}

export default AdminController;