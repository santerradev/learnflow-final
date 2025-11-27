// file: controllers/pageController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class PageController {

  // ========================================
  // LANDING PAGE (Página Inicial Pública)
  // ========================================
  static renderLandingPage(req, res) {
    // Se já estiver logado, redirecionar
    if (req.isAuthenticated()) {
      return res.redirect('/inicio');
    }

    res.render('landing_page', { 
      pageTitle: 'LearnFlow - Plataforma de Ensino'
    });
  }

  // ========================================
  // PÁGINA INICIAL (Dashboard após login)
  // ========================================
  static async renderInicio(req, res) {
    try {
      const usuario = req.user;

      let dados = {};

      if (usuario.tipo === 'administrador') {
        // Dashboard Admin
        const [totalUsuarios, totalCursos, solicitacoesPendentes, ultimasAtividades] = await Promise.all([
          prisma.usuario.count(),
          prisma.curso.count(),
          prisma.solicitacao.count({ where: { status: 'pendente' } }),
          prisma.usuario.findMany({
            take: 5,
            orderBy: { data_cadastro: 'desc' },
            select: { id: true, nome: true, tipo: true, data_cadastro: true }
          })
        ]);

        dados = {
          totalUsuarios,
          totalCursos,
          solicitacoesPendentes,
          ultimasAtividades
        };

      } else if (usuario.tipo === 'professor') {
        // Dashboard Professor
        const [meusCursos, totalAlunos, ultimosInscritos] = await Promise.all([
          prisma.curso.findMany({
            where: { usuario_id: usuario.id },
            include: {
              _count: { select: { inscricoes: true } }
            },
            orderBy: { id: 'desc' },
            take: 6
          }),
          prisma.inscricao.count({
            where: {
              curso: { usuario_id: usuario.id },
              status: 'aprovada'
            }
          }),
          prisma.inscricao.findMany({
            where: {
              curso: { usuario_id: usuario.id },
              status: 'aprovada'
            },
            include: {
              aluno: { select: { nome: true, foto_perfil: true } },
              curso: { select: { titulo: true } }
            },
            orderBy: { data_inscricao: 'desc' },
            take: 5
          })
        ]);

        dados = {
          meusCursos,
          totalCursos: meusCursos.length,
          totalAlunos,
          ultimosInscritos
        };

      } else {
        // Dashboard Aluno
        const [minhasInscricoes, cursosDisponiveis, progressoGeral] = await Promise.all([
          prisma.inscricao.findMany({
            where: {
              usuario_id: usuario.id,
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
            orderBy: { data_inscricao: 'desc' },
            take: 6
          }),
          prisma.curso.count(),
          prisma.progresso.count({
            where: {
              inscricao: { usuario_id: usuario.id },
              concluida: true
            }
          })
        ]);

        dados = {
          minhasInscricoes,
          cursosDisponiveis,
          cursosInscritos: minhasInscricoes.length,
          progressoGeral
        };
      }

      // Notificações não lidas
      const notificacoesNaoLidas = await prisma.notificacao.count({
        where: {
          usuario_id: usuario.id,
          lida: false
        }
      });

      res.render('plataforma/inicio', {
        usuario,
        dados,
        notificacoesNaoLidas,
        pageTitle: 'Início'
      });

    } catch (error) {
      console.error('Erro ao carregar página inicial:', error);
      res.status(500).send('Erro ao carregar página');
    }
  }

  // ========================================
  // SOBRE A PLATAFORMA
  // ========================================
  static renderSobre(req, res) {
    res.render('sobre', {
      usuario: req.user || null,
      pageTitle: 'Sobre a LearnFlow'
    });
  }

  // ========================================
  // CONTATO
  // ========================================
  static renderContato(req, res) {
    res.render('contato', {
      usuario: req.user || null,
      pageTitle: 'Contato',
      error: req.flash('error'),
      success: req.flash('success')
    });
  }

  // ========================================
  // PROCESSAR CONTATO
  // ========================================
  static async processarContato(req, res) {
    try {
      const { nome, email, assunto, mensagem } = req.body;

      // Validações básicas
      if (!nome || !email || !assunto || !mensagem) {
        req.flash('error', 'Todos os campos são obrigatórios.');
        return res.redirect('/contato');
      }

      // Aqui você pode:
      // 1. Enviar email para os administradores
      // 2. Salvar no banco de dados
      // 3. Integrar com sistema de tickets

      // Por enquanto, apenas notificar admins
      const admins = await prisma.usuario.findMany({
        where: { tipo: 'administrador' },
        select: { id: true }
      });

      for (const admin of admins) {
        await prisma.notificacao.create({
          data: {
            usuario_id: admin.id,
            tipo: 'geral',
            titulo: `📧 Nova mensagem de contato`,
            mensagem: `${nome} (${email}) enviou: ${assunto}`,
            link: null,
            lida: false
          }
        });
      }

      req.flash('success', 'Mensagem enviada com sucesso! Retornaremos em breve.');
      res.redirect('/contato');

    } catch (error) {
      console.error('Erro ao processar contato:', error);
      req.flash('error', 'Erro ao enviar mensagem.');
      res.redirect('/contato');
    }
  }

  // ========================================
  // BUSCA GLOBAL
  // ========================================
  static async buscar(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.trim() === '') {
        return res.render('plataforma/busca', {
          usuario: req.user,
          query: '',
          resultados: { cursos: [], usuarios: [] },
          pageTitle: 'Buscar'
        });
      }

      const query = q.trim();

      // Buscar cursos
      const cursos = await prisma.curso.findMany({
        where: {
          OR: [
            { titulo: { contains: query } },
            { materia: { contains: query } },
            { descricao: { contains: query } }
          ]
        },
        include: {
          professor: { select: { nome: true } },
          _count: { select: { inscricoes: true } }
        },
        take: 20
      });

      // Buscar usuários (apenas para admins)
      let usuarios = [];
      if (req.user.tipo === 'administrador') {
        usuarios = await prisma.usuario.findMany({
          where: {
            OR: [
              { nome: { contains: query } },
              { email: { contains: query } }
            ]
          },
          select: {
            id: true,
            nome: true,
            email: true,
            foto_perfil: true,
            tipo: true
          },
          take: 20
        });
      }

      res.render('plataforma/busca', {
        usuario: req.user,
        query,
        resultados: { cursos, usuarios },
        pageTitle: `Buscar: ${query}`
      });

    } catch (error) {
      console.error('Erro na busca:', error);
      res.status(500).send('Erro ao realizar busca');
    }
  }
}

export default PageController;