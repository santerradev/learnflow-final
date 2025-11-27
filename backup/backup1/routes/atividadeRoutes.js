// file: routes/atividadeRoutes.js
import { Router } from 'express';
// import * as atividadeController from '../controllers/atividadeController.js'; // Descomente quando criar o controller
import { eAutenticado, eProfessorOuAdmin } from '../middleware/authMiddleware.js';

// { mergeParams: true } permite acessar req.params.cursoId
const router = Router({ mergeParams: true });

// Aplica middlewares a todas as rotas de atividade aninhadas
router.use(eAutenticado);

// Exemplo: Rota para mostrar o formulário de criação de atividade
// GET /cursos/:cursoId/atividades/novo
// router.get('/novo', eProfessorOuAdmin, atividadeController.renderFormAtividade);

// Exemplo: Rota para processar a criação de atividade
// POST /cursos/:cursoId/atividades/novo
// router.post('/novo', eProfessorOuAdmin, atividadeController.criarAtividade);

// TODO: Implementar as rotas e o atividadeController.js completo (CRUD de Atividades)

export default router;