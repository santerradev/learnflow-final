// file: controllers/authController.js
import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';

// --- Funções de Renderização ---

// Rota: GET /auth/login
export const renderLogin = (req, res) => {
  // Se o usuário já está logado, redireciona para o início
  if (req.session.usuario) {
    return res.redirect('/inicio');
  }
  res.render('forms/login', { error: null }); 
};

// Rota: GET /auth/cadastro
export const renderCadastro = (req, res) => {
  if (req.session.usuario) {
    return res.redirect('/inicio');
  }
  res.render('forms/cadastro', { error: null });
};

// --- Funções de Processamento ---

// Rota: POST /auth/cadastro
export const processarCadastro = async (req, res) => {
  const { nome, email, senha, tipo } = req.body;
  const foto_perfil = req.file?.filename;

  try {
    const senha_hash = await bcrypt.hash(senha, 10);

    if (tipo === 'aluno') {
      const usuario = await prisma.usuario.create({
        data: { 
          nome, 
          email, 
          senha: senha_hash, 
          foto_perfil, 
          tipo: 'aluno',
          status: 'ativo' // Define o status no cadastro
        },
      });
      res.redirect('/auth/login');
    } else if (tipo === 'professor') {
      const solicitacao = await prisma.solicitacao.create({
        data: { 
          nome, 
          email, 
          senha_hash: senha_hash, // Salva o hash
          foto_perfil, 
          status: 'pendente' 
        },
      });
      res.redirect('/auth/login?status=solicitacao_enviada');
    } else {
      res.render('forms/cadastro', { error: 'Tipo de usuário inválido.' });
    }
  } catch (error) {
    if (error.code === 'P2002') { // Erro de email duplicado
      return res.render('forms/cadastro', { error: 'Email já cadastrado.' });
    }
    console.error("ERRO NO CADASTRO:", error);
    res.render('forms/cadastro', { error: 'Erro ao processar cadastro.' });
  }
};

// Rota: POST /auth/login
export const processarLogin = async (req, res) => {
  const { email, senha } = req.body;
  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      return res.render('forms/login', { error: 'Usuário não encontrado.' });
    }

    if (usuario.status === 'inativo') {
        return res.render('forms/login', { error: 'Esta conta está inativa.' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.render('forms/login', { error: 'Senha incorreta.' });
    }

    // Salva dados essenciais na sessão
    req.session.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      foto_perfil: usuario.foto_perfil,
      tipo: usuario.tipo,
    };

    // Redireciona para o novo dashboard /inicio
    res.redirect('/inicio'); 

  } catch (error) {
    console.error("ERRO NO LOGIN:", error);
    res.render('forms/login', { error: 'Erro ao fazer login.' });
  }
};

// Rota: POST /auth/logout
export const processarLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erro ao fazer logout:", err);
    }
    res.redirect('/auth/login'); // Volta para a página de login
  });
};