// file: controllers/cursoController.js
import prisma from '../config/prisma.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

// Verifica se o usuário é dono do curso
const verificarDonoCurso = async (cursoId, usuarioId) => {
    const curso = await prisma.curso.findUnique({
        where: { id: parseInt(cursoId) },
        select: { usuario_id: true }
    });
    return curso && curso.usuario_id === usuarioId;
};

// Busca dados completos do curso
const buscarCursoCompleto = async (cursoId) => {
    return await prisma.curso.findUnique({
        where: { id: parseInt(cursoId) },
        include: {
            professor: {
                select: { id: true, nome: true, email: true, foto_perfil: true, tipo: true }
            },
            _count: {
                select: { aulas: true, atividades: true, inscricoes: true }
            }
        }
    });
};

// Calcula progresso do aluno
const calcularProgresso = async (inscricaoId, totalAulas) => {
    const aulasConcluidas = await prisma.progresso.count({
        where: { inscricao_id: inscricaoId, aula_id: { not: null }, concluida: true }
    });
    const atividadesConcluidas = await prisma.progresso.count({
        where: { inscricao_id: inscricaoId, atividade_id: { not: null } }
    });
    
    const percentual = totalAulas > 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0;
    
    return { aulasConcluidas, atividadesConcluidas, percentual };
};

// ==========================================
// INSCRIÇÃO
// ==========================================

export const inscreverCurso = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const usuarioId = req.user.id;
    const { senha } = req.body;
    
    try {
        const curso = await prisma.curso.findUnique({
            where: { id: cursoId },
            select: { senha_acesso: true, usuario_id: true }
        });
        
        if (!curso) {
            return res.status(404).json({ error: 'Curso não encontrado.' });
        }
        
        // Não pode se inscrever no próprio curso
        if (curso.usuario_id === usuarioId) {
            return res.status(400).json({ error: 'Você é o professor deste curso.' });
        }
        
        // Verificar senha se existir
        if (curso.senha_acesso && curso.senha_acesso !== senha) {
            return res.status(403).json({ error: 'Senha de acesso incorreta.' });
        }
        
        // Criar inscrição
        await prisma.inscricao.create({
            data: {
                usuario_id: usuarioId,
                curso_id: cursoId
            }
        });
        
        res.json({ success: true, message: 'Inscrito com sucesso!' });
        
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Você já está inscrito neste curso.' });
        }
        console.error('Erro ao inscrever:', error);
        res.status(500).json({ error: 'Erro ao processar inscrição.' });
    }
};

export const desinscreverCurso = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const usuarioId = req.user.id;
    
    try {
        await prisma.inscricao.delete({
            where: {
                usuario_id_curso_id: {
                    usuario_id: usuarioId,
                    curso_id: cursoId
                }
            }
        });
        
        res.json({ success: true, message: 'Desinscrição realizada.' });
        
    } catch (error) {
        console.error('Erro ao desinscrever:', error);
        res.status(500).json({ error: 'Erro ao processar desinscrição.' });
    }
};

// ==========================================
// MURAL
// ==========================================

export const renderMural = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const usuarioId = req.user.id;
    
    try {
        const curso = await buscarCursoCompleto(cursoId);
        if (!curso) {
            return res.status(404).render('404_app', { message: 'Curso não encontrado.' });
        }
        
        const eDonoCurso = curso.usuario_id === usuarioId;
        
        // Verificar se está inscrito (se não for dono)
        let inscricao = null;
        let progresso = { aulasConcluidas: 0, atividadesConcluidas: 0, percentual: 0 };
        
        if (!eDonoCurso) {
            inscricao = await prisma.inscricao.findUnique({
                where: {
                    usuario_id_curso_id: { usuario_id: usuarioId, curso_id: cursoId }
                }
            });
            
            if (!inscricao && req.user.tipo !== 'administrador') {
                return res.redirect('/cursos?error=nao_inscrito');
            }
            
            if (inscricao) {
                progresso = await calcularProgresso(inscricao.id, curso._count.aulas);
            }
        }
        
        // Buscar publicações
        const publicacoes = await prisma.publicacao.findMany({
            where: { curso_id: cursoId },
            include: {
                autor: { select: { id: true, nome: true, foto_perfil: true, tipo: true } },
                comentarios: {
                    include: {
                        autor: { select: { id: true, nome: true, foto_perfil: true, tipo: true } }
                    },
                    orderBy: { data_criacao: 'asc' }
                }
            },
            orderBy: { data_criacao: 'desc' }
        });
        
        res.render('plataforma/curso/mural', {
            curso,
            publicacoes,
            eDonoCurso,
            inscricao,
            progresso,
            activeTab: 'mural',
            activeLink: 'cursos'
        });
        
    } catch (error) {
        console.error('Erro ao carregar mural:', error);
        res.status(500).render('404_app', { message: 'Erro ao carregar o mural.' });
    }
};

export const criarPublicacao = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const usuarioId = req.user.id;
    const { conteudo } = req.body;
    
    if (!conteudo || !conteudo.trim()) {
        return res.status(400).json({ error: 'Conteúdo não pode estar vazio.' });
    }
    
    try {
        const publicacao = await prisma.publicacao.create({
            data: {
                conteudo: conteudo.trim(),
                curso_id: cursoId,
                usuario_id: usuarioId
            }
        });
        
        res.status(201).json(publicacao);
        
    } catch (error) {
        console.error('Erro ao criar publicação:', error);
        res.status(500).json({ error: 'Erro ao criar publicação.' });
    }
};

