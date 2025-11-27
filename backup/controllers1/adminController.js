// file: controllers/adminController.js
import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs'; // Para hashear nova senha na edição
import fs from 'fs';          // Para interagir com o sistema de arquivos (deletar fotos)
import path from 'path';        // Para construir caminhos de arquivo
import { fileURLToPath } from 'url'; // Para obter o diretório atual em ES Modules

// Configuração para obter o diretório raiz do projeto (necessário para fs.unlink)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..'); // Sobe um nível a partir de /controllers

// --- Funções de Renderização das Abas ---

// Rota: GET /admin/estatisticas
export const getEstatisticas = async (req, res) => {
  try {
    const totalUsuarios = await prisma.usuario.count();
    const usuariosAtivos = await prisma.usuario.count({ where: { status: 'ativo' } });
    const totalAlunos = await prisma.usuario.count({ where: { tipo: 'aluno' } });
    const totalProfessores = await prisma.usuario.count({ where: { tipo: 'professor' } });

    const stats = {
      totalUsuarios,
      usuariosAtivos,
      totalAlunos,
      totalProfessores,
    };

    res.render('plataforma/admin_estatisticas', {
        stats,
        activeTab: 'estatisticas', // Para destacar a aba
        activeLink: 'dashboard' // Para destacar o link no sidebar
    });

  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    // Renderiza uma view de erro genérica ou envia status 500
    res.status(500).render('404_app', { message: 'Erro ao carregar estatísticas.' });
  }
};

// Rota: GET /admin/usuarios (ATUALIZADA com Filtro, Ordenação e Paginação)
export const listarUsuarios = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Pega a página da URL, padrão é 1
    const pageSize = 20; // Define quantos usuários por página
    const filtroTipo = req.query.tipo; // Pega o filtro da URL (ex: 'professor', 'aluno')

    // 1. Define a condição de filtro para o Prisma
    let whereCondition = {};
    if (filtroTipo === 'professor' || filtroTipo === 'aluno' || filtroTipo === 'administrador') {
      whereCondition.tipo = filtroTipo; // Filtra pelo tipo se especificado e válido
    }
    // Se filtroTipo for undefined ou diferente, whereCondition fica vazio (busca todos)

    // 2. Busca TODOS os usuários que correspondem ao filtro (para ordenação e contagem total)
    const todosUsuariosFiltrados = await prisma.usuario.findMany({
      where: whereCondition, // Aplica o filtro
      select: {
          id: true, nome: true, email: true, tipo: true,
          status: true, foto_perfil: true, data_cadastro: true
      },
      orderBy: { nome: 'asc' }, // Ordenação inicial (será refinada em JS)
    });

    // 3. Ordenação Customizada em JavaScript (Admin > Prof > Aluno > Alfabético)
    const tipoOrdem = { 'administrador': 1, 'professor': 2, 'aluno': 3 };
    todosUsuariosFiltrados.sort((a, b) => {
      const ordemA = tipoOrdem[a.tipo] || 4;
      const ordemB = tipoOrdem[b.tipo] || 4;
      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }
      return a.nome.localeCompare(b.nome);
    });

    // 4. Calcula totais para paginação (baseado na lista FILTRADA E ORDENADA)
    const totalUsers = todosUsuariosFiltrados.length;
    const totalPages = Math.ceil(totalUsers / pageSize);
    const currentPage = Math.max(1, Math.min(page, totalPages || 1)); // Garante que a página é válida
    const skip = (currentPage - 1) * pageSize; // Calcula o skip baseado na página corrigida

    // 5. Extrai os usuários para a página atual da lista FILTRADA E ORDENADA
    const usuariosDaPagina = todosUsuariosFiltrados.slice(skip, skip + pageSize);

    // 6. Renderiza a view passando os dados
    res.render('plataforma/admin_usuarios', {
        usuarios: usuariosDaPagina, // Apenas os usuários da página atual
        activeTab: 'usuarios',
        activeLink: 'dashboard',
        // Dados de Paginação
        currentPage: currentPage,
        totalPages: totalPages,
        totalUsers: totalUsers,
        // Filtro Ativo (para destacar o botão correto)
        filtroTipo: filtroTipo || 'todos'
    });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    res.status(500).render('404_app', { message: 'Erro ao listar usuários.' });
  }
};

