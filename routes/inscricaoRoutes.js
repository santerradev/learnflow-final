// file: routes/inscricaoRoutes.js
import { Router } from 'express';
import * as inscricaoController from '../controllers/inscricaoController.js';
import { eAutenticado } from '../middleware/authMiddleware.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(eAutenticado);

// POST /cursos/:id/inscrever - Inscrever no curso
router.post('/:id/inscrever', inscricaoController.inscreverNoCurso);

// POST /cursos/:id/cancelar-inscricao - Cancelar inscrição
router.post('/:id/cancelar-inscricao', inscricaoController.cancelarInscricao);

// GET /cursos/:id/verificar-inscricao - Verificar se está inscrito
router.get('/:id/verificar-inscricao', inscricaoController.verificarInscricao);

export default router;