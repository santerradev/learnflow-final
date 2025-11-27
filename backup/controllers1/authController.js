import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import { uploadImagem } from '../middleware/uploadMiddleware.js';

// Rota: GET /auth/login (ATUALIZADA)
export const renderLogin = (req, res) => {
  // 'res.locals.error' já foi preenchido no server.js com a mensagem do req.flash('error')
  // Apenas renderizamos a view. O EJS já tem acesso a 'error'.
  res.render('forms/login'); 
};

// Rota: GET /auth/cadastro (Sem alterações)
export const renderCadastro = (req, res) => {
  res.render('forms/cadastro', { error: null });
};

// Rota: POST /auth/cadastro (Sem alterações)
export const processarCadastro = async (req, res) => {
  const { nome, email, senha, tipo } = req.body;
  const foto_perfil = req.file?.filename;

  try {
    const senha_hash = await bcrypt.hash(senha, 10);

    if (tipo === 'aluno') {
      await prisma.usuario.create({
        data: { 
          nome, email, senha: senha_hash, foto_perfil, 
          tipo: 'aluno', status: 'ativo' 
        },
      });
      res.redirect('/auth/login');
    } else if (tipo === 'professor') {
      await prisma.solicitacao.create({
        data: { 
          nome, email, senha_hash: senha_hash, foto_perfil, 
          status: 'pendente' 
        },
      });
      req.flash('success', 'Solicitação enviada! Aguarde a aprovação.');
      res.redirect('/auth/login');
    } else {
      res.render('forms/cadastro', { error: 'Tipo de usuário inválido.' });
    }
  } catch (error) {
    if (error.code === 'P2002') {
      return res.render('forms/cadastro', { error: 'Email já cadastrado.' });
    }
    console.error("ERRO NO CADASTRO:", error);
    res.render('forms/cadastro', { error: 'Erro ao processar cadastro.' });
  }
};

// Rota: POST /auth/logout (ATUALIZADA PARA PASSPORT)
export const processarLogout = (req, res, next) => {
  // 'req.logout()' é a função do Passport para limpar a sessão de login
  req.logout((err) => {
    if (err) { 
      return next(err); // Trata erros internos do Passport
    }
    req.flash('success', 'Você saiu com sucesso.');
    res.redirect('/auth/login'); // Redireciona após o logout
  });
};