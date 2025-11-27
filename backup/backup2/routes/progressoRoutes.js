// file: routes/progressoRoutes.js
import express from 'express';
import ProgressoController from '../controllers/progressoController.js';
import { eAutenticado } from '../middleware/authMiddleware.js';

const router = express.Router();

// ========================================
// MIDDLEWARE: Todas as rotas precisam de autenticação
// ========================================
router.use(eAutenticado);

// ========================================
// MARCAR CONCLUSÃO
// ========================================

// POST - Marcar aula como concluída (JSON)
router.post('/aula/:aula_id/concluir', ProgressoController.marcarAulaConcluida);

// POST - Marcar atividade como concluída (JSON)
router.post('/atividade/:atividade_id/concluir', ProgressoController.marcarAtividadeConcluida);

// ========================================
// DESMARCAR CONCLUSÃO
// ========================================

// DELETE - Desmarcar conclusão (JSON)
router.delete('/:tipo/:id/desmarcar', ProgressoController.desmarcarConclusao);

// ========================================
// OBTER PROGRESSO
// ========================================

// GET - Obter progresso de um curso (JSON)
router.get('/curso/:curso_id', ProgressoController.obterProgresso);

// GET - Relatório de progresso detalhado (JSON)
router.get('/curso/:curso_id/relatorio', ProgressoController.relatorioProgresso);

export default router;