export const editarPublicacao = async (req, res) => {
    const pubId = parseInt(req.params.pubId);
    const usuarioId = req.user.id;
    const { conteudo } = req.body;
    
    try {
        const publicacao = await prisma.publicacao.findUnique({
            where: { id: pubId },
            select: { usuario_id: true }
        });
        
        if (!publicacao) {
            return res.status(404).json({ error: 'Publicação não encontrada.' });
        }
        
        if (publicacao.usuario_id !== usuarioId && req.user.tipo !== 'administrador') {
            return res.status(403).json({ error: 'Sem permissão.' });
        }
        
        const atualizada = await prisma.publicacao.update({
            where: { id: pubId },
            data: { conteudo }
        });
        
        res.json(atualizada);
        
    } catch (error) {
        console.error('Erro ao editar publicação:', error);
        res.status(500).json({ error: 'Erro ao editar publicação.' });
    }
};

export const deletarPublicacao = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const pubId = parseInt(req.params.pubId);
    const usuarioId = req.user.id;
    
    try {
        const publicacao = await prisma.publicacao.findUnique({
            where: { id: pubId },
            select: { usuario_id: true, curso_id: true }
        });
        
        if (!publicacao) {
            return res.status(404).json({ error: 'Publicação não encontrada.' });
        }
        
        const eDonoCurso = await verificarDonoCurso(cursoId, usuarioId);
        
        if (publicacao.usuario_id !== usuarioId && !eDonoCurso && req.user.tipo !== 'administrador') {
            return res.status(403).json({ error: 'Sem permissão.' });
        }
        
        await prisma.publicacao.delete({ where: { id: pubId } });
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Erro ao deletar publicação:', error);
        res.status(500).json({ error: 'Erro ao deletar publicação.' });
    }
};

export const criarComentario = async (req, res) => {
    const pubId = parseInt(req.params.pubId);
    const usuarioId = req.user.id;
    const { conteudo } = req.body;
    
    if (!conteudo || !conteudo.trim()) {
        return res.status(400).json({ error: 'Comentário não pode estar vazio.' });
    }
    
    try {
        const comentario = await prisma.comentario.create({
            data: {
                conteudo: conteudo.trim(),
                publicacao_id: pubId,
                usuario_id: usuarioId
            }
        });
        
        res.status(201).json(comentario);
        
    } catch (error) {
        console.error('Erro ao criar comentário:', error);
        res.status(500).json({ error: 'Erro ao criar comentário.' });
    }
};

export const deletarComentario = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const comId = parseInt(req.params.comId);
    const usuarioId = req.user.id;
    
    try {
        const comentario = await prisma.comentario.findUnique({
            where: { id: comId },
            select: { usuario_id: true }
        });
        
        if (!comentario) {
            return res.status(404).json({ error: 'Comentário não encontrado.' });
        }
        
        const eDonoCurso = await verificarDonoCurso(cursoId, usuarioId);
        
        if (comentario.usuario_id !== usuarioId && !eDonoCurso && req.user.tipo !== 'administrador') {
            return res.status(403).json({ error: 'Sem permissão.' });
        }
        
        await prisma.comentario.delete({ where: { id: comId } });
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Erro ao deletar comentário:', error);
        res.status(500).json({ error: 'Erro ao deletar comentário.' });
    }
};

// ==========================================
// AULAS
// ==========================================

export const renderAulas = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const usuarioId = req.user.id;
    
    try {
        const curso = await buscarCursoCompleto(cursoId);
        if (!curso) {
            return res.status(404).render('404_app', { message: 'Curso não encontrado.' });
        }
        
        const eDonoCurso = curso.usuario_id === usuarioId;
        
        let inscricao = null;
        let progresso = { aulasConcluidas: 0, atividadesConcluidas: 0, percentual: 0 };
        let aulasConcluidasIds = [];
        
        if (!eDonoCurso) {
            inscricao = await prisma.inscricao.findUnique({
                where: { usuario_id_curso_id: { usuario_id: usuarioId, curso_id: cursoId } }
            });
            
            if (!inscricao && req.user.tipo !== 'administrador') {
                return res.redirect('/cursos?error=nao_inscrito');
            }
            
            if (inscricao) {
                progresso = await calcularProgresso(inscricao.id, curso._count.aulas);
                
                const progressos = await prisma.progresso.findMany({
                    where: { inscricao_id: inscricao.id, aula_id: { not: null }, concluida: true },
                    select: { aula_id: true }
                });
                aulasConcluidasIds = progressos.map(p => p.aula_id);
            }
        }
        
        // Buscar listas com aulas
        const listas = await prisma.lista.findMany({
            where: { curso_id: cursoId },
            include: {
                aulas: { orderBy: { ordem: 'asc' } }
            },
            orderBy: { ordem: 'asc' }
        });
        
        // Buscar aulas sem lista
        const aulasSemLista = await prisma.aula.findMany({
            where: { curso_id: cursoId, lista_id: null },
            orderBy: { ordem: 'asc' }
        });
        
        res.render('plataforma/curso/aulas', {
            curso,
            listas,
            aulasSemLista,
            eDonoCurso,
            inscricao,
            progresso,
            aulasConcluidasIds,
            activeTab: 'aulas',
            activeLink: 'cursos'
        });
        
    } catch (error) {
        console.error('Erro ao carregar aulas:', error);
        res.status(500).render('404_app', { message: 'Erro ao carregar aulas.' });
    }
};

