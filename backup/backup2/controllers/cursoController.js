// file: controllers/cursoController.js
import prisma from '../config/prisma.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// --- Funções de Leitura (Read) ---

// Rota: GET /cursos (Renderiza a página "Meus Cursos")
export const renderMeusCursos = async (req, res) => {
  try {
    const cursos = await prisma.curso.findMany({
      include: {
        professor: {
          select: { 
            nome: true,
            foto_perfil: true
          } 
        },
        inscricoes: {
          where: { usuario_id: req.user.id },
          select: { usuario_id: true }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });
    
    res.render('plataforma/meus_cursos', {
      cursos: cursos,
      activeLink: 'meus_cursos',
      error: req.query.error
    });
  } catch (error) {
    console.error("Erro ao buscar 'Meus Cursos':", error);
    req.flash('error', 'Erro ao carregar a página de cursos.');
    res.status(500).render('404_app', { message: 'Erro ao carregar a página de cursos.' });
  }
};

// Rota: GET /cursos/novo (Renderiza o formulário para criar um novo curso)
export const renderFormCurso = (req, res) => {
  try {
    res.render('plataforma/form_curso', {
      curso: null,
      pageTitle: 'Criar Novo Curso',
      error: null,
      activeLink: 'meus_cursos'
    });
  } catch (error) {
    console.error("Erro ao renderizar formulário de curso:", error);
    req.flash('error', 'Erro ao carregar a página.');
    res.status(500).render('404_app', { message: 'Erro ao carregar a página.' });
  }
};

// Rota: GET /cursos/:id/editar (Renderiza o formulário de edição)
export const renderFormEdicaoCurso = async (req, res) => {
  const cursoId = parseInt(req.params.id);
  if (isNaN(cursoId)) {
    req.flash('error', 'ID de curso inválido.');
    return res.status(400).render('404_app', { message: 'ID de curso inválido.' });
  }
  
  // ✅ CORRIGIDO: Usa req.user do Passport
  const usuarioId = req.user.id;
  const usuarioTipo = req.user.tipo;

  try {
    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
    });

    if (!curso) {
      req.flash('error', 'Curso não encontrado.');
      return res.status(404).render('404_app', { message: 'Curso não encontrado.' });
    }

    if (curso.usuario_id !== usuarioId && usuarioTipo !== 'administrador') {
      req.flash('error', 'Você não tem permissão para editar este curso.');
      return res.status(403).redirect('/cursos');
    }

    res.render('plataforma/form_curso', {
      curso: curso,
      pageTitle: 'Editar Curso',
      error: null,
      activeLink: 'meus_cursos'
    });

  } catch (error) {
    console.error("Erro ao buscar curso para edição:", error);
    req.flash('error', 'Erro ao carregar a página de edição.');
    res.status(500).render('404_app', { message: 'Erro ao carregar a página de edição.' });
  }
};

// --- Funções de Criação (Create) ---

// Rota: POST /cursos/novo (Processa a criação do curso)
export const criarCurso = async (req, res) => {
  const { titulo, materia, descricao, senha_acesso } = req.body;
  
  // ✅ CORRIGIDO: Usa req.user do Passport
  const professorId = req.user.id;

  if (!req.file) {
    return res.status(400).json({
      error: 'A imagem da capa é obrigatória.'
    });
  }
  
  const capa_curso = req.file.filename;

  // ✅ Validação da senha de acesso (se fornecida)
  if (senha_acesso && senha_acesso.trim().length > 0) {
    // Remove espaços
    const senhaLimpa = senha_acesso.replace(/\s/g, '');
    
    if (senhaLimpa.length > 5) {
      return res.status(400).json({
        error: 'A senha de acesso não pode ter mais de 5 caracteres.'
      });
    }
    
    if (senhaLimpa.length === 0) {
      return res.status(400).json({
        error: 'Senha de acesso não pode conter apenas espaços.'
      });
    }
  }

  try {
    await prisma.curso.create({
      data: {
        titulo,
        materia,
        descricao: descricao || null,
        capa_curso,
        senha_acesso: senha_acesso && senha_acesso.trim().length > 0 
          ? senha_acesso.replace(/\s/g, '') 
          : null,
        usuario_id: professorId
      }
    });

    res.status(201).json({ 
      success: true, 
      message: 'Curso criado com sucesso!' 
    });

  } catch (error) {
    console.error("Erro ao criar curso:", error);
    res.status(500).json({ 
      error: 'Erro ao salvar o curso. Tente novamente.' 
    });
  }
};

// --- Funções de Atualização (Update) ---

