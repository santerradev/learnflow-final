// file: routes/inscricaoRoutes.js
import express from 'express';
import InscricaoController from '../controllers/inscricaoController.js';
import { eAutenticado, eProfessorOuAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ========================================
// MIDDLEWARE: Todas as rotas precisam de autenticação
// ========================================
router.use(eAutenticado);

// ========================================
// ROTAS PARA ALUNOS
// ========================================

// POST - Inscrever-se em um curso (JSON)
router.post('/curso/:curso_id', InscricaoController.inscrever);

// DELETE - Cancelar inscrição (JSON)
router.delete('/curso/:curso_id', InscricaoController.cancelarInscricao);

// GET - Minhas inscrições (JSON)
router.get('/minhas', InscricaoController.minhasInscricoes);

// GET - Verificar status de inscrição em um curso (JSON)
router.get('/curso/:curso_id/status', InscricaoController.verificarInscricao);

// ========================================
// ROTAS PARA PROFESSOR/ADMIN
// ========================================

// GET - Listar inscrições de um curso (JSON)
router.get('/curso/:curso_id',
  eProfessorOuAdmin,
  InscricaoController.listarInscricoes
);

// DELETE - Remover aluno do curso (JSON)
router.delete('/curso/:curso_id/aluno/:aluno_id',
  eProfessorOuAdmin,
  InscricaoController.removerAluno
);

// GET - Estatísticas de inscrições de um curso (JSON)
router.get('/curso/:curso_id/estatisticas',
  eProfessorOuAdmin,
  InscricaoController.estatisticasInscricoes
);

// GET - Exportar lista de alunos (CSV)
router.get('/curso/:curso_id/exportar',
  eProfessorOuAdmin,
  InscricaoController.exportarAlunos
);

export default router;