export const criarAula = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const usuarioId = req.user.id;
    const { titulo, descricao, lista_id, data_prazo, duracao } = req.body;
    
    try {
        const eDono = await verificarDonoCurso(cursoId, usuarioId);
        if (!eDono && req.user.tipo !== 'administrador') {
            return res.status(403).json({ error: 'Sem permissão.' });
        }
        
        const video = req.files?.video?.[0]?.filename;
        const capa = req.files?.capa_aula?.[0]?.filename;
        
        if (!video) {
            return res.status(400).json({ error: 'Vídeo é obrigatório.' });
        }
        
        const aula = await prisma.aula.create({
        data: {
        titulo,
        descricao,
        video,
        capa_aula: capa,
        duracao: duracao ? parseInt(duracao) : null,
        data_prazo: data_prazo ? new Date(data_prazo) : null,
        curso: {
            connect: { id: cursoId }
        },
        criador: {
            connect: { id: usuarioId }
        },
            lista: lista_id ? { connect: { id: parseInt(lista_id) } } : undefined
        }
        });
        
        // Criar notificação para alunos inscritos
        const inscricoes = await prisma.inscricao.findMany({
            where: { curso_id: cursoId },
            select: { usuario_id: true }
        });
        
        if (inscricoes.length > 0) {
            await prisma.notificacao.createMany({
                data: inscricoes.map(i => ({
                    usuario_id: i.usuario_id,
                    tipo: 'nova_aula',
                    titulo: 'Nova aula disponível',
                    mensagem: `A aula "${titulo}" foi adicionada ao curso.`,
                    link: `/cursos/${cursoId}/aulas/${aula.id}`
                }))
            });
        }
        
        res.status(201).json(aula);
        
    } catch (error) {
        console.error('Erro ao criar aula:', error);
        res.status(500).json({ error: 'Erro ao criar aula.' });
    }
};

export const renderVerAula = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const aulaId = parseInt(req.params.aulaId);
    const usuarioId = req.user.id;
    
    try {
        const curso = await buscarCursoCompleto(cursoId);
        if (!curso) {
            return res.status(404).render('404_app', { message: 'Curso não encontrado.' });
        }
        
        const aula = await prisma.aula.findUnique({
            where: { id: aulaId },
            include: { lista: true }
        });
        
        if (!aula || aula.curso_id !== cursoId) {
            return res.status(404).render('404_app', { message: 'Aula não encontrada.' });
        }
        
        const eDonoCurso = curso.usuario_id === usuarioId;
        
        let inscricao = null;
        let aulaConcluida = false;
        let aulasConcluidasIds = [];
        let progresso = { aulasConcluidas: 0, atividadesConcluidas: 0, percentual: 0 };
        
        if (!eDonoCurso) {
            inscricao = await prisma.inscricao.findUnique({
                where: { usuario_id_curso_id: { usuario_id: usuarioId, curso_id: cursoId } }
            });
            
            if (!inscricao && req.user.tipo !== 'administrador') {
                return res.redirect('/cursos?error=nao_inscrito');
            }
            
            if (inscricao) {
                progresso = await calcularProgresso(inscricao.id, curso._count.aulas);
                
                const progressos = await prisma.progresso.findMany({
                    where: { inscricao_id: inscricao.id, aula_id: { not: null }, concluida: true },
                    select: { aula_id: true }
                });
                aulasConcluidasIds = progressos.map(p => p.aula_id);
                aulaConcluida = aulasConcluidasIds.includes(aulaId);
            }
        }
        
        // Buscar todas as aulas para playlist
        const todasAulas = await prisma.aula.findMany({
            where: { curso_id: cursoId },
            orderBy: [{ lista_id: 'asc' }, { ordem: 'asc' }]
        });
        
        // Próxima aula
        const aulaAtualIndex = todasAulas.findIndex(a => a.id === aulaId);
        const proximaAula = todasAulas[aulaAtualIndex + 1] || null;
        
        res.render('plataforma/curso/ver_aula', {
            curso,
            aula,
            todasAulas,
            proximaAula,
            eDonoCurso,
            inscricao,
            aulaConcluida,
            aulasConcluidasIds,
            progresso,
            activeTab: 'aulas',
            activeLink: 'cursos'
        });
        
    } catch (error) {
        console.error('Erro ao carregar aula:', error);
        res.status(500).render('404_app', { message: 'Erro ao carregar aula.' });
    }
};

export const concluirAula = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const aulaId = parseInt(req.params.aulaId);
    const usuarioId = req.user.id;
    
    try {
        const inscricao = await prisma.inscricao.findUnique({
            where: { usuario_id_curso_id: { usuario_id: usuarioId, curso_id: cursoId } }
        });
        
        if (!inscricao) {
            return res.status(403).json({ error: 'Não inscrito neste curso.' });
        }
        
        await prisma.progresso.create({
            data: {
                inscricao_id: inscricao.id,
                aula_id: aulaId,
                concluida: true
            }
        });
        
        res.json({ success: true });
        
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Aula já concluída.' });
        }
        console.error('Erro ao concluir aula:', error);
        res.status(500).json({ error: 'Erro ao marcar aula como concluída.' });
    }
};

