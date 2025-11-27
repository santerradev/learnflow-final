// file: controllers/authController.js
import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import passport from 'passport';

// Função helper para validar a senha
const validarSenha = (senha) => {
  // Mínimo 8 caracteres, 1 maiúscula, 1 número, 1 símbolo
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(senha);
};

// Rota: GET /auth/login
export const renderLogin = (req, res) => {
  res.render('forms/login'); 
};

// Rota: GET /auth/cadastro
export const renderCadastro = (req, res) => {
  res.render('forms/cadastro', { error: null });
};

// Rota: POST /auth/cadastro (ATUALIZADA)
export const processarCadastro = async (req, res) => {
  const { nome, email, senha, confirmar_senha, tipo, instituicao } = req.body;
  const foto_perfil = req.file?.filename;

  try {
    // 1. Senhas coincidem?
    if (senha !== confirmar_senha) {
      return res.render('forms/cadastro', { error: 'As senhas não coincidem.' });
    }
    // 2. Senha forte?
    if (!validarSenha(senha)) {
      return res.render('forms/cadastro', { error: 'A senha deve ter no mínimo 8 caracteres, incluindo maiúscula, número e símbolo (@$!%*?&).' });
    }
    // 3. Verifica se a instituição é válida
    if (!['IFSUL_Gravatai', 'Outro'].includes(instituicao)) {
        return res.render('forms/cadastro', { error: 'Instituição inválida.' });
    }

    const senha_hash = await bcrypt.hash(senha, 10);

    if (tipo === 'aluno') {
      await prisma.usuario.create({
        data: { 
          nome, email, senha: senha_hash, foto_perfil, 
          tipo: 'aluno', status: 'ativo',
          instituicao: instituicao // Salva novo campo
        },
      });
      req.flash('success', 'Cadastro realizado com sucesso! Você já pode fazer login.');
      res.redirect('/auth/login');

    } else if (tipo === 'professor') {
      await prisma.solicitacao.create({
        data: { 
          nome, email, senha_hash: senha_hash, foto_perfil, 
          status: 'pendente',
          instituicao: instituicao // Salva novo campo
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
  req.logout((err) => {
    if (err) { 
      return next(err); 
    }
    req.flash('success', 'Você saiu com sucesso.');
    res.redirect('/auth/login');
  });
};