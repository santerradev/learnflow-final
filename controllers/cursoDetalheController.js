// file: controllers/cursoDetalheController.js
import prisma from '../config/prisma.js';

/**
 * GET /cursos/:cursoId/mural
 * Renderiza a página do mural do curso
 */
export const renderMural = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);

    try {
        // Buscar publicações do curso
        const publicacoes = await prisma.publicacao.findMany({
            where: { curso_id: cursoId },
            include: {
                autor: {
                    select: { id: true, nome: true, foto_perfil: true, tipo: true }
                },
                comentarios: {
                    include: {
                        autor: {
                            select: { id: true, nome: true, foto_perfil: true, tipo: true }
                        }
                    },
                    orderBy: { data_criacao: 'asc' }
                }
            },
            orderBy: { data_criacao: 'desc' }
        });

        res.render('plataforma/curso/mural', {
            activeTab: 'mural',
            activeLink: 'cursos',
            publicacoes
        });

    } catch (error) {
        console.error('Erro ao carregar mural:', error);
        req.flash('error', 'Erro ao carregar mural do curso.');
        res.redirect('/cursos');
    }
};

/**
 * GET /cursos/:cursoId/aulas
 * Renderiza a página de aulas do curso
 */
export const renderAulas = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);

    try {
        // Buscar listas com aulas
        const listas = await prisma.lista.findMany({
            where: { curso_id: cursoId },
            include: {
                aulas: {
                    orderBy: { ordem: 'asc' }
                }
            },
            orderBy: { ordem: 'asc' }
        });

        // Buscar aulas sem lista
        const aulasSemLista = await prisma.aula.findMany({
            where: { 
                curso_id: cursoId,
                lista_id: null 
            },
            orderBy: { ordem: 'asc' }
        });

        // Se inscrito, buscar progresso das aulas
        let aulasConcluidasIds = [];
        if (req.inscricao) {
            const progressos = await prisma.progresso.findMany({
                where: {
                    inscricao_id: req.inscricao.id,
                    aula_id: { not: null },
                    concluida: true
                },
                select: { aula_id: true }
            });
            aulasConcluidasIds = progressos.map(p => p.aula_id);
        }

        res.render('plataforma/curso/aulas', {
            activeTab: 'aulas',
            activeLink: 'cursos',
            listas,
            aulasSemLista,
            aulasConcluidasIds
        });

    } catch (error) {
        console.error('Erro ao carregar aulas:', error);
        req.flash('error', 'Erro ao carregar aulas do curso.');
        res.redirect('/cursos');
    }
};

/**
 * GET /cursos/:cursoId/atividades
 * Renderiza a página de atividades do curso
 */
export const renderAtividades = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);

    try {
        // Buscar listas com atividades
        const listas = await prisma.lista.findMany({
            where: { curso_id: cursoId },
            include: {
                atividades: {
                    orderBy: { ordem: 'asc' }
                },
                materiais: {
                    orderBy: { ordem: 'asc' }
                }
            },
            orderBy: { ordem: 'asc' }
        });

        // Buscar atividades e materiais sem lista
        const atividadesSemLista = await prisma.atividade.findMany({
            where: { 
                curso_id: cursoId,
                lista_id: null 
            },
            orderBy: { ordem: 'asc' }
        });

        const materiaisSemLista = await prisma.material.findMany({
            where: { 
                curso_id: cursoId,
                lista_id: null 
            },
            orderBy: { ordem: 'asc' }
        });

        // Se inscrito, buscar progresso das atividades
        let atividadesConcluidasIds = [];
        if (req.inscricao) {
            const progressos = await prisma.progresso.findMany({
                where: {
                    inscricao_id: req.inscricao.id,
                    atividade_id: { not: null },
                    concluida: true
                },
                select: { atividade_id: true }
            });
            atividadesConcluidasIds = progressos.map(p => p.atividade_id);
        }

        res.render('plataforma/curso/atividades', {
            activeTab: 'atividades',
            activeLink: 'cursos',
            listas,
            atividadesSemLista,
            materiaisSemLista,
            atividadesConcluidasIds
        });

    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        req.flash('error', 'Erro ao carregar atividades do curso.');
        res.redirect('/cursos');
    }
};

/**
 * GET /cursos/:cursoId/materiais
 * Renderiza a página de materiais do curso
 */
export const renderMateriais = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);

    try {
        // Buscar listas com materiais
        const listas = await prisma.lista.findMany({
            where: { curso_id: cursoId },
            include: {
                materiais: {
                    orderBy: { ordem: 'asc' }
                }
            },
            orderBy: { ordem: 'asc' }
        });

        // Buscar materiais sem lista
        const materiaisSemLista = await prisma.material.findMany({
            where: { 
                curso_id: cursoId,
                lista_id: null 
            },
            orderBy: { ordem: 'asc' }
        });

        res.render('plataforma/curso/materiais', {
            activeTab: 'materiais',
            activeLink: 'cursos',
            listas,
            materiaisSemLista
        });

    } catch (error) {
        console.error('Erro ao carregar materiais:', error);
        req.flash('error', 'Erro ao carregar materiais do curso.');
        res.redirect('/cursos');
    }
};

