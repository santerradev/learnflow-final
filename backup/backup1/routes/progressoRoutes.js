// file: routes/progressoRoutes.js
import { Router } from 'express';
import * as progressoController from '../controllers/progressoController.js';
import { eAutenticado } from '../middleware/authMiddleware.js'; // Só usuários logados podem progredir

const router = Router();

// Aplica o middleware eAutenticado a todas as rotas de progresso
router.use(eAutenticado); 

// Rota para marcar uma aula como concluída
// POST /progresso/aulas/:aulaId/concluir
router.post('/aulas/:aulaId/concluir', progressoController.concluirAula);

// Rota para submeter as respostas de uma atividade
// POST /progresso/atividades/:atividadeId/submeter
// router.post('/atividades/:atividadeId/submeter', progressoController.submeterAtividade); // Descomente quando implementar

export default router;