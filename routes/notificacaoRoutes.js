// file: routes/notificacaoRoutes.js

import { Router } from 'express';
import * as notificacaoController from '../controllers/notificacaoController.js';
import { eAutenticado } from '../middleware/authMiddleware.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(eAutenticado);

// GET /notificacoes - Página de notificações
router.get('/', notificacaoController.renderNotificacoes);

// GET /notificacoes/api - Listar notificações (API)
router.get('/api', notificacaoController.listarNotificacoes);

// GET /notificacoes/api/contagem - Contar não lidas
router.get('/api/contagem', notificacaoController.contarNaoLidas);

// PUT /notificacoes/api/:id/ler - Marcar como lida
router.put('/api/:id/ler', notificacaoController.marcarComoLida);

// PUT /notificacoes/api/ler-todas - Marcar todas como lidas
router.put('/api/ler-todas', notificacaoController.marcarTodasComoLidas);

// DELETE /notificacoes/api/:id - Deletar notificação
router.delete('/api/:id', notificacaoController.deletarNotificacao);

// DELETE /notificacoes/api/limpar - Limpar todas
router.delete('/api/limpar', notificacaoController.limparNotificacoes);

export default router;