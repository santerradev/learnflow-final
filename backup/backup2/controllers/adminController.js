// file: controllers/adminController.js
import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs'; 
import fs from 'fs';          
import path from 'path';        
import { fileURLToPath } from 'url'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..'); 

// --- Funções de Renderização das Abas ---

// Rota: GET /admin/estatisticas
export const getEstatisticas = async (req, res) => {
  try {
    const totalUsuarios = await prisma.usuario.count();
    const usuariosAtivos = await prisma.usuario.count({ where: { status: 'ativo' } });
    const totalAlunos = await prisma.usuario.count({ where: { tipo: 'aluno' } });
    const totalProfessores = await prisma.usuario.count({ where: { tipo: 'professor' } });

    const stats = {
      totalUsuarios,
      usuariosAtivos,
      totalAlunos,
      totalProfessores,
    };

    res.render('plataforma/admin_estatisticas', { 
        stats, 
        activeTab: 'estatisticas', 
        activeLink: 'dashboard' 
    });

  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    req.flash('error', 'Erro ao carregar estatísticas.');
    res.status(500).render('404_app', { message: 'Erro ao carregar estatísticas.' });
  }
};

// Rota: GET /admin/usuarios
export const listarUsuarios = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const pageSize = 20; 
    const filtroTipo = req.query.tipo; 
    const searchTerm = req.query.search || ''; 

    // 1. Define a condição WHERE para o Prisma
    let whereCondition = {}; 
    if (filtroTipo === 'professor' || filtroTipo === 'aluno' || filtroTipo === 'administrador') {
      whereCondition.tipo = filtroTipo; 
    }
    if (searchTerm) {
      whereCondition.nome = {
        contains: searchTerm,
      };
    }
    
    // 2. Busca TODOS os usuários que correspondem aos filtros
    const todosUsuariosFiltrados = await prisma.usuario.findMany({
      where: whereCondition, 
      select: { 
          id: true, nome: true, email: true, tipo: true, 
          status: true, foto_perfil: true, data_cadastro: true 
      },
      orderBy: { nome: 'asc' }, 
    });

    // 3. Ordenação Customizada (Admin > Prof > Aluno > Alfabético)
    const tipoOrdem = { 'administrador': 1, 'professor': 2, 'aluno': 3 };
    todosUsuariosFiltrados.sort((a, b) => {
      const ordemA = tipoOrdem[a.tipo] || 4;
      const ordemB = tipoOrdem[b.tipo] || 4;
      if (ordemA !== ordemB) { return ordemA - ordemB; }
      return a.nome.localeCompare(b.nome); 
    });

    // 4. Calcula totais para paginação
    const totalUsers = todosUsuariosFiltrados.length;
    const totalPages = Math.ceil(totalUsers / pageSize);
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    const skip = (currentPage - 1) * pageSize; 

    // 5. Extrai os usuários para a página atual
    const usuariosDaPagina = todosUsuariosFiltrados.slice(skip, skip + pageSize);

    // 6. Renderiza a view
    res.render('plataforma/admin_usuarios', { 
        usuarios: usuariosDaPagina, 
        activeTab: 'usuarios',
        activeLink: 'dashboard',
        currentPage: currentPage,
        totalPages: totalPages,
        totalUsers: totalUsers,
        filtroTipo: filtroTipo || 'todos',
        searchTerm: searchTerm
    });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    res.status(500).render('plataforma/admin_usuarios', { 
        usuarios: [], 
        activeTab: 'usuarios', activeLink: 'dashboard',
        currentPage: 1, totalPages: 0, totalUsers: 0,
        filtroTipo: filtroTipo || 'todos', searchTerm: searchTerm,
        error: 'Ocorreu um erro ao buscar usuários.'
    });
  }
};