export const deletarAula = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const aulaId = parseInt(req.params.aulaId);
    const usuarioId = req.user.id;
    
    try {
        const eDono = await verificarDonoCurso(cursoId, usuarioId);
        if (!eDono && req.user.tipo !== 'administrador') {
            return res.status(403).json({ error: 'Sem permissão.' });
        }
        
        const aula = await prisma.aula.findUnique({
            where: { id: aulaId },
            select: { video: true, capa_aula: true }
        });
        
        await prisma.aula.delete({ where: { id: aulaId } });
        
        // Deletar arquivos
        if (aula?.video) {
            const videoPath = path.join(projectRoot, 'public', 'uploads', 'videos', aula.video);
            if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        }
        if (aula?.capa_aula) {
            const capaPath = path.join(projectRoot, 'public', 'uploads', 'images', aula.capa_aula);
            if (fs.existsSync(capaPath)) fs.unlinkSync(capaPath);
        }
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Erro ao deletar aula:', error);
        res.status(500).json({ error: 'Erro ao deletar aula.' });
    }
};

// ==========================================
// ATIVIDADES
// ==========================================

export const renderAtividades = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const usuarioId = req.user.id;
    
    try {
        const curso = await buscarCursoCompleto(cursoId);
        if (!curso) {
            return res.status(404).render('404_app', { message: 'Curso não encontrado.' });
        }
        
        const eDonoCurso = curso.usuario_id === usuarioId;
        
        let inscricao = null;
        let progresso = { aulasConcluidas: 0, atividadesConcluidas: 0, percentual: 0 };
        let atividadesConcluidasIds = [];
        
        if (!eDonoCurso) {
            inscricao = await prisma.inscricao.findUnique({
                where: { usuario_id_curso_id: { usuario_id: usuarioId, curso_id: cursoId } }
            });
            
            if (!inscricao && req.user.tipo !== 'administrador') {
                return res.redirect('/cursos?error=nao_inscrito');
            }
            
            if (inscricao) {
                progresso = await calcularProgresso(inscricao.id, curso._count.aulas);
                
                const progressos = await prisma.progresso.findMany({
                    where: { inscricao_id: inscricao.id, atividade_id: { not: null } },
                    select: { atividade_id: true }
                });
                atividadesConcluidasIds = progressos.map(p => p.atividade_id);
            }
        }
        
        // Buscar listas com atividades e materiais
        const listas = await prisma.lista.findMany({
            where: { curso_id: cursoId },
            include: {
                atividades: { orderBy: { ordem: 'asc' } },
                materiais: { orderBy: { ordem: 'asc' } }
            },
            orderBy: { ordem: 'asc' }
        });
        
        // Atividades sem lista
        const atividadesSemLista = await prisma.atividade.findMany({
            where: { curso_id: cursoId, lista_id: null },
            orderBy: { ordem: 'asc' }
        });
        
        // Materiais sem lista
        const materiaisSemLista = await prisma.material.findMany({
            where: { curso_id: cursoId, lista_id: null },
            orderBy: { ordem: 'asc' }
        });
        
        res.render('plataforma/curso/atividades', {
            curso,
            listas,
            atividadesSemLista,
            materiaisSemLista,
            eDonoCurso,
            inscricao,
            progresso,
            atividadesConcluidasIds,
            activeTab: 'atividades',
            activeLink: 'cursos'
        });
        
    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        res.status(500).render('404_app', { message: 'Erro ao carregar atividades.' });
    }
};

export const criarAtividade = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const usuarioId = req.user.id;
    const { titulo, descricao, lista_id, data_prazo, conteudo } = req.body;
    
    try {
        const eDono = await verificarDonoCurso(cursoId, usuarioId);
        if (!eDono && req.user.tipo !== 'administrador') {
            return res.status(403).json({ error: 'Sem permissão.' });
        }
        
        const atividade = await prisma.atividade.create({
        data: {
        titulo,
        descricao,
        conteudo: conteudo || {},
        data_prazo: data_prazo ? new Date(data_prazo) : null,
        curso: {
            connect: { id: cursoId }
        },
        criador: {
            connect: { id: usuarioId }
        },
            lista: lista_id ? { connect: { id: parseInt(lista_id) } } : undefined
         }
        });
        
        // Criar notificação para alunos
        const inscricoes = await prisma.inscricao.findMany({
            where: { curso_id: cursoId },
            select: { usuario_id: true }
        });
        
        if (inscricoes.length > 0) {
            await prisma.notificacao.createMany({
                data: inscricoes.map(i => ({
                    usuario_id: i.usuario_id,
                    tipo: 'nova_atividade',
                    titulo: 'Nova atividade disponível',
                    mensagem: `A atividade "${titulo}" foi adicionada ao curso.`,
                    link: `/cursos/${cursoId}/atividades/${atividade.id}`
                }))
            });
        }
        
        res.status(201).json(atividade);
        
    } catch (error) {
        console.error('Erro ao criar atividade:', error);
        res.status(500).json({ error: 'Erro ao criar atividade.' });
    }
};

