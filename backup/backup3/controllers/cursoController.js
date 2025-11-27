// file: controllers/cursoController.js
import { PrismaClient } from '@prisma/client';
import { criarNotificacao, notificarInscritosCurso } from './notificacaoController.js';

const prisma = new PrismaClient();

class CursoController {

  // ========================================
  // LISTAR CURSOS (CATÁLOGO)
  // ========================================
  static async listarCursos(req, res) {
    try {
      const cursos = await prisma.curso.findMany({
        include: {
          professor: {
            select: { id: true, nome: true }
          },
          _count: {
            select: { inscricoes: true }
          }
        },
        orderBy: { id: 'desc' }
      });

      // Verificar quais cursos o usuário está inscrito
      const inscricoes = await prisma.inscricao.findMany({
        where: { 
          usuario_id: req.user.id,
          status: 'aprovada'
        },
        select: { curso_id: true }
      });

      const cursosInscritos = inscricoes.map(i => i.curso_id);

      res.render('plataforma/cursos', {
        usuario: req.user,
        cursos,
        cursosInscritos,
        pageTitle: 'Catálogo de Cursos'
      });

    } catch (error) {
      console.error('Erro ao listar cursos:', error);
      res.status(500).send('Erro ao carregar cursos');
    }
  }

  // ========================================
  // CRIAR CURSO
  // ========================================
  static async criarCurso(req, res) {
    try {
      const { titulo, materia, descricao, senha_acesso } = req.body;
      const usuario_id = req.user.id;

      // Validação
      if (!titulo || !materia) {
        return res.status(400).json({ 
          success: false, 
          message: 'Título e matéria são obrigatórios' 
        });
      }

      // Validar senha de acesso (máx 5 caracteres, sem espaços)
      if (senha_acesso) {
        if (senha_acesso.length > 5) {
          return res.status(400).json({ 
            success: false, 
            message: 'Senha de acesso deve ter no máximo 5 caracteres' 
          });
        }
        if (/\s/.test(senha_acesso)) {
          return res.status(400).json({ 
            success: false, 
            message: 'Senha de acesso não pode conter espaços' 
          });
        }
      }

      // Capa do curso
      let capa_curso = 'default-course.jpg';
      if (req.file) {
        capa_curso = req.file.filename;
      }

      const curso = await prisma.curso.create({
        data: {
          titulo,
          materia,
          descricao: descricao || '',
          capa_curso,
          senha_acesso: senha_acesso || null,
          usuario_id
        }
      });

      // Notificar todos os alunos sobre novo curso (opcional)
      const alunos = await prisma.usuario.findMany({
        where: { tipo: 'aluno', status: 'ativo' },
        select: { id: true }
      });

      for (const aluno of alunos) {
        await criarNotificacao({
          usuario_id: aluno.id,
          tipo: 'novo_curso',
          titulo: '📚 Novo Curso Disponível',
          mensagem: `O curso "${titulo}" foi criado por ${req.user.nome}`,
          link: `/cursos`,
          curso_id: curso.id
        });
      }

      res.json({ 
        success: true, 
        message: 'Curso criado com sucesso!',
        curso
      });

    } catch (error) {
      console.error('Erro ao criar curso:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao criar curso' 
      });
    }
  }

  // ========================================
  // DETALHES DO CURSO
  // ========================================
  static async detalhesCurso(req, res) {
    try {
      const { id } = req.params;
      const aba = req.query.aba || 'mural';

      const curso = await prisma.curso.findUnique({
        where: { id: parseInt(id) },
        include: {
          professor: {
            select: { id: true, nome: true, foto_perfil: true }
          },
          inscricoes: {
            where: { status: 'aprovada' },
            include: {
              aluno: {
                select: { id: true, nome: true, foto_perfil: true, email: true }
              }
            }
          },
          listas: {
            orderBy: { ordem: 'asc' },
            include: {
              aulas: { orderBy: { ordem: 'asc' } },
              atividades: { orderBy: { ordem: 'asc' } },
              materiais: { orderBy: { ordem: 'asc' } }
            }
          }
        }
      });

      if (!curso) {
        req.flash('error', 'Curso não encontrado.');
        return res.redirect('/cursos');
      }

      // Verificar se está inscrito
      const inscricao = await prisma.inscricao.findUnique({
        where: {
          usuario_id_curso_id: {
            usuario_id: req.user.id,
            curso_id: parseInt(id)
          }
        }
      });

      const estaInscrito = inscricao && inscricao.status === 'aprovada';
      const eDono = curso.usuario_id === req.user.id;
      const eAdmin = req.user.tipo === 'administrador';

      // Se não está inscrito e não é dono/admin, redirecionar
      if (!estaInscrito && !eDono && !eAdmin) {
        req.flash('error', 'Você precisa estar inscrito neste curso.');
        return res.redirect('/cursos');
      }

      // Calcular progresso
      let progresso = 0;
      if (estaInscrito && inscricao) {
        const totalConteudo = await prisma.$queryRaw`
          SELECT COUNT(*) as total FROM (
            SELECT id FROM Aula WHERE lista_id IN (SELECT id FROM Lista WHERE curso_id = ${parseInt(id)})
            UNION ALL
            SELECT id FROM Atividade WHERE lista_id IN (SELECT id FROM Lista WHERE curso_id = ${parseInt(id)})
          ) as conteudos
        `;

        const concluidosCount = await prisma.progresso.count({
          where: {
            inscricao_id: inscricao.id,
            concluida: true
          }
        });

        const total = Number(totalConteudo[0]?.total || 0);
        progresso = total > 0 ? Math.round((concluidosCount / total) * 100) : 0;
      }

      // Buscar publicações do mural
      const publicacoes = await prisma.publicacao.findMany({
        where: { curso_id: parseInt(id) },
        include: {
          autor: {
            select: { id: true, nome: true, foto_perfil: true, tipo: true }
          },
          comentarios: {
            orderBy: { data_criacao: 'asc' },
            include: {
              autor: {
                select: { id: true, nome: true, foto_perfil: true }
              }
            }
          }
        },
        orderBy: { data_criacao: 'desc' }
      });

      res.render('plataforma/detalhes_curso', {
        usuario: req.user,
        curso,
        aba,
        estaInscrito,
        eDono,
        eAdmin,
        progresso,
        publicacoes,
        pageTitle: curso.titulo
      });

    } catch (error) {
      console.error('Erro ao carregar curso:', error);
      res.status(500).send('Erro ao carregar curso');
    }
  }

  // ========================================
  // INSCREVER-SE NO CURSO
  // ========================================
  static async inscrever(req, res) {
    try {
      const { id } = req.params;
      const { senha } = req.body;

      const curso = await prisma.curso.findUnique({
        where: { id: parseInt(id) },
        select: { id: true, titulo: true, senha_acesso: true, usuario_id: true }
      });

      if (!curso) {
        return res.status(404).json({ 
          success: false, 
          message: 'Curso não encontrado' 
        });
      }

      // Verificar se já está inscrito
      const inscricaoExistente = await prisma.inscricao.findUnique({
        where: {
          usuario_id_curso_id: {
            usuario_id: req.user.id,
            curso_id: parseInt(id)
          }
        }
      });

      if (inscricaoExistente) {
        return res.status(400).json({ 
          success: false, 
          message: 'Você já está inscrito neste curso' 
        });
      }

      // Validar senha de acesso se existir
      if (curso.senha_acesso) {
        if (!senha || senha !== curso.senha_acesso) {
          return res.status(400).json({ 
            success: false, 
            message: 'Senha de acesso incorreta' 
          });
        }
      }

      // Criar inscrição
      await prisma.inscricao.create({
        data: {
          usuario_id: req.user.id,
          curso_id: parseInt(id),
          status: 'aprovada'
        }
      });

      // Notificar aluno
      await criarNotificacao({
        usuario_id: req.user.id,
        tipo: 'novo_curso',
        titulo: '✅ Inscrição Confirmada',
        mensagem: `Você foi inscrito no curso "${curso.titulo}"`,
        link: `/curso/${curso.id}`,
        curso_id: curso.id
      });

      // Notificar professor
      await criarNotificacao({
        usuario_id: curso.usuario_id,
        tipo: 'geral',
        titulo: '👥 Nova Inscrição',
        mensagem: `${req.user.nome} se inscreveu no curso "${curso.titulo}"`,
        link: `/curso/${curso.id}?aba=pessoas`,
        curso_id: curso.id
      });

      res.json({ 
        success: true, 
        message: 'Inscrição realizada com sucesso!' 
      });

    } catch (error) {
      console.error('Erro ao inscrever:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao realizar inscrição' 
      });
    }
  }

  // ========================================
  // EDITAR CURSO
  // ========================================
  static async editarCurso(req, res) {
    try {
      const { id } = req.params;
      const { titulo, materia, descricao, senha_acesso } = req.body;

      const curso = await prisma.curso.findUnique({
        where: { id: parseInt(id) }
      });

      if (!curso) {
        return res.status(404).json({ 
          success: false, 
          message: 'Curso não encontrado' 
        });
      }

      // Verificar permissão
      if (curso.usuario_id !== req.user.id && req.user.tipo !== 'administrador') {
        return res.status(403).json({ 
          success: false, 
          message: 'Sem permissão para editar este curso' 
        });
      }

      let capa_curso = curso.capa_curso;
      if (req.file) {
        capa_curso = req.file.filename;
      }

      await prisma.curso.update({
        where: { id: parseInt(id) },
        data: {
          titulo,
          materia,
          descricao,
          capa_curso,
          senha_acesso: senha_acesso || null
        }
      });

      res.json({ 
        success: true, 
        message: 'Curso atualizado com sucesso!' 
      });

    } catch (error) {
      console.error('Erro ao editar curso:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao editar curso' 
      });
    }
  }

  // ========================================
  // DELETAR CURSO
  // ========================================
  static async deletarCurso(req, res) {
    try {
      const { id } = req.params;

      const curso = await prisma.curso.findUnique({
        where: { id: parseInt(id) },
        include: {
          inscricoes: { select: { usuario_id: true } }
        }
      });

      if (!curso) {
        return res.status(404).json({ 
          success: false, 
          message: 'Curso não encontrado' 
        });
      }

      // Verificar permissão
      if (curso.usuario_id !== req.user.id && req.user.tipo !== 'administrador') {
        return res.status(403).json({ 
          success: false, 
          message: 'Sem permissão para deletar este curso' 
        });
      }

      // Notificar alunos
      for (const inscricao of curso.inscricoes) {
        await criarNotificacao({
          usuario_id: inscricao.usuario_id,
          tipo: 'geral',
          titulo: '⚠️ Curso Removido',
          mensagem: `O curso "${curso.titulo}" foi removido`,
          link: '/cursos'
        });
      }

      await prisma.curso.delete({
        where: { id: parseInt(id) }
      });

      res.json({ 
        success: true, 
        message: 'Curso deletado com sucesso!' 
      });

    } catch (error) {
      console.error('Erro ao deletar curso:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao deletar curso' 
      });
    }
  }

  // ========================================
  // MEUS CURSOS (Professores)
  // ========================================
  static async meusCursos(req, res) {
    try {
      let cursos;

      if (req.user.tipo === 'professor' || req.user.tipo === 'administrador') {
        cursos = await prisma.curso.findMany({
          where: { usuario_id: req.user.id },
          include: {
            _count: { select: { inscricoes: true } }
          },
          orderBy: { id: 'desc' }
        });
      } else {
        cursos = await prisma.inscricao.findMany({
          where: { 
            usuario_id: req.user.id,
            status: 'aprovada'
          },
          include: {
            curso: {
              include: {
                professor: { select: { nome: true } },
                _count: { select: { inscricoes: true } }
              }
            }
          },
          orderBy: { data_inscricao: 'desc' }
        });
      }

      res.render('plataforma/meus_cursos', {
        usuario: req.user,
        cursos,
        pageTitle: 'Meus Cursos'
      });

    } catch (error) {
      console.error('Erro ao carregar meus cursos:', error);
      res.status(500).send('Erro ao carregar cursos');
    }
  }
}

export default CursoController;