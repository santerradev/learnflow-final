import express from 'express';
import * as muralController from '../controllers/muralController.js';
import { ensureAuthenticated, verificarInscricaoCurso } from '../middleware/authMiddleware.js';

const router = express.Router();

// ====================================
// ROTAS DO MURAL
// ====================================

// Visualizar mural do curso
router.get('/cursos/:id/mural', 
    ensureAuthenticated, 
    verificarInscricaoCurso, 
    muralController.renderMural
);

// ====================================
// ROTAS DE PUBLICAÇÕES
// ====================================

// Criar publicação
router.post('/cursos/:id/publicacoes', 
    ensureAuthenticated, 
    verificarInscricaoCurso, 
    muralController.criarPublicacao
);

// Editar publicação
router.put('/publicacoes/:id', 
    ensureAuthenticated, 
    muralController.editarPublicacao
);

// Deletar publicação
router.delete('/publicacoes/:id', 
    ensureAuthenticated, 
    muralController.deletarPublicacao
);

// ====================================
// ROTAS DE COMENTÁRIOS
// ====================================

// Criar comentário
router.post('/publicacoes/:id/comentarios', 
    ensureAuthenticated, 
    muralController.criarComentario
);

// Editar comentário
router.put('/comentarios/:id', 
    ensureAuthenticated, 
    muralController.editarComentario
);

// Deletar comentário
router.delete('/comentarios/:id', 
    ensureAuthenticated, 
    muralController.deletarComentario
);

export default router;