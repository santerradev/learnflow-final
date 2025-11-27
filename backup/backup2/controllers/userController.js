// file: controllers/userController.js

import prisma from '../config/prisma.js';

// ✅ CORRIGIDO: Agora usa os campos corretos do seu schema Prisma

// --- Funções Auxiliares (Helpers) ---
const getInitials = (nome) => {
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

// --- Métodos do Controller (Exportados) ---

/**
 * Método GET para renderizar a página de perfil do usuário.
 */
export const renderProfile = async (req, res) => {
  try {
    // ✅ CORRIGIDO: Usa req.user do Passport
    const userId = req.user.id; 

    const user = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user) {
      req.flash('error', 'Usuário não encontrado.');
      return res.redirect('/inicio'); 
    }

    // ✅ CORRIGIDO: Estatísticas usando os relacionamentos corretos do schema
    let stats = {
      label1: "N/A", value1: 0,
      label2: "N/A", value2: 0,
      label3: "N/A", value3: 0,
    };

    if (user.tipo === 'administrador' || user.tipo === 'professor') {
      // Estatísticas para Admin/Professor
      const [cursosCriados, aulasCriadas, atividadesCriadas] = await prisma.$transaction([
        prisma.curso.count({ where: { usuario_id: userId } }),
        prisma.aula.count({ where: { usuario_id: userId } }),
        prisma.atividade.count({ where: { usuario_id: userId } })
      ]);
      
      stats = { 
        label1: "Cursos", value1: cursosCriados, 
        label2: "Aulas", value2: aulasCriadas, 
        label3: "Atividades", value3: atividadesCriadas 
      };
      
    } else if (user.tipo === 'aluno') {
      // Estatísticas para Aluno
      const [cursosInscritos, aulasAssistidas, atividadesConcluidas] = await prisma.$transaction([
        prisma.inscricao.count({ where: { usuario_id: userId } }),
        prisma.progresso.count({ 
          where: { 
            inscricao: { usuario_id: userId },
            aula_id: { not: null },
            concluida: true
          } 
        }),
        prisma.progresso.count({ 
          where: { 
            inscricao: { usuario_id: userId },
            atividade_id: { not: null },
            concluida: true
          } 
        })
      ]);
      
      stats = { 
        label1: "Cursos", value1: cursosInscritos, 
        label2: "Aulas", value2: aulasAssistidas, 
        label3: "Atividades", value3: atividadesConcluidas 
      };
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
    req.flash('error', 'Erro ao carregar o perfil.');
    res.redirect('/inicio');
  }
};

/**
 * Método PATCH para atualizar as informações do perfil.
 */
export const updateProfile = async (req, res) => {
  try {
    // ✅ CORRIGIDO: Usa req.user do Passport
    const userId = req.user.id;
    
    // ✅ Validação básica (pode adicionar Zod depois se quiser)
    const { nome, email } = req.body;
    
    if (!nome || nome.trim().length < 3) {
      return res.status(400).json({ message: 'O nome deve ter pelo menos 3 caracteres.' });
    }
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Formato de e-mail inválido.' });
    }

    const updatedUser = await prisma.usuario.update({
      where: { id: userId },
      data: { nome: nome.trim(), email: email.trim() },
    });

    // ✅ Remove senha antes de enviar resposta
    const { senha, ...userWithoutPassword } = updatedUser;
    
    // ✅ CRÍTICO: Atualiza req.user do Passport para refletir mudanças
    req.user.nome = userWithoutPassword.nome;
    req.user.email = userWithoutPassword.email;

    return res.status(200).json(userWithoutPassword); 

  } catch (error) {
    // Verifica erro de email duplicado (Prisma error P2002)
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(409).json({ message: 'Este e-mail já está em uso.' });
    }
    
    console.error('Erro ao salvar perfil:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};