// Rota: GET /admin/solicitacoes
export const listarSolicitacoes = async (req, res) => {
  try {
    const solicitacoes = await prisma.solicitacao.findMany({
      where: { status: 'pendente' }, 
      orderBy: { data_solicitacao: 'asc' }, 
    });
    
    res.render('plataforma/admin_solicitacoes', { 
        solicitacoes, 
        activeTab: 'solicitacoes',
        activeLink: 'dashboard' 
    });
  } catch (error) {
    console.error("Erro ao listar solicitações:", error);
    req.flash('error', 'Erro ao listar solicitações.');
    res.status(500).render('404_app', { message: 'Erro ao listar solicitações.' });
  }
};

// --- Funções de Ação ---

// Rota: POST /admin/usuarios/:id/deletar
export const deletarUsuario = async (req, res) => {
  const usuarioId = parseInt(req.params.id);
  if (isNaN(usuarioId)) {
    req.flash('error', 'ID de usuário inválido.');
    return res.status(400).redirect('/admin/usuarios');
  }
   
  // ✅ CORRIGIDO: Usa req.user do Passport
  const adminId = req.user.id;

  try {
    if (usuarioId === adminId) {
      console.warn("Tentativa de auto-deleção pelo admin ID:", adminId);
      req.flash('error', 'Você não pode deletar sua própria conta.');
      return res.status(403).redirect('/admin/usuarios');
    }

    const usuarioParaDeletar = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { foto_perfil: true }
    });

    if (!usuarioParaDeletar) {
      req.flash('error', 'Usuário não encontrado.');
      return res.status(404).redirect('/admin/usuarios');
    }

    await prisma.usuario.delete({ where: { id: usuarioId } });

    if (usuarioParaDeletar.foto_perfil) {
      const caminhoFoto = path.join(projectRoot, 'public', 'uploads', 'images', usuarioParaDeletar.foto_perfil);
      if (fs.existsSync(caminhoFoto)) {
        fs.unlink(caminhoFoto, (err) => {
          if (err) console.error("Erro ao deletar foto do usuário:", err);
          else console.log("Foto do usuário deletada:", usuarioParaDeletar.foto_perfil);
        });
      }
    }

    req.flash('success', 'Usuário deletado com sucesso.');
    res.redirect('/admin/usuarios'); 

  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    if (error.code === 'P2003' || error.code === 'P2014') { 
      console.error("ERRO: Não foi possível deletar o usuário devido a registros relacionados.");
      req.flash('error', 'Não é possível deletar este usuário pois existem registros relacionados.');
      return res.status(409).redirect('/admin/usuarios'); 
    }
    req.flash('error', 'Erro ao deletar usuário.');
    res.status(500).redirect('/admin/usuarios');
  }
};

// Rota: POST /admin/solicitacoes/:id/aprovar
export const aprovarSolicitacao = async (req, res) => {
  const solicitacaoId = parseInt(req.params.id);
  if (isNaN(solicitacaoId)) {
    req.flash('error', 'ID de solicitação inválido.');
    return res.status(400).redirect('/admin/solicitacoes');
  }

  try {
    const solicitacao = await prisma.solicitacao.findUnique({
      where: { id: solicitacaoId },
    });

    if (!solicitacao || solicitacao.status !== 'pendente') {
      req.flash('error', 'Solicitação não encontrada ou já processada.');
      return res.status(404).redirect('/admin/solicitacoes');
    }

    const novoProfessor = await prisma.usuario.create({
      data: {
        nome: solicitacao.nome,
        email: solicitacao.email,
        senha: solicitacao.senha_hash, 
        foto_perfil: solicitacao.foto_perfil,
        tipo: 'professor',
        status: 'ativo', 
      },
    });

    await prisma.solicitacao.update({
      where: { id: solicitacaoId },
      data: { status: 'aprovada' },
    });

    req.flash('success', 'Solicitação aprovada com sucesso!');
    res.redirect('/admin/solicitacoes'); 

  } catch (error) {
    if (error.code === 'P2002') {
      await prisma.solicitacao.update({
        where: { id: solicitacaoId },
        data: { status: 'rejeitada' },
      });
      console.error("Erro de email duplicado ao aprovar solicitação:", solicitacao?.email);
      req.flash('error', 'Email já cadastrado. Solicitação rejeitada.');
      return res.status(409).redirect('/admin/solicitacoes');
    }
    console.error("Erro ao aprovar solicitação:", error);
    req.flash('error', 'Erro ao aprovar solicitação.');
    res.status(500).redirect('/admin/solicitacoes');
  }
};

