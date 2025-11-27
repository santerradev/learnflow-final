// file: controllers/muralController.js
import { PrismaClient } from '@prisma/client';
import { notificarInscritosCurso } from './notificacaoController.js';

const prisma = new PrismaClient();

class MuralController {

  // ========================================
  // CRIAR PUBLICAÇÃO
  // ========================================
  static async criarPublicacao(req, res) {
    try {
      const { id: curso_id } = req.params;
      const { conteudo } = req.body;
      const usuario_id = req.user.id;

      if (!conteudo || conteudo.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'Conteúdo não pode estar vazio' 
        });
      }

      // Verificar se está inscrito no curso
      const curso = await prisma.curso.findUnique({
        where: { id: parseInt(curso_id) },
        select: { id: true, titulo: true, usuario_id: true }
      });

      if (!curso) {
        return res.status(404).json({ 
          success: false, 
          message: 'Curso não encontrado' 
        });
      }

      const inscricao = await prisma.inscricao.findUnique({
        where: {
          usuario_id_curso_id: {
            usuario_id,
            curso_id: parseInt(curso_id)
          }
        }
      });

      const eDono = curso.usuario_id === usuario_id;
      const eAdmin = req.user.tipo === 'administrador';

      if (!inscricao && !eDono && !eAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Você precisa estar inscrito neste curso' 
        });
      }

      // Criar publicação
      const publicacao = await prisma.publicacao.create({
        data: {
          conteudo: conteudo.trim(),
          curso_id: parseInt(curso_id),
          usuario_id
        },
        include: {
          autor: {
            select: { id: true, nome: true, foto_perfil: true, tipo: true }
          }
        }
      });

      // Notificar todos os inscritos
      await notificarInscritosCurso(parseInt(curso_id), {
        tipo: 'nova_mensagem',
        titulo: `💬 Nova publicação em ${curso.titulo}`,
        mensagem: `${req.user.nome} publicou no mural`,
        link: `/curso/${curso_id}?aba=mural`
      });

      res.json({ 
        success: true, 
        message: 'Publicação criada com sucesso!',
        publicacao
      });

    } catch (error) {
      console.error('Erro ao criar publicação:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao criar publicação' 
      });
    }
  }

  // ========================================
  // EDITAR PUBLICAÇÃO
  // ========================================
  static async editarPublicacao(req, res) {
    try {
      const { id } = req.params;
      const { conteudo } = req.body;
      const usuario_id = req.user.id;

      if (!conteudo || conteudo.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'Conteúdo não pode estar vazio' 
        });
      }

      const publicacao = await prisma.publicacao.findUnique({
        where: { id: parseInt(id) }
      });

      if (!publicacao) {
        return res.status(404).json({ 
          success: false, 
          message: 'Publicação não encontrada' 
        });
      }

      // Verificar permissão
      if (publicacao.usuario_id !== usuario_id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Sem permissão para editar esta publicação' 
        });
      }

      await prisma.publicacao.update({
        where: { id: parseInt(id) },
        data: { 
          conteudo: conteudo.trim(),
          editado: true
        }
      });

      res.json({ 
        success: true, 
        message: 'Publicação editada com sucesso!' 
      });

    } catch (error) {
      console.error('Erro ao editar publicação:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao editar publicação' 
      });
    }
  }

  // ========================================
  // DELETAR PUBLICAÇÃO
  // ========================================
  static async deletarPublicacao(req, res) {
    try {
      const { id } = req.params;
      const usuario_id = req.user.id;

      const publicacao = await prisma.publicacao.findUnique({
        where: { id: parseInt(id) },
        include: {
          curso: {
            select: { usuario_id: true }
          }
        }
      });

      if (!publicacao) {
        return res.status(404).json({ 
          success: false, 
          message: 'Publicação não encontrada' 
        });
      }

      // Verificar permissão (autor, dono do curso ou admin)
      const eDono = publicacao.curso.usuario_id === usuario_id;
      const eAutor = publicacao.usuario_id === usuario_id;
      const eAdmin = req.user.tipo === 'administrador';

      if (!eAutor && !eDono && !eAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Sem permissão para deletar esta publicação' 
        });
      }

      await prisma.publicacao.delete({
        where: { id: parseInt(id) }
      });

      res.json({ 
        success: true, 
        message: 'Publicação deletada com sucesso!' 
      });

    } catch (error) {
      console.error('Erro ao deletar publicação:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao deletar publicação' 
      });
    }
  }

  // ========================================
  // CRIAR COMENTÁRIO
  // ========================================
  static async criarComentario(req, res) {
    try {
      const { id: publicacao_id } = req.params;
      const { conteudo } = req.body;
      const usuario_id = req.user.id;

      if (!conteudo || conteudo.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'Conteúdo não pode estar vazio' 
        });
      }

      const publicacao = await prisma.publicacao.findUnique({
        where: { id: parseInt(publicacao_id) },
        include: {
          curso: {
            select: { id: true, titulo: true }
          },
          autor: {
            select: { id: true }
          }
        }
      });

      if (!publicacao) {
        return res.status(404).json({ 
          success: false, 
          message: 'Publicação não encontrada' 
        });
      }

      // Criar comentário
      const comentario = await prisma.comentario.create({
        data: {
          conteudo: conteudo.trim(),
          publicacao_id: parseInt(publicacao_id),
          usuario_id
        },
        include: {
          autor: {
            select: { id: true, nome: true, foto_perfil: true }
          }
        }
      });

      // Notificar autor da publicação (se não for o próprio)
      if (publicacao.usuario_id !== usuario_id) {
        await criarNotificacao({
          usuario_id: publicacao.usuario_id,
          tipo: 'nova_mensagem',
          titulo: '💬 Novo comentário',
          mensagem: `${req.user.nome} comentou na sua publicação`,
          link: `/curso/${publicacao.curso.id}?aba=mural`,
          curso_id: publicacao.curso.id
        });
      }

      res.json({ 
        success: true, 
        message: 'Comentário criado com sucesso!',
        comentario
      });

    } catch (error) {
      console.error('Erro ao criar comentário:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao criar comentário' 
      });
    }
  }

  // ========================================
  // DELETAR COMENTÁRIO
  // ========================================
  static async deletarComentario(req, res) {
    try {
      const { id } = req.params;
      const usuario_id = req.user.id;

      const comentario = await prisma.comentario.findUnique({
        where: { id: parseInt(id) },
        include: {
          publicacao: {
            include: {
              curso: {
                select: { usuario_id: true }
              }
            }
          }
        }
      });

      if (!comentario) {
        return res.status(404).json({ 
          success: false, 
          message: 'Comentário não encontrado' 
        });
      }

      // Verificar permissão (autor, dono do curso ou admin)
      const eDono = comentario.publicacao.curso.usuario_id === usuario_id;
      const eAutor = comentario.usuario_id === usuario_id;
      const eAdmin = req.user.tipo === 'administrador';

      if (!eAutor && !eDono && !eAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Sem permissão para deletar este comentário' 
        });
      }

      await prisma.comentario.delete({
        where: { id: parseInt(id) }
      });

      res.json({ 
        success: true, 
        message: 'Comentário deletado com sucesso!' 
      });

    } catch (error) {
      console.error('Erro ao deletar comentário:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao deletar comentário' 
      });
    }
  }
}

export default MuralController;