export const renderVerAtividade = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const atividadeId = parseInt(req.params.atividadeId);
    const usuarioId = req.user.id;
    
    try {
        const curso = await buscarCursoCompleto(cursoId);
        if (!curso) {
            return res.status(404).render('404_app', { message: 'Curso não encontrado.' });
        }
        
        const atividade = await prisma.atividade.findUnique({
            where: { id: atividadeId },
            include: { lista: true }
        });
        
        if (!atividade || atividade.curso_id !== cursoId) {
            return res.status(404).render('404_app', { message: 'Atividade não encontrada.' });
        }
        
        const eDonoCurso = curso.usuario_id === usuarioId;
        
        let inscricao = null;
        let atividadeConcluida = false;
        let pontuacao = null;
        let progresso = { aulasConcluidas: 0, atividadesConcluidas: 0, percentual: 0 };
        
        if (!eDonoCurso) {
            inscricao = await prisma.inscricao.findUnique({
                where: { usuario_id_curso_id: { usuario_id: usuarioId, curso_id: cursoId } }
            });
            
            if (!inscricao && req.user.tipo !== 'administrador') {
                return res.redirect('/cursos?error=nao_inscrito');
            }
            
            if (inscricao) {
                progresso = await calcularProgresso(inscricao.id, curso._count.aulas);
                
                const progressoAtividade = await prisma.progresso.findFirst({
                    where: { inscricao_id: inscricao.id, atividade_id: atividadeId }
                });
                
                if (progressoAtividade) {
                    atividadeConcluida = true;
                    pontuacao = progressoAtividade.pontuacao;
                }
            }
        }
        
        res.render('plataforma/curso/ver_atividade', {
            curso,
            atividade,
            eDonoCurso,
            inscricao,
            atividadeConcluida,
            pontuacao,
            progresso,
            activeTab: 'atividades',
            activeLink: 'cursos'
        });
        
    } catch (error) {
        console.error('Erro ao carregar atividade:', error);
        res.status(500).render('404_app', { message: 'Erro ao carregar atividade.' });
    }
};

export const submeterAtividade = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const atividadeId = parseInt(req.params.atividadeId);
    const usuarioId = req.user.id;
    const { respostas } = req.body;
    
    try {
        const inscricao = await prisma.inscricao.findUnique({
            where: { usuario_id_curso_id: { usuario_id: usuarioId, curso_id: cursoId } }
        });
        
        if (!inscricao) {
            return res.status(403).json({ error: 'Não inscrito neste curso.' });
        }
        
        const atividade = await prisma.atividade.findUnique({
            where: { id: atividadeId }
        });
        
        if (!atividade) {
            return res.status(404).json({ error: 'Atividade não encontrada.' });
        }
        
        // Calcular pontuação
        let acertos = 0;
        const perguntas = atividade.conteudo?.perguntas || [];
        
        perguntas.forEach(p => {
            if (respostas[p.id] === p.resposta_correta) {
                acertos++;
            }
        });
        
        const pontuacao = perguntas.length > 0 ? Math.round((acertos / perguntas.length) * 100) : 0;
        
        await prisma.progresso.create({
            data: {
                inscricao_id: inscricao.id,
                atividade_id: atividadeId,
                pontuacao: pontuacao
            }
        });
        
        res.json({ success: true, pontuacao, acertos, total: perguntas.length });
        
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Atividade já submetida.' });
        }
        console.error('Erro ao submeter atividade:', error);
        res.status(500).json({ error: 'Erro ao submeter atividade.' });
    }
};

export const deletarAtividade = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const atividadeId = parseInt(req.params.atividadeId);
    const usuarioId = req.user.id;
    
    try {
        const eDono = await verificarDonoCurso(cursoId, usuarioId);
        if (!eDono && req.user.tipo !== 'administrador') {
            return res.status(403).json({ error: 'Sem permissão.' });
        }
        
        await prisma.atividade.delete({ where: { id: atividadeId } });
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Erro ao deletar atividade:', error);
        res.status(500).json({ error: 'Erro ao deletar atividade.' });
    }
};

// ==========================================
// MATERIAIS
// ==========================================

export const renderMateriais = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const usuarioId = req.user.id;
    
    try {
        const curso = await buscarCursoCompleto(cursoId);
        if (!curso) {
            return res.status(404).render('404_app', { message: 'Curso não encontrado.' });
        }
        
        const eDonoCurso = curso.usuario_id === usuarioId;
        
        let inscricao = null;
        let progresso = { aulasConcluidas: 0, atividadesConcluidas: 0, percentual: 0 };
        
        if (!eDonoCurso) {
            inscricao = await prisma.inscricao.findUnique({
                where: { usuario_id_curso_id: { usuario_id: usuarioId, curso_id: cursoId } }
            });
            
            if (!inscricao && req.user.tipo !== 'administrador') {
                return res.redirect('/cursos?error=nao_inscrito');
            }
            
            if (inscricao) {
                progresso = await calcularProgresso(inscricao.id, curso._count.aulas);
            }
        }
        
        // Buscar listas com materiais
        const listas = await prisma.lista.findMany({
            where: { curso_id: cursoId },
            include: {
                materiais: { orderBy: { ordem: 'asc' } }
            },
            orderBy: { ordem: 'asc' }
        });
        
        // Materiais sem lista
        const materiaisSemLista = await prisma.material.findMany({
            where: { curso_id: cursoId, lista_id: null },
            orderBy: { ordem: 'asc' }
        });
        
        res.render('plataforma/curso/materiais', {
            curso,
            listas,
            materiaisSemLista,
            eDonoCurso,
            inscricao,
            progresso,
            activeTab: 'materiais',
            activeLink: 'cursos'
        });
        
    } catch (error) {
        console.error('Erro ao carregar materiais:', error);
        res.status(500).render('404_app', { message: 'Erro ao carregar materiais.' });
    }
};