// Rota: GET /admin/solicitacoes
export const listarSolicitacoes = async (req, res) => {
  try {
    const solicitacoes = await prisma.solicitacao.findMany({
      where: { status: 'pendente' }, // Busca apenas as pendentes
      orderBy: { data_solicitacao: 'asc' }, // Ordena pela mais antiga
    });

    res.render('plataforma/admin_solicitacoes', {
        solicitacoes,
        activeTab: 'solicitacoes',
        activeLink: 'dashboard'
    });
  } catch (error) {
    console.error("Erro ao listar solicitações:", error);
    res.status(500).render('404_app', { message: 'Erro ao listar solicitações.' });
  }
};

// --- Funções de Ação ---

// Rota: POST /admin/usuarios/:id/deletar
export const deletarUsuario = async (req, res) => {
  const usuarioId = parseInt(req.params.id);
   if (isNaN(usuarioId)) {
      return res.status(400).redirect('/admin/usuarios?error=invalidid');
   }

  const adminId = req.session.usuario.id; // ID do admin logado

  try {
    // Regra de Negócio: Impede admin de se auto-deletar
    if (usuarioId === adminId) {
        console.warn("Tentativa de auto-deleção pelo admin ID:", adminId);
        return res.status(403).redirect('/admin/usuarios?error=selfdelete');
    }

    // Busca dados do usuário (para deletar foto) antes de deletar do DB
    const usuarioParaDeletar = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { foto_perfil: true }
    });

    if (!usuarioParaDeletar) {
         return res.status(404).redirect('/admin/usuarios?error=notfound');
    }

    // Deleta o usuário do banco
    // ATENÇÃO: Garanta onDelete: Cascade no schema para remover dados relacionados
    await prisma.usuario.delete({ where: { id: usuarioId } });

    // Deleta a foto de perfil associada, se existir
    if (usuarioParaDeletar.foto_perfil) {
        const caminhoFoto = path.join(projectRoot, 'public', 'uploads', 'images', usuarioParaDeletar.foto_perfil);
        if (fs.existsSync(caminhoFoto)) {
            fs.unlink(caminhoFoto, (err) => {
                if (err) console.error("Erro ao deletar foto do usuário:", err);
                else console.log("Foto do usuário deletada:", usuarioParaDeletar.foto_perfil);
            });
        }
    }

    res.redirect('/admin/usuarios'); // Redireciona de volta para a lista

  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
     // Adiciona tratamento para erros de chave estrangeira
    if (error.code === 'P2003' || error.code === 'P2014') {
         console.error("ERRO: Não foi possível deletar o usuário devido a registros relacionados.");
         return res.status(409).redirect('/admin/usuarios?error=relatedrecords');
    }
    res.status(500).redirect('/admin/usuarios?error=deletefailed');
  }
};

// Rota: POST /admin/solicitacoes/:id/aprovar
export const aprovarSolicitacao = async (req, res) => {
  const solicitacaoId = parseInt(req.params.id);
   if (isNaN(solicitacaoId)) {
      return res.status(400).redirect('/admin/solicitacoes?error=invalidid');
   }

  try {
    // Busca a solicitação pendente
    const solicitacao = await prisma.solicitacao.findUnique({
      where: { id: solicitacaoId },
    });

    // Verifica se a solicitação existe e está pendente
    if (!solicitacao || solicitacao.status !== 'pendente') {
      return res.status(404).redirect('/admin/solicitacoes?error=notfoundorpending');
    }

    // Cria o novo usuário do tipo 'professor' com os dados da solicitação
    const novoProfessor = await prisma.usuario.create({
      data: {
        nome: solicitacao.nome,
        email: solicitacao.email,
        senha: solicitacao.senha_hash, // Usa o hash já salvo
        foto_perfil: solicitacao.foto_perfil,
        tipo: 'professor',
        status: 'ativo', // Professor é criado como ativo
      },
    });

    // Atualiza o status da solicitação para 'aprovada'
    await prisma.solicitacao.update({
      where: { id: solicitacaoId },
      data: { status: 'aprovada' },
    });

    res.redirect('/admin/solicitacoes'); // Redireciona de volta

  } catch (error) {
    // Trata erro caso o email já exista na tabela Usuarios (conflito)
    if (error.code === 'P2002') { // Erro de constraint única
      // Marca a solicitação como rejeitada para evitar repetição
      await prisma.solicitacao.update({
        where: { id: solicitacaoId },
        data: { status: 'rejeitada' },
      });
      console.error("Erro de email duplicado ao aprovar solicitação:", solicitacao.email);
      return res.status(409).redirect('/admin/solicitacoes?error=emailconflict');
    }
    console.error("Erro ao aprovar solicitação:", error);
    res.status(500).redirect('/admin/solicitacoes?error=approvalfailed');
  }
};

