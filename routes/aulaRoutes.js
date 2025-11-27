// file: routes/aulaRoutes.js
import { Router } from 'express';
// import * as aulaController from '../controllers/aulaController.js'; // Descomente quando criar o controller
import { eAutenticado, eProfessorOuAdmin } from '../middleware/authMiddleware.js';
import { uploadAula } from '../middleware/uploadMiddleware.js'; // Middleware específico para uploads de aula

// { mergeParams: true } permite acessar req.params.cursoId das rotas pai (/cursos/:cursoId)
const router = Router({ mergeParams: true });

// Aplica middlewares a todas as rotas de aula aninhadas
router.use(eAutenticado); // Garante que o usuário está logado

// Exemplo: Rota para mostrar o formulário de criação de aula
// GET /cursos/:cursoId/aulas/novo
// router.get('/novo', eProfessorOuAdmin, aulaController.renderFormAula);

// Exemplo: Rota para processar a criação de aula
// POST /cursos/:cursoId/aulas/novo
// router.post('/novo', 
//     eProfessorOuAdmin, 
//     uploadAula, // Middleware para capa e vídeo
//     aulaController.criarAula
// );

// TODO: Implementar as rotas e o aulaController.js completo (CRUD de Aulas)

export default router;