export const criarMaterial = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const usuarioId = req.user.id;
    const { titulo, descricao, lista_id } = req.body;
    
    try {
        const eDono = await verificarDonoCurso(cursoId, usuarioId);
        if (!eDono && req.user.tipo !== 'administrador') {
            return res.status(403).json({ error: 'Sem permissão.' });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: 'Arquivo é obrigatório.' });
        }
        
        const arquivo = req.file.filename;
        const tipoArquivo = path.extname(req.file.originalname).slice(1).toLowerCase();
        const tamanho = req.file.size;
        
        const material = await prisma.material.create({
                data: {
                titulo,
                descricao,
                arquivo,
                tipo_arquivo: tipoArquivo,
                tamanho,
                curso: {
                    connect: { id: cursoId }
                },
                    criador: {
                    connect: { id: usuarioId }
                },
                     lista: lista_id ? { connect: { id: parseInt(lista_id) } } : undefined
                }

        });
        
        res.status(201).json(material);
        
    } catch (error) {
        console.error('Erro ao criar material:', error);
        res.status(500).json({ error: 'Erro ao criar material.' });
    }
};

export const downloadMaterial = async (req, res) => {
    const materialId = parseInt(req.params.materialId);
    
    try {
        const material = await prisma.material.findUnique({
            where: { id: materialId }
        });
        
        if (!material) {
            return res.status(404).json({ error: 'Material não encontrado.' });
        }
        
        const filePath = path.join(projectRoot, 'public', 'uploads', 'materials', material.arquivo);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Arquivo não encontrado.' });
        }
        
        res.download(filePath, `${material.titulo}.${material.tipo_arquivo}`);
        
    } catch (error) {
        console.error('Erro ao baixar material:', error);
        res.status(500).json({ error: 'Erro ao baixar material.' });
    }
};

export const deletarMaterial = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const materialId = parseInt(req.params.materialId);
    const usuarioId = req.user.id;
    
    try {
        const eDono = await verificarDonoCurso(cursoId, usuarioId);
        if (!eDono && req.user.tipo !== 'administrador') {
            return res.status(403).json({ error: 'Sem permissão.' });
        }
        
        const material = await prisma.material.findUnique({
            where: { id: materialId },
            select: { arquivo: true }
        });
        
        await prisma.material.delete({ where: { id: materialId } });
        
        // Deletar arquivo
        if (material?.arquivo) {
            const filePath = path.join(projectRoot, 'public', 'uploads', 'materials', material.arquivo);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Erro ao deletar material:', error);
        res.status(500).json({ error: 'Erro ao deletar material.' });
    }
};

// ==========================================
// PESSOAS
// ==========================================

export const renderPessoas = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const usuarioId = req.user.id;
    
    try {
        const curso = await buscarCursoCompleto(cursoId);
        if (!curso) {
            return res.status(404).render('404_app', { message: 'Curso não encontrado.' });
        }
        
        const eDonoCurso = curso.usuario_id === usuarioId;
        
        let inscricao = null;
        let progresso = { aulasConcluidas: 0, atividadesConcluidas: 0, percentual: 0 };
        
        if (!eDonoCurso) {
            inscricao = await prisma.inscricao.findUnique({
                where: { usuario_id_curso_id: { usuario_id: usuarioId, curso_id: cursoId } }
            });
            
            if (!inscricao && req.user.tipo !== 'administrador') {
                return res.redirect('/cursos?error=nao_inscrito');
            }
            
            if (inscricao) {
                progresso = await calcularProgresso(inscricao.id, curso._count.aulas);
            }
        }
        
        // Buscar alunos inscritos
        const inscricoes = await prisma.inscricao.findMany({
            where: { curso_id: cursoId },
            include: {
                aluno: { select: { id: true, nome: true, email: true, foto_perfil: true, tipo: true } }
            },
            orderBy: { data_inscricao: 'asc' }
        });
        
        // Separar alunos de professores inscritos
        const alunos = inscricoes.filter(i => i.aluno.tipo === 'aluno');
        const professoresInscritos = inscricoes.filter(i => i.aluno.tipo === 'professor');
        
        res.render('plataforma/curso/pessoas', {
            curso,
            alunos,
            professoresInscritos,
            eDonoCurso,
            inscricao,
            progresso,
            activeTab: 'pessoas',
            activeLink: 'cursos'
        });
        
    } catch (error) {
        console.error('Erro ao carregar pessoas:', error);
        res.status(500).render('404_app', { message: 'Erro ao carregar pessoas.' });
    }
};

// ==========================================
// LISTAS
// ==========================================

export const listarListas = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    
    try {
        const listas = await prisma.lista.findMany({
            where: { curso_id: cursoId },
            orderBy: { ordem: 'asc' }
        });
        
        res.json(listas);
        
    } catch (error) {
        console.error('Erro ao listar listas:', error);
        res.status(500).json({ error: 'Erro ao buscar listas.' });
    }
};