// Rota: GET /admin/usuarios/:id/editar
export const renderFormEdicaoUsuario = async (req, res) => {
    const usuarioId = parseInt(req.params.id);
    if (isNaN(usuarioId)) {
        return res.status(400).render('404_app', { message: 'ID de usuário inválido.' });
    }

    try {
        const usuarioParaEditar = await prisma.usuario.findUnique({
            where: { id: usuarioId },
        });

        if (!usuarioParaEditar) {
            return res.status(404).render('404_app', { message: 'Usuário não encontrado.' });
        }

        res.render('plataforma/admin_form_usuario', {
            usuarioEditando: usuarioParaEditar,
            error: null,
            activeTab: 'usuarios',
            activeLink: 'dashboard'
        });

    } catch (error) {
        console.error("Erro ao buscar usuário para edição:", error);
        res.status(500).render('404_app', { message: "Erro ao carregar a página de edição." });
    }
};

// Rota: POST /admin/usuarios/:id/editar
export const atualizarUsuario = async (req, res) => {
    const usuarioId = parseInt(req.params.id);
     if (isNaN(usuarioId)) {
        return res.status(400).send("ID de usuário inválido.");
    }

    const { nome, email, tipo, status, nova_senha } = req.body;
    const novaFoto = req.file?.filename;
    const adminId = req.session.usuario.id;

    let usuarioExistente; // Declara fora para usar no catch
    try {
        usuarioExistente = await prisma.usuario.findUnique({
            where: { id: usuarioId },
            select: { foto_perfil: true, senha: true, tipo: true }
        });

        if (!usuarioExistente) {
             return res.status(404).send("Usuário não encontrado.");
        }

        const dadosAtualizacao = { nome, email, tipo, status };

        // Regras de Negócio: Admin não pode se rebaixar ou inativar
        if (usuarioId === adminId) {
            if (tipo !== 'administrador') {
                 throw new Error("Administrador não pode remover seu próprio privilégio.");
            }
             if (status !== 'ativo') {
                 throw new Error("Administrador não pode desativar a própria conta.");
            }
        }

        // Atualiza senha se fornecida
        if (nova_senha && nova_senha.trim() !== '') {
            dadosAtualizacao.senha = await bcrypt.hash(nova_senha, 10);
        }

        // Atualiza foto se enviada e deleta a antiga
        if (novaFoto) {
            dadosAtualizacao.foto_perfil = novaFoto;
            if (usuarioExistente.foto_perfil) {
                const caminhoFotoAntiga = path.join(projectRoot, 'public', 'uploads', 'images', usuarioExistente.foto_perfil);
                if (fs.existsSync(caminhoFotoAntiga)) {
                    fs.unlink(caminhoFotoAntiga, (err) => {
                        if (err) console.error("Erro ao deletar foto antiga:", err);
                    });
                }
            }
        }

        // Executa o update no banco
        await prisma.usuario.update({
            where: { id: usuarioId },
            data: dadosAtualizacao,
        });

        res.redirect('/admin/usuarios');

    } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        // Tenta buscar dados atuais mesmo em caso de erro para repopular
        // Define usuarioParaForm fora do catch ou usa um valor padrão
        let usuarioParaForm = null;
        if(usuarioId){ // Verifica se usuarioId é válido
            try {
                 usuarioParaForm = await prisma.usuario.findUnique({ where: { id: usuarioId } });
            } catch (findError){
                 console.error("Erro ao buscar usuário para formulário após falha no update:", findError);
            }
        }
        
        res.status(500).render('plataforma/admin_form_usuario', {
            error: error.message || 'Erro ao salvar as alterações. Verifique os dados e tente novamente.',
            // Passa dados do banco ou os últimos enviados se o banco falhar
            usuarioEditando: usuarioParaForm || { id: usuarioId, nome, email, tipo, status },
            activeTab: 'usuarios',
            activeLink: 'dashboard'
        });
    }
};

// TODO: Implementar função para rejeitar solicitação (`rejeitarSolicitacao`)