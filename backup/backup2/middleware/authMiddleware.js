// file: middleware/authMiddleware.js

// ✅ CORRIGIDO: Agora usa req.isAuthenticated() e req.user do Passport

// Verifica se o usuário está logado
export const eAutenticado = (req, res, next) => {
  // 'req.isAuthenticated()' é a função do Passport
  if (req.isAuthenticated()) { 
    return next(); // Usuário está logado, continua
  }
  // Se não estiver logado, envia mensagem de erro e redireciona
  req.flash('error', 'Você precisa estar logado para ver esta página.');
  res.redirect('/auth/login'); 
};

// Verifica se é Administrador
export const eAdministrador = (req, res, next) => {
  // O Passport anexa o usuário em 'req.user'
  if (req.isAuthenticated() && req.user.tipo === 'administrador') { 
    return next();
  }
  req.flash('error', 'Acesso negado. Apenas administradores.');
  res.status(403).redirect('/inicio');
};

// Verifica se é Professor
export const eProfessor = (req, res, next) => {
  if (req.isAuthenticated() && req.user.tipo === 'professor') { 
    return next();
  }
  req.flash('error', 'Acesso negado. Apenas professores.');
  res.status(403).redirect('/inicio'); 
};

// Verifica se é Professor OU Administrador
export const eProfessorOuAdmin = (req, res, next) => {
  if (req.isAuthenticated() && 
      (req.user.tipo === 'professor' || req.user.tipo === 'administrador')) { 
    return next();
  }
  req.flash('error', 'Acesso negado.');
  res.status(403).redirect('/inicio'); 
};