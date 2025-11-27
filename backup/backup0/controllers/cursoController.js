// file: controllers/cursoController.js
import prisma from '../config/prisma.js';
import fs from 'fs'; // Módulo 'filesystem' para interagir com arquivos (ex: deletar imagem)
import path from 'path'; // Módulo 'path' para construir caminhos
import { fileURLToPath } from 'url'; // Para obter o diretório atual em ES Modules

// Configuração para obter o diretório raiz do projeto (necessário para fs.unlink)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..'); // Sobe um nível a partir de /controllers

// --- Funções de Leitura (Read) ---

// Rota: GET /cursos (Renderiza a página "Meus Cursos")
export const renderMeusCursos = async (req, res) => {
    try {
        // TODO: Adicionar lógica de filtro baseada no usuário (Lecionando vs. Matriculado)
        // Por enquanto, busca todos os cursos
        const cursos = await prisma.curso.findMany({
            include: {
                professor: { // Inclui dados do professor para o card
                    select: { 
                        nome: true,
                        foto_perfil: true // Inclui foto do professor
                    } 
                }
            },
            orderBy: {
                id: 'desc' // Mostra os cursos mais recentes primeiro
            }
        });
        
        // Renderiza a view EJS passando os dados
        res.render('plataforma/meus_cursos', {
            cursos: cursos,
            activeLink: 'meus_cursos', // Para destacar o link no sidebar
            error: req.query.error // Passa possíveis mensagens de erro (ex: ?error=notfound)
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
            curso: null, // 'null' indica que é um formulário de criação
            pageTitle: 'Criar Novo Curso',
            error: null,
            activeLink: 'meus_cursos' // Mantém o link do sidebar ativo
        });
    } catch (error) {
        console.error("Erro ao renderizar formulário de curso:", error);
        res.status(500).send("Erro ao carregar a página.");
    }
};

