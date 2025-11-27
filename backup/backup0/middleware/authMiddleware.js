// file: middleware/authMiddleware.js

// Verifica se o usuário está logado (para EJS)
export const eAutenticado = (req, res, next) => {
  if (req.session.usuario) {
    next(); // Usuário está logado, continua para a próxima função/rota
  } else {
    // Usuário não está logado, redireciona para a página de login
    res.redirect('/auth/login'); 
  }
};

// Verifica se o usuário logado é um Administrador
export const eAdministrador = (req, res, next) => {
  // Primeiro, garante que está autenticado (boa prática, embora geralmente usado em conjunto)
  if (!req.session.usuario) {
    return res.redirect('/auth/login');
  }
  // Verifica o tipo
  if (req.session.usuario.tipo === 'administrador') {
    next(); // É admin, continua
  } else {
    // Não é admin, redireciona para a página inicial (ou mostra erro 403)
    // res.status(403).send("Acesso negado. Apenas administradores."); 
    res.status(403).redirect('/inicio'); 
  }
};

// Verifica se o usuário logado é um Professor
export const eProfessor = (req, res, next) => {
  if (!req.session.usuario) {
    return res.redirect('/auth/login');
  }
  if (req.session.usuario.tipo === 'professor') {
    next(); // É professor, continua
  } else {
    res.status(403).redirect('/inicio'); 
  }
};

// Verifica se o usuário logado é um Professor OU um Administrador
// Útil para ações como criar/editar cursos e aulas
export const eProfessorOuAdmin = (req, res, next) => {
  if (!req.session.usuario) {
    return res.redirect('/auth/login');
  }
  const tipo = req.session.usuario.tipo;
  if (tipo === 'professor' || tipo === 'administrador') {
    next(); // Tem permissão, continua
  } else {
    res.status(403).redirect('/inicio'); 
  }
};