// Rota: POST /cursos/:id/editar (Processa a atualização do curso)
export const atualizarCurso = async (req, res) => {
  const cursoId = parseInt(req.params.id);
  if (isNaN(cursoId)) {
    req.flash('error', 'ID de curso inválido.');
    return res.status(400).render('404_app', { message: 'ID de curso inválido.' });
  }

  // ✅ CORRIGIDO: Usa req.user do Passport
  const usuarioId = req.user.id;
  const usuarioTipo = req.user.tipo;
  const { titulo, materia, descricao, senha_acesso } = req.body;
  const novaCapa = req.file?.filename;

  try {
    const cursoExistente = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: { usuario_id: true, capa_curso: true }
    });

    if (!cursoExistente) {
      req.flash('error', 'Curso não encontrado.');
      return res.status(404).render('404_app', { message: 'Curso não encontrado.' });
    }

    if (cursoExistente.usuario_id !== usuarioId && usuarioTipo !== 'administrador') {
      req.flash('error', 'Você não tem permissão para editar este curso.');
      return res.status(403).redirect('/cursos');
    }

    const dadosAtualizacao = {
      titulo,
      materia,
      descricao: descricao || null,
    };

    // ✅ Atualizar senha de acesso
    if (senha_acesso !== undefined) {
      if (senha_acesso && senha_acesso.trim().length > 0) {
        const senhaLimpa = senha_acesso.replace(/\s/g, '');
        if (senhaLimpa.length > 5) {
          req.flash('error', 'Senha de acesso não pode ter mais de 5 caracteres.');
          return res.redirect(`/cursos/${cursoId}/editar`);
        }
        dadosAtualizacao.senha_acesso = senhaLimpa;
      } else {
        dadosAtualizacao.senha_acesso = null;
      }
    }

    if (novaCapa) {
      dadosAtualizacao.capa_curso = novaCapa;

      if (cursoExistente.capa_curso) {
        const caminhoImagemAntiga = path.join(projectRoot, 'public', 'uploads', 'images', cursoExistente.capa_curso);
        if (fs.existsSync(caminhoImagemAntiga)) {
          fs.unlink(caminhoImagemAntiga, (err) => {
            if (err) console.error("Erro ao deletar imagem antiga:", err);
            else console.log("Imagem antiga deletada:", cursoExistente.capa_curso);
          });
        } else {
          console.warn("Arquivo de imagem antiga não encontrado:", caminhoImagemAntiga);
        }
      }
    }

    await prisma.curso.update({
      where: { id: cursoId },
      data: dadosAtualizacao,
    });

    req.flash('success', 'Curso atualizado com sucesso!');
    res.redirect('/cursos');

  } catch (error) {
    console.error("Erro ao atualizar curso:", error);
    const cursoParaForm = await prisma.curso.findUnique({ where: { id: cursoId } }); 
    res.status(500).render('plataforma/form_curso', {
      error: 'Erro ao salvar as alterações. Tente novamente.',
      curso: cursoParaForm || { id: cursoId, titulo, materia, descricao, capa_curso: cursoExistente?.capa_curso }, 
      pageTitle: 'Editar Curso',
      activeLink: 'meus_cursos'
    });
  }
};

// --- Funções de Deleção (Delete) ---

// Rota: POST /cursos/:id/deletar
export const deletarCurso = async (req, res) => {
  const cursoId = parseInt(req.params.id);
  if (isNaN(cursoId)) {
    req.flash('error', 'ID de curso inválido.');
    return res.status(400).redirect('/cursos');
  }

  // ✅ CORRIGIDO: Usa req.user do Passport
  const usuarioId = req.user.id;
  const usuarioTipo = req.user.tipo;

  try {
    const cursoParaDeletar = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: { usuario_id: true, capa_curso: true } 
    });

    if (!cursoParaDeletar) {
      req.flash('error', 'Curso não encontrado.');
      return res.status(404).redirect('/cursos'); 
    }

    if (cursoParaDeletar.usuario_id !== usuarioId && usuarioTipo !== 'administrador') {
      req.flash('error', 'Você não tem permissão para deletar este curso.');
      return res.status(403).redirect('/cursos'); 
    }

    await prisma.curso.delete({
      where: { id: cursoId },
    });

    if (cursoParaDeletar.capa_curso) {
      const caminhoImagem = path.join(projectRoot, 'public', 'uploads', 'images', cursoParaDeletar.capa_curso);
      if (fs.existsSync(caminhoImagem)) {
        fs.unlink(caminhoImagem, (err) => {
          if (err) console.error("Erro ao deletar imagem do curso:", err);
          else console.log("Imagem do curso deletada:", cursoParaDeletar.capa_curso);
        });
      } else {
        console.warn("Arquivo de imagem não encontrado para deletar:", caminhoImagem);
      }
    }

    req.flash('success', 'Curso deletado com sucesso!');
    res.redirect('/cursos'); 

  } catch (error) {
    console.error("Erro ao deletar curso:", error);
    if (error.code === 'P2003' || error.code === 'P2014') {
      console.error("ERRO: Não foi possível deletar o curso devido a registros relacionados.");
      req.flash('error', 'Não é possível deletar este curso pois existem registros relacionados (aulas, inscrições, etc.).');
      return res.status(409).redirect('/cursos');
    }
    req.flash('error', 'Erro ao deletar curso.');
    res.status(500).redirect('/cursos');
  }
};

