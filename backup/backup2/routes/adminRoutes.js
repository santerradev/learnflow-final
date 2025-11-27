// file: routes/adminRoutes.js
import express from 'express';
import AdminController from '../controllers/adminController.js';
import { eAutenticado, eAdministrador } from '../middleware/authMiddleware.js';

const router = express.Router();

// ========================================
// MIDDLEWARE: Todas as rotas precisam ser admin
// ========================================
router.use(eAutenticado);
router.use(eAdministrador);

// ========================================
// DASHBOARD ADMIN
// ========================================

// GET - Dashboard principal
router.get('/dashboard', AdminController.renderDashboard);

// ========================================
// GERENCIAR SOLICITAÇÕES DE CADASTRO
// ========================================

// GET - Listar todas as solicitações
router.get('/solicitacoes', AdminController.listarSolicitacoes);

// POST - Aprovar solicitação
router.post('/solicitacoes/:id/aprovar', AdminController.aprovarSolicitacao);

// POST - Rejeitar solicitação
router.post('/solicitacoes/:id/rejeitar', AdminController.rejeitarSolicitacao);

// ========================================
// GERENCIAR USUÁRIOS
// ========================================

// GET - Listar todos os usuários
router.get('/usuarios', AdminController.listarUsuarios);

// PUT/POST - Ativar/Desativar usuário (JSON)
router.put('/usuarios/:id/toggle-status', AdminController.toggleStatusUsuario);
router.post('/usuarios/:id/toggle-status', AdminController.toggleStatusUsuario);

// ========================================
// GERENCIAR CURSOS
// ========================================

// GET - Listar todos os cursos
router.get('/cursos', AdminController.listarCursos);

// DELETE - Deletar curso (JSON)
router.delete('/cursos/:id', AdminController.deletarCurso);

export default router;