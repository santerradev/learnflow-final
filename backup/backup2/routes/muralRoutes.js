// file: routes/muralRoutes.js
import express from 'express';
import MuralController from '../controllers/muralController.js';
import { eAutenticado } from '../middleware/authMiddleware.js';

const router = express.Router();

// ========================================
// MIDDLEWARE: Todas as rotas precisam de autenticação
// ========================================
router.use(eAutenticado);

// ========================================
// PUBLICAÇÕES
// ========================================

// POST - Criar publicação no mural de um curso (JSON)
router.post('/:id/publicacoes', MuralController.criarPublicacao);

// PUT - Editar publicação (JSON)
router.put('/publicacoes/:id', MuralController.editarPublicacao);

// DELETE - Deletar publicação (JSON)
router.delete('/publicacoes/:id', MuralController.deletarPublicacao);

// ========================================
// COMENTÁRIOS
// ========================================

// POST - Criar comentário em uma publicação (JSON)
router.post('/publicacoes/:id/comentarios', MuralController.criarComentario);

// DELETE - Deletar comentário (JSON)
router.delete('/comentarios/:id', MuralController.deletarComentario);

export default router;