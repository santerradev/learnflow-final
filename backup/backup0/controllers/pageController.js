// file: controllers/pageController.js
import prisma from '../config/prisma.js';

// Rota: GET /
// Renderiza a landing page se deslogado, ou redireciona para /inicio se logado.
export const renderLandingPage = (req, res) => {
    if (req.session.usuario) {
        return res.redirect('/inicio');
    }
    // Renderiza a landing page (layout de autenticação)
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
                        foto_perfil: true // <-- ADICIONADO
                    }
                }
            },
            // TODO: Adicionar lógica de filtragem/ordenação
        });
        
        res.render('plataforma/inicio', { 
            cursos: cursos,
            activeLink: 'inicio'
        });

    } catch (error) {
        console.error("Erro ao buscar cursos para a página Início:", error);
        res.status(500).send("Erro ao carregar a página.");
    }
};