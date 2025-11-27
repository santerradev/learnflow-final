// file: routes/notificacaoRoutes.js
import express from 'express';
import NotificacaoController from '../controllers/notificacaoController.js';
import { eAutenticado } from '../middleware/authMiddleware.js';

const router = express.Router();

// ========================================
// MIDDLEWARE: Todas as rotas precisam de autenticação
// ========================================
router.use(eAutenticado);

// ========================================
// ROTAS DE API (JSON)
// ========================================

// GET - Listar notificações do usuário
router.get('/api/notificacoes', NotificacaoController.listar);

// GET - Contar notificações não lidas
router.get('/api/notificacoes/count', NotificacaoController.contarNaoLidas);

// POST - Criar notificação (admin/professor)
router.post('/api/notificacoes', NotificacaoController.criar);

// PUT - Marcar notificação como lida
router.put('/api/notificacoes/:id/ler', NotificacaoController.marcarLida);

// PUT - Marcar todas como lidas
router.put('/api/notificacoes/ler-todas', NotificacaoController.marcarTodasLidas);

// DELETE - Deletar notificação específica
router.delete('/api/notificacoes/:id', NotificacaoController.deletar);

// DELETE - Limpar notificações lidas
router.delete('/api/notificacoes/limpar-lidas', NotificacaoController.limparLidas);

// ========================================
// ROTAS DE VIEW
// ========================================

// GET - Página de notificações
router.get('/notificacoes', NotificacaoController.viewNotificacoes);

export default router;