export const criarLista = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const usuarioId = req.user.id;
    const { titulo, descricao } = req.body;
    
    try {
        const eDono = await verificarDonoCurso(cursoId, usuarioId);
        if (!eDono && req.user.tipo !== 'administrador') {
            return res.status(403).json({ error: 'Sem permissão.' });
        }
        
        const lista = await prisma.lista.create({
            data: {
                titulo,
                descricao,
                curso: {
                    connect: { id: cursoId }
                }
            }
        });
        
        res.status(201).json(lista);
        
    } catch (error) {
        console.error('Erro ao criar lista:', error);
        res.status(500).json({ error: 'Erro ao criar lista.' });
    }
};

export const deletarLista = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    const listaId = parseInt(req.params.listaId);
    const usuarioId = req.user.id;
    
    try {
        const eDono = await verificarDonoCurso(cursoId, usuarioId);
        if (!eDono && req.user.tipo !== 'administrador') {
            return res.status(403).json({ error: 'Sem permissão.' });
        }
        
        await prisma.lista.delete({ where: { id: listaId } });
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Erro ao deletar lista:', error);
        res.status(500).json({ error: 'Erro ao deletar lista.' });
    }
};

// ==========================================
// FUNÇÕES EXISTENTES (manter as que já existem)
// ==========================================

// renderMeusCursos, renderFormCurso, criarCurso, 
// renderFormEdicaoCurso, atualizarCurso, deletarCurso
// ... (manter as funções existentes)



// Rota: GET /cursos (Renderiza a página "Meus Cursos")
export const renderMeusCursos = async (req, res) => {
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
            orderBy: {
                id: 'desc' 
            }
        });
        
        res.render('plataforma/meus_cursos', {
            cursos: cursos,
            activeLink: 'meus_cursos', 
            error: req.query.error 
        });
    } catch (error) {
        console.error("Erro ao buscar 'Meus Cursos':", error);
        res.status(500).send("Erro ao carregar a página de cursos.");
    }
};

// Rota: GET /cursos/novo (Renderiza o formulário para criar um novo curso)
export const renderFormCurso = (req, res) => {
    try {
        res.render('plataforma/form_curso', {
            curso: null, 
            pageTitle: 'Criar Novo Curso',
            error: null,
            activeLink: 'meus_cursos'
        });
    } catch (error) {
        console.error("Erro ao renderizar formulário de curso:", error);
        res.status(500).send("Erro ao carregar a página.");
    }
};

// Rota: GET /cursos/:id/editar (Renderiza o formulário de edição)
export const renderFormEdicaoCurso = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    if (isNaN(cursoId)) {
        return res.status(400).render('404_app', { message: 'ID de curso inválido.' });
    }
    
    // CORREÇÃO: Alterado de req.session.usuario para req.user
    const usuarioId = req.user.id;
    const usuarioTipo = req.user.tipo;

    try {
        const curso = await prisma.curso.findUnique({
            where: { id: cursoId },
        });
        
        if (!curso) {
            return res.status(404).render('404_app', { message: 'Curso não encontrado.' });
        }

        // Verifica permissão: Dono do curso ou Admin?
        if (curso.usuario_id !== usuarioId && usuarioTipo !== 'administrador') {
            return res.status(403).redirect('/cursos?error=permission');
        }

        res.render('plataforma/form_curso', {
            curso: curso, 
            pageTitle: 'Editar Curso', 
            error: null,
            activeLink: 'meus_cursos'
        });
    } catch (error) {
        console.error("Erro ao buscar curso para edição:", error);
        res.status(500).send("Erro ao carregar a página de edição.");
    }
};


// --- Funções de Criação (Create) ---

// Rota: POST /cursos/novo (Processa a criação do curso)
export const criarCurso = async (req, res) => {
    const { titulo, materia, descricao } = req.body;
    
    // CORREÇÃO: Alterado de req.session.usuario.id para req.user.id
    const professorId = req.user.id;

    if (!req.file) {
        return res.status(400).render('plataforma/form_curso', {
            error: 'A imagem da capa é obrigatória.',
            curso: { titulo, materia, descricao }, 
            pageTitle: 'Criar Novo Curso',
            activeLink: 'meus_cursos'
        });
    }
    
    const capa_curso = req.file.filename;

    try {
        await prisma.curso.create({
            data: {
                titulo,
                materia,
                descricao: descricao || null, 
                capa_curso,
                usuario_id: professorId 
            }
        });
        
        res.redirect('/cursos');
    } catch (error) {
        console.error("Erro ao criar curso:", error);
        res.status(500).render('plataforma/form_curso', {
            error: 'Erro ao salvar o curso. Tente novamente.',
            curso: { titulo, materia, descricao }, 
            pageTitle: 'Criar Novo Curso',
            activeLink: 'meus_cursos'
        });
    }
};


// --- Funções de Atualização (Update) ---