/**
 * GET /cursos/:cursoId/pessoas
 * Renderiza a página de pessoas do curso
 */
export const renderPessoas = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);

    try {
        // Buscar inscrições com dados dos alunos
        const inscricoes = await prisma.inscricao.findMany({
            where: { curso_id: cursoId },
            include: {
                aluno: {
                    select: { 
                        id: true, 
                        nome: true, 
                        email: true, 
                        foto_perfil: true,
                        tipo: true 
                    }
                }
            },
            orderBy: {
                aluno: { nome: 'asc' }
            }
        });

        // Separar por tipo
        const alunos = inscricoes.filter(i => i.aluno.tipo === 'aluno');
        const professoresInscritos = inscricoes.filter(i => i.aluno.tipo === 'professor');

        res.render('plataforma/curso/pessoas', {
            activeTab: 'pessoas',
            activeLink: 'cursos',
            alunos,
            professoresInscritos,
            totalInscritos: inscricoes.length
        });

    } catch (error) {
        console.error('Erro ao carregar pessoas:', error);
        req.flash('error', 'Erro ao carregar participantes do curso.');
        res.redirect('/cursos');
    }
};

/**
 * GET /cursos/:cursoId/aulas/:aulaId
 * Renderiza a página de visualização de uma aula
 */
export const renderVerAula = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const aulaId = parseInt(req.params.aulaId);

    try {
        // Buscar a aula
        const aula = await prisma.aula.findFirst({
            where: { 
                id: aulaId,
                curso_id: cursoId 
            },
            include: {
                lista: true,
                professor: {
                    select: { id: true, nome: true, foto_perfil: true }
                }
            }
        });

        if (!aula) {
            req.flash('error', 'Aula não encontrada.');
            return res.redirect(`/cursos/${cursoId}/aulas`);
        }

        // Buscar todas as aulas do curso para playlist
        const todasAulas = await prisma.aula.findMany({
            where: { curso_id: cursoId },
            include: { lista: true },
            orderBy: [
                { lista: { ordem: 'asc' } },
                { ordem: 'asc' }
            ]
        });

        // Verificar se aula foi concluída
        let aulaConcluida = false;
        if (req.inscricao) {
            const progresso = await prisma.progresso.findUnique({
                where: {
                    inscricao_id_aula_id: {
                        inscricao_id: req.inscricao.id,
                        aula_id: aulaId
                    }
                }
            });
            aulaConcluida = !!progresso?.concluida;
        }

        // Encontrar próxima aula
        const aulaIndex = todasAulas.findIndex(a => a.id === aulaId);
        const proximaAula = todasAulas[aulaIndex + 1] || null;

        res.render('plataforma/curso/ver_aula', {
            activeTab: 'aulas',
            activeLink: 'cursos',
            aula,
            todasAulas,
            aulaConcluida,
            proximaAula
        });

    } catch (error) {
        console.error('Erro ao carregar aula:', error);
        req.flash('error', 'Erro ao carregar aula.');
        res.redirect(`/cursos/${cursoId}/aulas`);
    }
};

/**
 * GET /cursos/:cursoId/atividades/:atividadeId
 * Renderiza a página de visualização de uma atividade
 */
export const renderVerAtividade = async (req, res) => {
    const cursoId = parseInt(req.params.cursoId);
    const atividadeId = parseInt(req.params.atividadeId);

    try {
        // Buscar a atividade
        const atividade = await prisma.atividade.findFirst({
            where: { 
                id: atividadeId,
                curso_id: cursoId 
            },
            include: {
                lista: true,
                professor: {
                    select: { id: true, nome: true, foto_perfil: true }
                }
            }
        });

        if (!atividade) {
            req.flash('error', 'Atividade não encontrada.');
            return res.redirect(`/cursos/${cursoId}/atividades`);
        }

        // Verificar se atividade foi concluída e obter pontuação
        let atividadeConcluida = false;
        let pontuacao = null;
        if (req.inscricao) {
            const progresso = await prisma.progresso.findUnique({
                where: {
                    inscricao_id_atividade_id: {
                        inscricao_id: req.inscricao.id,
                        atividade_id: atividadeId
                    }
                }
            });
            if (progresso) {
                atividadeConcluida = progresso.concluida;
                pontuacao = progresso.pontuacao_obtida;
            }
        }

        res.render('plataforma/curso/ver_atividade', {
            activeTab: 'atividades',
            activeLink: 'cursos',
            atividade,
            atividadeConcluida,
            pontuacao
        });

    } catch (error) {
        console.error('Erro ao carregar atividade:', error);
        req.flash('error', 'Erro ao carregar atividade.');
        res.redirect(`/cursos/${cursoId}/atividades`);
    }
};