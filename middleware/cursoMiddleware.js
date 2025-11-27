// file: middleware/cursoMiddleware.js
import prisma from '../config/prisma.js';

/**
 * Verifica se o usuário está inscrito no curso
 * Adiciona req.inscricao e req.curso se inscrito
 */
export const eInscrito = async (req, res, next) => {
    const cursoId = parseInt(req.params.cursoId || req.params.id);
    const usuarioId = req.user.id;

    if (isNaN(cursoId)) {
        req.flash('error', 'ID do curso inválido.');
        return res.redirect('/cursos');
    }

    try {
        const curso = await prisma.curso.findUnique({
            where: { id: cursoId },
            include: {
                professor: {
                    select: { id: true, nome: true, email: true, foto_perfil: true }
                }
            }
        });

        if (!curso) {
            req.flash('error', 'Curso não encontrado.');
            return res.redirect('/cursos');
        }

        // Verifica se é o professor/admin do curso
        const eDonoCurso = curso.usuario_id === usuarioId || req.user.tipo === 'administrador';

        // Verifica se está inscrito
        const inscricao = await prisma.inscricao.findUnique({
            where: {
                usuario_id_curso_id: {
                    usuario_id: usuarioId,
                    curso_id: cursoId
                }
            }
        });

        // Permite acesso se for dono ou inscrito
        if (!eDonoCurso && !inscricao) {
            req.flash('error', 'Você não tem acesso a este curso.');
            return res.redirect('/cursos');
        }

        // Anexa informações ao request
        req.curso = curso;
        req.inscricao = inscricao;
        req.eDonoCurso = eDonoCurso;

        next();
    } catch (error) {
        console.error('Erro ao verificar inscrição:', error);
        req.flash('error', 'Erro ao verificar acesso ao curso.');
        return res.redirect('/cursos');
    }
};

/**
 * Verifica se o usuário é dono do curso (professor que criou ou admin)
 */
export const eDonoDoCurso = async (req, res, next) => {
    const cursoId = parseInt(req.params.cursoId || req.params.id);
    const usuarioId = req.user.id;

    if (isNaN(cursoId)) {
        req.flash('error', 'ID do curso inválido.');
        return res.redirect('/cursos');
    }

    try {
        const curso = await prisma.curso.findUnique({
            where: { id: cursoId },
            include: {
                professor: {
                    select: { id: true, nome: true, email: true, foto_perfil: true }
                }
            }
        });

        if (!curso) {
            req.flash('error', 'Curso não encontrado.');
            return res.redirect('/cursos');
        }

        // Verifica se é o professor do curso ou admin
        if (curso.usuario_id !== usuarioId && req.user.tipo !== 'administrador') {
            req.flash('error', 'Você não tem permissão para gerenciar este curso.');
            return res.redirect(`/cursos/${cursoId}/mural`);
        }

        req.curso = curso;
        req.eDonoCurso = true;

        next();
    } catch (error) {
        console.error('Erro ao verificar posse do curso:', error);
        req.flash('error', 'Erro ao verificar permissões.');
        return res.redirect('/cursos');
    }
};

/**
 * Carrega dados do curso para as views (usado em todas as páginas do curso)
 */
export const carregarDadosCurso = async (req, res, next) => {
    const cursoId = parseInt(req.params.cursoId || req.params.id);
    const usuarioId = req.user.id;

    try {
        // Buscar curso com contagens
        const curso = await prisma.curso.findUnique({
            where: { id: cursoId },
            include: {
                professor: {
                    select: { id: true, nome: true, email: true, foto_perfil: true }
                },
                _count: {
                    select: {
                        aulas: true,
                        atividades: true,
                        inscricoes: true
                    }
                }
            }
        });

        if (!curso) {
            req.flash('error', 'Curso não encontrado.');
            return res.redirect('/cursos');
        }

        // Verificar se usuário é dono
        const eDonoCurso = curso.usuario_id === usuarioId || req.user.tipo === 'administrador';

        // Buscar inscrição e progresso se for aluno
        let inscricao = null;
        let progresso = { aulasConcluidas: 0, atividadesConcluidas: 0, percentual: 0 };

        if (!eDonoCurso) {
            inscricao = await prisma.inscricao.findUnique({
                where: {
                    usuario_id_curso_id: {
                        usuario_id: usuarioId,
                        curso_id: cursoId
                    }
                }
            });

            if (inscricao) {
                const [aulasConcluidas, atividadesConcluidas] = await Promise.all([
                    prisma.progresso.count({
                        where: { inscricao_id: inscricao.id, aula_id: { not: null }, concluida: true }
                    }),
                    prisma.progresso.count({
                        where: { inscricao_id: inscricao.id, atividade_id: { not: null }, concluida: true }
                    })
                ]);

                const totalAulas = curso._count.aulas;
                const percentual = totalAulas > 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0;

                progresso = { aulasConcluidas, atividadesConcluidas, percentual };
            }
        }

        // Anexa ao request e locals (para views)
        req.curso = curso;
        req.inscricao = inscricao;
        req.eDonoCurso = eDonoCurso;
        req.progresso = progresso;

        res.locals.curso = curso;
        res.locals.inscricao = inscricao;
        res.locals.eDonoCurso = eDonoCurso;
        res.locals.progresso = progresso;

        next();
    } catch (error) {
        console.error('Erro ao carregar dados do curso:', error);
        req.flash('error', 'Erro ao carregar curso.');
        return res.redirect('/cursos');
    }
};