// Rota: POST /cursos/:id/editar (Processa a atualização do curso)
export const atualizarCurso = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    if (isNaN(cursoId)) {
        return res.status(400).render('404_app', { message: 'ID de curso inválido.' });
    }

    // CORREÇÃO: Alterado de req.session.usuario para req.user
    const usuarioId = req.user.id;
    const usuarioTipo = req.user.tipo;
    
    const { titulo, materia, descricao } = req.body;
    const novaCapa = req.file?.filename;

    try {
        const cursoExistente = await prisma.curso.findUnique({
            where: { id: cursoId },
            select: { usuario_id: true, capa_curso: true }
        });
        
        if (!cursoExistente) {
            return res.status(404).render('404_app', { message: 'Curso não encontrado.' });
        }

        if (cursoExistente.usuario_id !== usuarioId && usuarioTipo !== 'administrador') {
            return res.status(403).send("Você não tem permissão para editar este curso.");
        }

        const dadosAtualizacao = {
            titulo,
            materia,
            descricao: descricao || null,
        };

        if (novaCapa) {
            dadosAtualizacao.capa_curso = novaCapa;

            if (cursoExistente.capa_curso) {
                const caminhoImagemAntiga = path.join(projectRoot, 'public', 'uploads', 'images', cursoExistente.capa_curso);
                 if (fs.existsSync(caminhoImagemAntiga)) {
                     fs.unlink(caminhoImagemAntiga, (err) => { 
                         if (err) console.error("Erro ao deletar imagem antiga:", err);
                         else console.log("Imagem antiga deletada:", cursoExistente.capa_curso);
                     });
                 } else {
                     console.warn("Arquivo de imagem antiga não encontrado:", caminhoImagemAntiga);
                 }
            }
        }

        await prisma.curso.update({
            where: { id: cursoId },
            data: dadosAtualizacao,
        });
        
        res.redirect('/cursos');
        
    } catch (error) {
        console.error("Erro ao atualizar curso:", error);
        const cursoParaForm = await prisma.curso.findUnique({ where: { id: cursoId } });
        res.status(500).render('plataforma/form_curso', {
            error: 'Erro ao salvar as alterações. Tente novamente.',
            curso: cursoParaForm || { id: cursoId, titulo, materia, descricao, capa_curso: cursoExistente?.capa_curso },
            pageTitle: 'Editar Curso',
            activeLink: 'meus_cursos'
        });
    }
};


// --- Funções de Deleção (Delete) ---

// Rota: POST /cursos/:id/deletar
export const deletarCurso = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    if (isNaN(cursoId)) {
        return res.status(400).redirect('/cursos?error=invalidid');
    }

    // CORREÇÃO: Alterado de req.session.usuario para req.user
    const usuarioId = req.user.id;
    const usuarioTipo = req.user.tipo;

    try {
        const cursoParaDeletar = await prisma.curso.findUnique({
            where: { id: cursoId },
            select: { usuario_id: true, capa_curso: true } 
        });
        
        if (!cursoParaDeletar) {
            return res.status(404).redirect('/cursos?error=notfound');
        }

        if (cursoParaDeletar.usuario_id !== usuarioId && usuarioTipo !== 'administrador') {
            return res.status(403).redirect('/cursos?error=permission');
        }

        // Assumindo 'onDelete: Cascade' no schema
        await prisma.curso.delete({
            where: { id: cursoId },
        });
        
        if (cursoParaDeletar.capa_curso) {
            const caminhoImagem = path.join(projectRoot, 'public', 'uploads', 'images', cursoParaDeletar.capa_curso);
            if (fs.existsSync(caminhoImagem)) {
                fs.unlink(caminhoImagem, (err) => {
                    if (err) console.error("Erro ao deletar imagem do curso:", err);
                    else console.log("Imagem do curso deletada:", cursoParaDeletar.capa_curso);
                });
            } else {
                 console.warn("Arquivo de imagem não encontrado para deletar:", caminhoImagem);
            }
        }

        res.redirect('/cursos');
        
    } catch (error) {
        console.error("Erro ao deletar curso:", error);
        if (error.code === 'P2003' || error.code === 'P2014') { 
             console.error("ERRO: Não foi possível deletar o curso devido a registros relacionados.");
             return res.status(409).redirect('/cursos?error=relatedrecords');
        }
        res.status(500).redirect('/cursos?error=deletefailed');
    }
};

/**
 * POST /cursos/criar
 * Cria um novo curso via modal (API - retorna JSON)
 */
export const criarCursoApi = async (req, res) => {
    const { titulo, materia, descricao, senha_acesso } = req.body;
    const usuarioId = req.user.id;
    const capa_curso = req.file?.filename;

    // Validações
    if (!titulo || titulo.trim() === '') {
        return res.status(400).json({ error: 'O título do curso é obrigatório.' });
    }

    if (!materia || materia.trim() === '') {
        return res.status(400).json({ error: 'A matéria do curso é obrigatória.' });
    }

    if (!capa_curso) {
        return res.status(400).json({ error: 'A capa do curso é obrigatória.' });
    }

    // Validar senha de acesso (se fornecida)
    if (senha_acesso) {
        if (senha_acesso.length > 5) {
            return res.status(400).json({ error: 'A senha de acesso deve ter no máximo 5 caracteres.' });
        }
        if (senha_acesso.includes(' ')) {
            return res.status(400).json({ error: 'A senha de acesso não pode conter espaços.' });
        }
    }

    try {
        const curso = await prisma.curso.create({
            data: {
                titulo: titulo.trim(),
                materia: materia.trim(),
                descricao: descricao?.trim() || null,
                capa_curso,
                senha_acesso: senha_acesso || null,
                usuario_id: usuarioId
            },
            include: {
                professor: {
                    select: { id: true, nome: true, foto_perfil: true }
                }
            }
        });

        return res.status(201).json({
            message: 'Curso criado com sucesso!',
            curso
        });

    } catch (error) {
        console.error('Erro ao criar curso:', error);
        return res.status(500).json({ error: 'Erro ao criar curso.' });
    }
};