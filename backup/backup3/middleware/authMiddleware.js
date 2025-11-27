// middleware/authMiddleware.js

export const eAutenticado = (req, res, next) => {
  if (req.isAuthenticated()) { 
    return next();
  }
  req.flash('error', 'Você precisa estar logado.');
  res.redirect('/auth/login'); 
};

export const eAdministrador = (req, res, next) => {
  if (req.isAuthenticated() && req.user.tipo === 'administrador') { 
    return next();
  }
  req.flash('error', 'Acesso negado. Apenas administradores.');
  res.status(403).redirect('/inicio');
};

export const eProfessor = (req, res, next) => {
  if (req.isAuthenticated() && req.user.tipo === 'professor') { 
    return next();
  }
  req.flash('error', 'Acesso negado. Apenas professores.');
  res.status(403).redirect('/inicio'); 
};

export const eProfessorOuAdmin = (req, res, next) => {
  if (req.isAuthenticated() && 
      (req.user.tipo === 'professor' || req.user.tipo === 'administrador')) { 
    return next();
  }
  req.flash('error', 'Acesso negado.');
  res.status(403).redirect('/inicio'); 
};