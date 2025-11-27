// file: routes/atividadeRoutes.js
import express from 'express';
import AtividadeController from '../controllers/atividadeController.js';
import { eAutenticado, eProfessorOuAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ========================================
// MIDDLEWARE: Todas as rotas precisam de autenticação
// ========================================
router.use(eAutenticado);

// ========================================
// ROTAS PÚBLICAS (Autenticadas)
// ========================================

// GET - Listar atividades de uma lista
router.get('/lista/:lista_id', AtividadeController.listarAtividades);

// GET - Detalhes de uma atividade (JSON)
router.get('/:id', AtividadeController.detalhesAtividade);

// GET - Visualizar atividade (VIEW)
router.get('/:id/visualizar', AtividadeController.visualizarAtividade);

// POST - Submeter resposta da atividade (Aluno)
router.post('/:id/submeter', AtividadeController.submeterResposta);

// ========================================
// GERENCIAR ATIVIDADES (Professor/Admin)
// ========================================

// POST - Criar nova atividade (JSON)
router.post('/',
  eProfessorOuAdmin,
  AtividadeController.criarAtividade
);

// PUT - Editar atividade (JSON)
router.put('/:id',
  eProfessorOuAdmin,
  AtividadeController.editarAtividade
);

// DELETE - Deletar atividade (JSON)
router.delete('/:id',
  eProfessorOuAdmin,
  AtividadeController.deletarAtividade
);

// PUT - Reordenar atividades de uma lista (JSON)
router.put('/lista/:lista_id/reordenar',
  eProfessorOuAdmin,
  AtividadeController.reordenarAtividades
);

export default router;