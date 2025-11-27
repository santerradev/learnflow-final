// file: controllers/pageController.js
import prisma from '../config/prisma.js';

// Rota: GET /
// Renderiza a landing page se deslogado, ou redireciona para /inicio se logado.
export const renderLandingPage = (req, res) => {
  // ✅ CORRIGIDO: Usa req.isAuthenticated() do Passport
  if (req.isAuthenticated()) {
    return res.redirect('/inicio');
  }
  res.render('landing_page'); 
};

// Rota: GET /inicio (Protegida por middleware)
// Renderiza o dashboard "Bem-vindo de volta!" para usuários logados.
export const renderInicio = async (req, res) => {
  try {
    const cursos = await prisma.curso.findMany({
      include: {
        professor: { 
          select: { 
            nome: true, 
            foto_perfil: true
          }
        }
      },
      orderBy: { id: 'desc' },
      take: 12 // Limita a 12 cursos na página inicial
    });
    
    res.render('plataforma/inicio', { 
      cursos: cursos,
      activeLink: 'inicio'
    });

  } catch (error) {
    console.error("Erro ao buscar cursos para a página Início:", error);
    req.flash('error', 'Erro ao carregar a página.');
    res.status(500).render('404_app', { message: 'Erro ao carregar a página.' });
  }
};