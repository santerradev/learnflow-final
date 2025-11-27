// file: controllers/userController.js
import prisma from '../config/prisma.js';
import { z } from 'zod';

// --- Funções Auxiliares (Helpers) ---
const getInitials = (nome) => {
  if (!nome) return '?';
  const parts = nome.split(' ');
  const initials = parts[0].charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : '');
  return initials.toUpperCase();
};

const formatRole = (tipo) => {
  if (tipo === 'administrador') return 'Administrador';
  if (tipo === 'professor') return 'Professor';
  if (tipo === 'aluno') return 'Estudante';
  return 'Usuário';
};

const formatInstituicao = (instituicao, tipo) => {
  if (tipo === 'administrador') return 'LearnFlow';
  if (instituicao === 'IFSUL_Gravatai') return 'IFSUL - Gravataí';
  if (instituicao === 'Outro') return 'Outra';
  return 'Não definida';
};

const formatData = (date) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    month: 'short',
    year: 'numeric'
  });
};

// --- Esquema de Validação ---
const UpdateProfileSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  email: z.string().email('Formato de e-mail inválido.'),
});

// --- Métodos do Controller (Exportados) ---

export const renderProfile = async (req, res) => {
  try {
    // CORRETO: Usando req.user (do Passport)
    const userId = req.user.id;
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      req.flash('error', 'Usuário não encontrado.');
      return res.redirect('/inicio');
    }

    let stats = {
      label1: "N/A", value1: 0,
      label2: "N/A", value2: 0,
      label3: "N/A", value3: 0,
    };

    if (user.tipo === 'administrador' || user.tipo === 'professor') {
      const [cursosCriados, aulasCriadas, atividadesCriadas] = await prisma.$transaction([
        prisma.curso.count({ where: { usuario_id: userId } }), 
        prisma.aula.count({ where: { usuario_id: userId } }), 
        prisma.atividade.count({ where: { usuario_id: userId } }) 
      ]);
      stats = { label1: "Cursos", value1: cursosCriados, label2: "Aulas", value2: aulasCriadas, label3: "Atividades", value3: atividadesCriadas };
    } else if (user.tipo === 'aluno') {
      const [cursosInscritos, aulasConcluidas, atividadesConcluidas] = await prisma.$transaction([
        prisma.inscricao.count({ where: { usuario_id: userId } }), 
        prisma.progresso.count({ where: { inscricao: { usuario_id: userId }, aula_id: { not: null } } }), // Aulas concluídas
        prisma.progresso.count({ where: { inscricao: { usuario_id: userId }, atividade_id: { not: null } } }) // Atividades concluídas
      ]);
      stats = { label1: "Cursos", value1: cursosInscritos, label2: "Aulas", value2: aulasConcluidas, label3: "Atividades", value3: atividadesConcluidas };
    }

    res.render('user/profile', {
      user: user,
      stats: stats,
      helpers: {
        getInitials,
        formatRole,
        formatInstituicao,
        formatData
      }
    });
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
    req.flash('error', 'Erro ao carregar seu perfil.');
    res.redirect('/inicio');
  }
};

export const updateProfile = async (req, res) => {
  try {
    // CORRETO: Usando req.user (do Passport)
    const userId = req.user.id;
    const validation = UpdateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: validation.error.errors[0].message });
    }

    const { nome, email } = req.body;

    const updatedUser = await prisma.usuario.update({
      where: { id: userId },
      data: { nome, email },
    });
    
    const { senha, ...userWithoutPassword } = updatedUser; 
    
    // CORRETO: Atualiza a sessão do Passport
    req.login(userWithoutPassword, (err) => {
      if (err) {
        console.error('Erro ao re-sincronizar sessão do Passport:', err);
        return res.status(500).json({ message: 'Erro ao atualizar sessão.' });
      }
      return res.status(200).json(userWithoutPassword);
    });
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(409).json({ message: 'Este e-mail já está em uso.' });
    }
    console.error('Erro ao salvar perfil:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};