// Rota: GET /cursos/:id/editar (Renderiza o formulário de edição)
export const renderFormEdicaoCurso = async (req, res) => {
    const cursoId = parseInt(req.params.id);
    // Verifica se o ID é um número válido
    if (isNaN(cursoId)) {
        return res.status(400).render('404_app', { message: 'ID de curso inválido.' });
    }
    
    const usuarioId = req.session.usuario.id;
    const usuarioTipo = req.session.usuario.tipo;

    try {
        const curso = await prisma.curso.findUnique({
            where: { id: cursoId },
        });

        // Verifica se o curso existe
        if (!curso) {
            return res.status(404).render('404_app', { message: 'Curso não encontrado.' });
        }

        // Verifica permissão: Dono do curso ou Admin?
        if (curso.usuario_id !== usuarioId && usuarioTipo !== 'administrador') {
             // Redireciona com mensagem de erro se não tiver permissão
            return res.status(403).redirect('/cursos?error=permission');
        }

        // Renderiza o mesmo formulário, passando os dados do curso
        res.render('plataforma/form_curso', {
            curso: curso, // Passa os dados do curso encontrado
            pageTitle: 'Editar Curso', // Muda o título
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
    const professorId = req.session.usuario.id;

    // Verifica se a imagem de capa foi enviada pelo Multer
    if (!req.file) {
        // Renderiza o formulário novamente com erro, mantendo os dados digitados
        return res.status(400).render('plataforma/form_curso', {
            error: 'A imagem da capa é obrigatória.',
            curso: { titulo, materia, descricao }, // Passa dados para repopular o form
            pageTitle: 'Criar Novo Curso',
            activeLink: 'meus_cursos'
        });
    }
    
    const capa_curso = req.file.filename; // Nome do arquivo salvo pelo Multer

    try {
        // Cria o registro do curso no banco de dados
        await prisma.curso.create({
            data: {
                titulo,
                materia,
                descricao: descricao || null, // Salva null se descrição for vazia
                capa_curso,
                usuario_id: professorId // Vincula ao professor logado
            }
        });

        // Redireciona para a lista de cursos após sucesso
        res.redirect('/cursos'); 

    } catch (error) {
        console.error("Erro ao criar curso:", error);
        // Em caso de erro no banco, renderiza o formulário novamente com erro
        res.status(500).render('plataforma/form_curso', {
            error: 'Erro ao salvar o curso. Tente novamente.',
            curso: { titulo, materia, descricao }, // Passa dados para repopular
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

    const usuarioId = req.session.usuario.id;
    const usuarioTipo = req.session.usuario.tipo;
    const { titulo, materia, descricao } = req.body;
    const novaCapa = req.file?.filename; // Pega o nome do novo arquivo, se foi enviado

    try {
        // 1. Busca o curso existente para verificar permissão e pegar capa antiga
        const cursoExistente = await prisma.curso.findUnique({
            where: { id: cursoId },
            select: { usuario_id: true, capa_curso: true } // Seleciona só o necessário
        });

        if (!cursoExistente) {
            return res.status(404).render('404_app', { message: 'Curso não encontrado.' });
        }

        // 2. Verifica permissão (Dono ou Admin)
        if (cursoExistente.usuario_id !== usuarioId && usuarioTipo !== 'administrador') {
            return res.status(403).send("Você não tem permissão para editar este curso."); // Ou redirecionar
        }

        // 3. Prepara os dados para atualização
        const dadosAtualizacao = {
            titulo,
            materia,
            descricao: descricao || null,
        };

        // 4. Se uma nova capa foi enviada, atualiza o campo e deleta a antiga
        if (novaCapa) {
            dadosAtualizacao.capa_curso = novaCapa; // Adiciona nova capa aos dados

            // Deleta a imagem antiga do servidor
            if (cursoExistente.capa_curso) {
                // Constrói o caminho completo para o arquivo antigo
                const caminhoImagemAntiga = path.join(projectRoot, 'public', 'uploads', 'images', cursoExistente.capa_curso);
                 // Verifica se o arquivo existe antes de tentar deletar
                 if (fs.existsSync(caminhoImagemAntiga)) {
                     fs.unlink(caminhoImagemAntiga, (err) => { // Deleta o arquivo
                         if (err) console.error("Erro ao deletar imagem antiga:", err);
                         else console.log("Imagem antiga deletada:", cursoExistente.capa_curso);
                     });
                 } else {
                     console.warn("Arquivo de imagem antiga não encontrado:", caminhoImagemAntiga);
                 }
            }
        }

        // 5. Atualiza o curso no banco de dados
        await prisma.curso.update({
            where: { id: cursoId },
            data: dadosAtualizacao,
        });

        // 6. Redireciona para a lista de cursos após sucesso
        res.redirect('/cursos');

    } catch (error) {
        console.error("Erro ao atualizar curso:", error);
        // Em caso de erro, busca dados atuais e re-renderiza o form com erro
        const cursoParaForm = await prisma.curso.findUnique({ where: { id: cursoId } }); 
        res.status(500).render('plataforma/form_curso', {
            error: 'Erro ao salvar as alterações. Tente novamente.',
            // Passa dados do banco ou os últimos enviados se o banco falhar
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

    const usuarioId = req.session.usuario.id;
    const usuarioTipo = req.session.usuario.tipo;

    try {
        // 1. Busca o curso para verificar permissão e pegar nome da imagem
        const cursoParaDeletar = await prisma.curso.findUnique({
            where: { id: cursoId },
            select: { usuario_id: true, capa_curso: true } 
        });

        if (!cursoParaDeletar) {
            return res.status(404).redirect('/cursos?error=notfound'); 
        }

        // 2. Verifica permissão (Dono ou Admin)
        if (cursoParaDeletar.usuario_id !== usuarioId && usuarioTipo !== 'administrador') {
            return res.status(403).redirect('/cursos?error=permission'); 
        }

        // 3. Deleta o curso do banco de dados
        // IMPORTANTE: Garanta que seu schema.prisma tenha 'onDelete: Cascade' nas relações
        // (Aula, Atividade, Inscricao) para que o Prisma remova tudo relacionado.
        // Se não, você precisaria deletar manualmente Aulas, Atividades, Progresso e Inscricoes antes.
        await prisma.curso.delete({
            where: { id: cursoId },
        });

        // 4. Deleta a imagem da capa associada (se existir)
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

        // 5. Redireciona para a lista de cursos após sucesso
        res.redirect('/cursos'); 

    } catch (error) {
        console.error("Erro ao deletar curso:", error);
        // Adiciona tratamento para erros de chave estrangeira se cascade não estiver configurado
        if (error.code === 'P2003' || error.code === 'P2014') { // Códigos comuns de FK constraint
             console.error("ERRO: Não foi possível deletar o curso devido a registros relacionados (aulas, inscrições, etc.). Verifique as regras onDelete no schema.");
             return res.status(409).redirect('/cursos?error=relatedrecords'); // Conflito
        }
        res.status(500).redirect('/cursos?error=deletefailed'); 
    }
};

// --- Função para Ver Detalhes (Ainda não implementada) ---
// export const renderDetalheCurso = async (req, res) => { /* ... */ };