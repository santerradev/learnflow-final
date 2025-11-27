// file: controllers/authController.js
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { criarNotificacao } from './notificacaoController.js';

const prisma = new PrismaClient();

class AuthController {

  // ========================================
  // RENDERIZAR PÁGINA DE LOGIN
  // ========================================
  static renderLogin(req, res) {
    if (req.isAuthenticated()) {
      return res.redirect('/inicio');
    }
    res.render('forms/login', { 
      pageTitle: 'Login',
      error: req.flash('error'),
      success: req.flash('success')
    });
  }

  // ========================================
  // PROCESSAR LOGIN (Passport cuida disso)
  // ========================================
  static processarLogin(req, res) {
    // Passport já autenticou o usuário em req.user
    req.flash('success', `Bem-vindo(a), ${req.user.nome}!`);
    
    // Redirecionar baseado no tipo de usuário
    if (req.user.tipo === 'administrador') {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/inicio');
    }
  }

  // ========================================
  // RENDERIZAR PÁGINA DE CADASTRO
  // ========================================
  static renderCadastro(req, res) {
    if (req.isAuthenticated()) {
      return res.redirect('/inicio');
    }
    res.render('forms/cadastro', { 
      pageTitle: 'Cadastro',
      error: req.flash('error')
    });
  }

  // ========================================
  // PROCESSAR CADASTRO
  // ========================================
  static async processarCadastro(req, res) {
    try {
      const { nome, email, senha, confirmar_senha, tipo, instituicao } = req.body;

      // Validação de senha
      if (senha !== confirmar_senha) {
        req.flash('error', 'As senhas não coincidem.');
        return res.redirect('/auth/cadastro');
      }

      // Validar força da senha
      const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!senhaRegex.test(senha)) {
        req.flash('error', 'Senha deve ter 8+ caracteres, maiúscula, número e símbolo.');
        return res.redirect('/auth/cadastro');
      }

      // Verificar se email já existe
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { email }
      });

      if (usuarioExistente) {
        req.flash('error', 'Este email já está cadastrado.');
        return res.redirect('/auth/cadastro');
      }

      // Hash da senha
      const senhaHash = await bcrypt.hash(senha, 10);

      // Foto de perfil
      let foto_perfil = null;
      if (req.file) {
        foto_perfil = req.file.filename;
      }

      // Criar solicitação de cadastro
      await prisma.solicitacao.create({
        data: {
          nome,
          email,
          senha_hash: senhaHash,
          foto_perfil,
          instituicao: instituicao || 'IFSUL_Gravatai',
          tipo,
          status: 'pendente'
        }
      });

      // Notificar administradores sobre nova solicitação
      const admins = await prisma.usuario.findMany({
        where: { tipo: 'administrador' },
        select: { id: true }
      });

      for (const admin of admins) {
        await criarNotificacao({
          usuario_id: admin.id,
          tipo: 'geral',
          titulo: '👤 Nova Solicitação de Cadastro',
          mensagem: `${nome} solicitou cadastro como ${tipo}`,
          link: '/admin/solicitacoes'
        });
      }

      req.flash('success', 'Solicitação enviada! Aguarde aprovação.');
      res.redirect('/auth/login');

    } catch (error) {
      console.error('Erro no cadastro:', error);
      req.flash('error', 'Erro ao processar cadastro.');
      res.redirect('/auth/cadastro');
    }
  }

  // ========================================
  // LOGOUT
  // ========================================
  static logout(req, res, next) {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      req.flash('success', 'Logout realizado com sucesso!');
      res.redirect('/auth/login');
    });
  }
}

export default AuthController;