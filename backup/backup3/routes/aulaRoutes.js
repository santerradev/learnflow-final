// file: routes/aulaRoutes.js
import express from 'express';
import AulaController from '../controllers/aulaController.js';
import { eAutenticado, eProfessorOuAdmin } from '../middleware/authMiddleware.js';
import { uploadAula } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ========================================
// MIDDLEWARE: Todas as rotas precisam de autenticação
// ========================================
router.use(eAutenticado);

// ========================================
// ROTAS PÚBLICAS (Autenticadas)
// ========================================

// GET - Listar aulas de uma lista
router.get('/lista/:lista_id', AulaController.listarAulas);

// GET - Detalhes de uma aula (JSON)
router.get('/:id', AulaController.detalhesAula);

// GET - Visualizar aula (VIEW)
router.get('/:id/visualizar', AulaController.visualizarAula);

// ========================================
// GERENCIAR AULAS (Professor/Admin)
// ========================================

// POST - Criar nova aula
router.post('/',
  eProfessorOuAdmin,
  uploadAula, // Suporta capa_aula e video
  AulaController.criarAula
);

// PUT - Editar aula
router.put('/:id',
  eProfessorOuAdmin,
  uploadAula,
  AulaController.editarAula
);

// DELETE - Deletar aula (JSON)
router.delete('/:id',
  eProfessorOuAdmin,
  AulaController.deletarAula
);

// PUT - Reordenar aulas de uma lista (JSON)
router.put('/lista/:lista_id/reordenar',
  eProfessorOuAdmin,
  AulaController.reordenarAulas
);

export default router;