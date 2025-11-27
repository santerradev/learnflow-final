// file: controllers/pageController.js
import prisma from '../config/prisma.js';

// ... outras funções existentes ...

// Renderizar página "Meus Cursos"
export const renderMeusCursos = async (req, res) => {
    const userId = req.user.id;
    
    try {
        // Buscar todos os cursos
        const cursos = await prisma.curso.findMany({
            include: {
                professor: {
                    select: { id: true, nome: true, foto_perfil: true }
                },
                _count: {
                    select: { 
                        inscricoes: true,
                        aulas: true,
                        atividades: true
                    }
                }
            },
            orderBy: { id: 'desc' }
        });
        
        // Buscar em quais cursos o usuário está inscrito
        const inscricoes = await prisma.inscricao.findMany({
            where: { usuario_id: userId },
            select: { curso_id: true }
        });
        
        const cursosInscritos = inscricoes.map(i => i.curso_id);
        
        // Adicionar flag 'estaInscrito' em cada curso
        const cursosComStatus = cursos.map(curso => ({
            ...curso,
            estaInscrito: cursosInscritos.includes(curso.id)
        }));
        
        res.render('plataforma/meus_cursos', {
            cursos: cursosComStatus,
            activeLink: 'meus-cursos'
        });
        
    } catch (error) {
        console.error('Erro ao listar cursos:', error);
        req.flash('error', 'Erro ao carregar cursos.');
        res.redirect('/inicio');
    }
};

// Renderizar página de Início
export const renderInicio = async (req, res) => {
    const userId = req.user.id;
    
    try {
        // Buscar cursos do usuário (se for professor/admin)
        let meusCursos = [];
        if (req.user.tipo === 'professor' || req.user.tipo === 'administrador') {
            meusCursos = await prisma.curso.findMany({
                where: { usuario_id: userId },
                include: {
                    _count: {
                        select: { 
                            inscricoes: true,
                            aulas: true,
                            atividades: true
                        }
                    }
                },
                take: 5,
                orderBy: { id: 'desc' }
            });
        }
        
        // Buscar cursos inscritos (se for aluno)
        let cursosInscritos = [];
        if (req.user.tipo === 'aluno') {
            const inscricoes = await prisma.inscricao.findMany({
                where: { usuario_id: userId },
                include: {
                    curso: {
                        include: {
                            professor: {
                                select: { id: true, nome: true, foto_perfil: true }
                            },
                            _count: {
                                select: { aulas: true, atividades: true }
                            }
                        }
                    }
                },
                take: 5,
                orderBy: { data_inscricao: 'desc' }
            });
            
            cursosInscritos = inscricoes.map(i => ({
                ...i.curso,
                estaInscrito: true
            }));
        }
        
        // Buscar estatísticas
        let stats = {};
        if (req.user.tipo === 'professor' || req.user.tipo === 'administrador') {
            const [totalCursos, totalAulas, totalAtividades] = await Promise.all([
                prisma.curso.count({ where: { usuario_id: userId } }),
                prisma.aula.count({ where: { usuario_id: userId } }),
                prisma.atividade.count({ where: { usuario_id: userId } })
            ]);
            stats = { totalCursos, totalAulas, totalAtividades };
        } else {
            const [totalInscritos, totalConcluidas] = await Promise.all([
                prisma.inscricao.count({ where: { usuario_id: userId } }),
                prisma.progresso.count({ 
                    where: { 
                        inscricao: { usuario_id: userId },
                        concluida: true
                    }
                })
            ]);
            stats = { totalInscritos, totalConcluidas };
        }
        
        res.render('plataforma/inicio', {
            meusCursos,
            cursosInscritos,
            stats,
            activeLink: 'inicio'
        });
        
    } catch (error) {
        console.error('Erro ao carregar início:', error);
        req.flash('error', 'Erro ao carregar página inicial.');
        res.redirect('/auth/login');
    }
};

// Renderizar landing page
export const renderLandingPage = (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/inicio');
    }
    res.redirect('/auth/login');
};