// ✅ NOVA FUNÇÃO QUE DEVE SER ADICIONADA:
export const renderDetalheCurso = async (req, res) => {
  const cursoId = parseInt(req.params.id);
  const usuarioId = req.user.id;
  const aba = req.query.aba || 'mural';

  if (isNaN(cursoId)) {
    req.flash('error', 'ID de curso inválido.');
    return res.status(400).render('404_app', { message: 'ID de curso inválido.' });
  }

  try {
    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      include: {
        professor: {
          select: { 
            id: true,
            nome: true, 
            foto_perfil: true 
          }
        },
        inscricoes: {
          where: { usuario_id: usuarioId },
          select: { id: true, data_inscricao: true }
        },
        listas: {
          orderBy: { ordem: 'asc' },
          include: {
            aulas: {
              orderBy: { ordem: 'asc' },
              select: {
                id: true,
                titulo: true,
                descricao: true,
                ordem: true,
                prazo: true
              }
            },
            atividades: {
              orderBy: { ordem: 'asc' },
              select: {
                id: true,
                titulo: true,
                ordem: true,
                prazo: true
              }
            },
            materiais: {
              orderBy: { ordem: 'asc' },
              select: {
                id: true,
                titulo: true,
                tipo: true,
                arquivo: true
              }
            }
          }
        }
      }
    });

    if (!curso) {
      req.flash('error', 'Curso não encontrado.');
      return res.status(404).render('404_app', { message: 'Curso não encontrado.' });
    }

    const estaInscrito = curso.inscricoes.length > 0;
    const eDono = curso.usuario_id === usuarioId;
    const eAdmin = req.user.tipo === 'administrador';

    if (!estaInscrito && !eDono && !eAdmin) {
      req.flash('error', 'Você precisa se inscrever para acessar este curso.');
      return res.status(403).redirect('/cursos');
    }

    let progresso = { 
      porcentagem: 0, 
      aulasCompletas: 0, 
      totalAulas: 0, 
      atividadesCompletas: 0, 
      totalAtividades: 0 
    };
    
    if (estaInscrito) {
      const inscricao = curso.inscricoes[0];
      
      progresso.totalAulas = curso.listas.reduce((acc, lista) => acc + lista.aulas.length, 0);
      progresso.totalAtividades = curso.listas.reduce((acc, lista) => acc + lista.atividades.length, 0);
      
      const progressoAluno = await prisma.progresso.findMany({
        where: { inscricao_id: inscricao.id, concluida: true }
      });
      
      progresso.aulasCompletas = progressoAluno.filter(p => p.aula_id !== null).length;
      progresso.atividadesCompletas = progressoAluno.filter(p => p.atividade_id !== null).length;
      
      if (progresso.totalAulas > 0) {
        progresso.porcentagem = Math.round((progresso.aulasCompletas / progresso.totalAulas) * 100);
      }
    }

    let dadosAba = {};
    
    if (aba === 'mural') {
      dadosAba.publicacoes = await prisma.publicacao.findMany({
        where: { curso_id: cursoId },
        include: {
          autor: {
            select: { id: true, nome: true, foto_perfil: true, tipo: true }
          },
          comentarios: {
            include: {
              autor: {
                select: { id: true, nome: true, foto_perfil: true }
              }
            },
            orderBy: { data_criacao: 'asc' }
          }
        },
        orderBy: { data_criacao: 'desc' }
      });
    } else if (aba === 'pessoas') {
      dadosAba.participantes = await prisma.inscricao.findMany({
        where: { curso_id: cursoId },
        include: {
          aluno: {
            select: { id: true, nome: true, email: true, foto_perfil: true }
          }
        },
        orderBy: { data_inscricao: 'asc' }
      });
    }

    res.render('plataforma/detalhes_curso', {
      curso,
      progresso,
      aba,
      dadosAba,
      estaInscrito,
      eDono,
      eAdmin,
      activeLink: 'meus_cursos'
    });

  } catch (error) {
    console.error("Erro ao buscar detalhes do curso:", error);
    req.flash('error', 'Erro ao carregar o curso.');
    res.status(500).render('404_app', { message: 'Erro ao carregar o curso.' });
  }
};