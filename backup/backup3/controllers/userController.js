// file: controllers/userController.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

class UserController {

  // ========================================
  // VISUALIZAR PERFIL
  // ========================================
  static async verPerfil(req, res) {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: req.user.id },
        include: {
          cursosCriados: {
            include: {
              _count: { select: { inscricoes: true } }
            },
            orderBy: { id: 'desc' }
          },
          inscricoes: {
            where: { status: 'aprovada' },
            include: {
              curso: {
                include: {
                  professor: { select: { nome: true } }
                }
              }
            },
            orderBy: { data_inscricao: 'desc' }
          }
        }
      });

      // Estatísticas
      const stats = {
        cursosCriados: usuario.cursosCriados.length,
        cursosInscritos: usuario.inscricoes.length,
        totalAlunos: usuario.cursosCriados.reduce((acc, curso) => acc + curso._count.inscricoes, 0)
      };

      res.render('plataforma/profile', {
        usuario,
        stats,
        pageTitle: 'Meu Perfil'
      });

    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      res.status(500).send('Erro ao carregar perfil');
    }
  }

  // ========================================
  // EDITAR PERFIL (INLINE)
  // ========================================
  static async editarPerfil(req, res) {
    try {
      const { campo, valor } = req.body;
      const usuario_id = req.user.id;

      // Campos permitidos para edição inline
      const camposPermitidos = ['nome', 'email', 'instituicao'];

      if (!camposPermitidos.includes(campo)) {
        return res.json({ 
          success: false, 
          message: 'Campo não permitido para edição' 
        });
      }

      // Validações específicas
      if (campo === 'email') {
        // Verificar se email já existe
        const emailExiste = await prisma.usuario.findFirst({
          where: { 
            email: valor,
            NOT: { id: usuario_id }
          }
        });

        if (emailExiste) {
          return res.json({ 
            success: false, 
            message: 'Este email já está em uso' 
          });
        }
      }

      if (campo === 'nome' && (!valor || valor.trim().length < 3)) {
        return res.json({ 
          success: false, 
          message: 'Nome deve ter pelo menos 3 caracteres' 
        });
      }

      // Atualizar campo
      await prisma.usuario.update({
        where: { id: usuario_id },
        data: { [campo]: valor }
      });

      // Atualizar sessão
      req.user[campo] = valor;

      res.json({ 
        success: true, 
        message: 'Perfil atualizado com sucesso!',
        novoValor: valor
      });

    } catch (error) {
      console.error('Erro ao editar perfil:', error);
      res.json({ 
        success: false, 
        message: 'Erro ao atualizar perfil' 
      });
    }
  }

  // ========================================
  // UPLOAD FOTO DE PERFIL
  // ========================================
  static async uploadFotoPerfil(req, res) {
    try {
      if (!req.file) {
        return res.json({ 
          success: false, 
          message: 'Nenhum arquivo enviado' 
        });
      }

      const foto_perfil = req.file.filename;

      await prisma.usuario.update({
        where: { id: req.user.id },
        data: { foto_perfil }
      });

      // Atualizar sessão
      req.user.foto_perfil = foto_perfil;

      res.json({ 
        success: true, 
        message: 'Foto atualizada com sucesso!',
        foto_url: `/uploads/images/${foto_perfil}`
      });

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      res.json({ 
        success: false, 
        message: 'Erro ao fazer upload da foto' 
      });
    }
  }

  // ========================================
  // ALTERAR SENHA
  // ========================================
  static async alterarSenha(req, res) {
    try {
      const { senha_atual, nova_senha, confirmar_senha } = req.body;
      const usuario_id = req.user.id;

      // Validações
      if (!senha_atual || !nova_senha || !confirmar_senha) {
        return res.json({ 
          success: false, 
          message: 'Todos os campos são obrigatórios' 
        });
      }

      if (nova_senha !== confirmar_senha) {
        return res.json({ 
          success: false, 
          message: 'As senhas não coincidem' 
        });
      }

      // Validar força da nova senha
      const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!senhaRegex.test(nova_senha)) {
        return res.json({ 
          success: false, 
          message: 'Senha deve ter 8+ caracteres, maiúscula, número e símbolo' 
        });
      }

      // Buscar usuário
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuario_id }
      });

      // Verificar senha atual
      const senhaValida = await bcrypt.compare(senha_atual, usuario.senha);
      if (!senhaValida) {
        return res.json({ 
          success: false, 
          message: 'Senha atual incorreta' 
        });
      }

      // Hash da nova senha
      const novaSenhaHash = await bcrypt.hash(nova_senha, 10);

      // Atualizar senha
      await prisma.usuario.update({
        where: { id: usuario_id },
        data: { senha: novaSenhaHash }
      });

      res.json({ 
        success: true, 
        message: 'Senha alterada com sucesso!' 
      });

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      res.json({ 
        success: false, 
        message: 'Erro ao alterar senha' 
      });
    }
  }

  // ========================================
  // DESATIVAR CONTA
  // ========================================
  static async desativarConta(req, res) {
    try {
      const { senha_confirmacao } = req.body;
      const usuario_id = req.user.id;

      if (!senha_confirmacao) {
        return res.json({ 
          success: false, 
          message: 'Senha é obrigatória para confirmar' 
        });
      }

      const usuario = await prisma.usuario.findUnique({
        where: { id: usuario_id }
      });

      // Verificar senha
      const senhaValida = await bcrypt.compare(senha_confirmacao, usuario.senha);
      if (!senhaValida) {
        return res.json({ 
          success: false, 
          message: 'Senha incorreta' 
        });
      }

      // Desativar conta
      await prisma.usuario.update({
        where: { id: usuario_id },
        data: { status: 'inativo' }
      });

      // Fazer logout
      req.logout((err) => {
        if (err) {
          return res.json({ 
            success: false, 
            message: 'Erro ao fazer logout' 
          });
        }

        res.json({ 
          success: true, 
          message: 'Conta desativada com sucesso',
          redirect: '/auth/login'
        });
      });

    } catch (error) {
      console.error('Erro ao desativar conta:', error);
      res.json({ 
        success: false, 
        message: 'Erro ao desativar conta' 
      });
    }
  }

  // ========================================
  // ESTATÍSTICAS DO USUÁRIO
  // ========================================
  static async estatisticas(req, res) {
    try {
      const usuario_id = req.user.id;

      let stats = {};

      if (req.user.tipo === 'professor' || req.user.tipo === 'administrador') {
        // Estatísticas de professor
        const [cursos, totalAlunos, totalAulas, totalAtividades] = await Promise.all([
          prisma.curso.count({ where: { usuario_id } }),
          prisma.inscricao.count({
            where: {
              curso: { usuario_id },
              status: 'aprovada'
            }
          }),
          prisma.aula.count({ where: { usuario_id } }),
          prisma.atividade.count({ where: { usuario_id } })
        ]);

        stats = {
          cursosCriados: cursos,
          totalAlunos,
          totalAulas,
          totalAtividades
        };

      } else {
        // Estatísticas de aluno
        const [cursosInscritos, aulasCompletas, atividadesCompletas] = await Promise.all([
          prisma.inscricao.count({
            where: {
              usuario_id,
              status: 'aprovada'
            }
          }),
          prisma.progresso.count({
            where: {
              inscricao: { usuario_id },
              aula_id: { not: null },
              concluida: true
            }
          }),
          prisma.progresso.count({
            where: {
              inscricao: { usuario_id },
              atividade_id: { not: null },
              concluida: true
            }
          })
        ]);

        stats = {
          cursosInscritos,
          aulasCompletas,
          atividadesCompletas
        };
      }

      res.json({ 
        success: true, 
        stats 
      });

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.json({ 
        success: false, 
        message: 'Erro ao buscar estatísticas' 
      });
    }
  }
}

export default UserController;