// Rota: GET /admin/usuarios/:id/editar
export const renderFormEdicaoUsuario = async (req, res) => {
  const usuarioId = parseInt(req.params.id);
  if (isNaN(usuarioId)) {
    req.flash('error', 'ID de usuário inválido.');
    return res.status(400).render('404_app', { message: 'ID de usuário inválido.' });
  }

  try {
    const usuarioParaEditar = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuarioParaEditar) {
      req.flash('error', 'Usuário não encontrado.');
      return res.status(404).render('404_app', { message: 'Usuário não encontrado.' });
    }

    res.render('plataforma/admin_form_usuario', {
      usuarioEditando: usuarioParaEditar, 
      error: null,
      activeTab: 'usuarios', 
      activeLink: 'dashboard' 
    });

  } catch (error) {
    console.error("Erro ao buscar usuário para edição:", error);
    req.flash('error', 'Erro ao carregar página de edição.');
    res.status(500).render('404_app', { message: "Erro ao carregar a página de edição." });
  }
};

// Rota: POST /admin/usuarios/:id/editar
export const atualizarUsuario = async (req, res) => {
  const usuarioId = parseInt(req.params.id);
  if (isNaN(usuarioId)) {
    req.flash('error', 'ID de usuário inválido.');
    return res.status(400).redirect('/admin/usuarios');
  }
    
  const { nome, email, tipo, status, nova_senha } = req.body;
  const novaFoto = req.file?.filename; 
  
  // ✅ CORRIGIDO: Usa req.user do Passport
  const adminId = req.user.id;

  let usuarioExistente; 
  try {
    usuarioExistente = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { foto_perfil: true, senha: true, tipo: true } 
    });

    if (!usuarioExistente) {
      req.flash('error', 'Usuário não encontrado.');
      return res.status(404).redirect('/admin/usuarios');
    }

    const dadosAtualizacao = { nome, email, tipo, status };

    if (usuarioId === adminId) {
      if (tipo !== 'administrador') {
        throw new Error("Administrador não pode remover seu próprio privilégio.");
      }
      if (status !== 'ativo') {
        throw new Error("Administrador não pode desativar a própria conta.");
      }
    }

    if (nova_senha && nova_senha.trim() !== '') {
      dadosAtualizacao.senha = await bcrypt.hash(nova_senha, 10);
    }

    if (novaFoto) {
      dadosAtualizacao.foto_perfil = novaFoto; 
      if (usuarioExistente.foto_perfil) {
        const caminhoFotoAntiga = path.join(projectRoot, 'public', 'uploads', 'images', usuarioExistente.foto_perfil);
        if (fs.existsSync(caminhoFotoAntiga)) {
          fs.unlink(caminhoFotoAntiga, (err) => {
            if (err) console.error("Erro ao deletar foto antiga:", err);
          });
        }
      }
    }

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: dadosAtualizacao,
    });

    req.flash('success', 'Usuário atualizado com sucesso!');
    res.redirect('/admin/usuarios');

  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    let usuarioParaForm = null;
    if (usuarioId) { 
      try {
        usuarioParaForm = await prisma.usuario.findUnique({ where: { id: usuarioId } });
      } catch (findError) {
        console.error("Erro ao buscar usuário para formulário após falha no update:", findError);
      }
    }
    
    res.status(500).render('plataforma/admin_form_usuario', {
      error: error.message || 'Erro ao salvar as alterações. Verifique os dados e tente novamente.',
      usuarioEditando: usuarioParaForm || { id: usuarioId, nome, email, tipo, status }, 
      activeTab: 'usuarios',
      activeLink: 'dashboard'
    });
  }
};

// TODO: Implementar função para rejeitar solicitação (`rejeitarSolicitacao`)