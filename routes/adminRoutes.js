// file: routes/adminRoutes.js
import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { eAutenticado, eAdministrador } from '../middleware/authMiddleware.js';
import { uploadImagem } from '../middleware/uploadMiddleware.js'; 

const router = Router();

router.use(eAutenticado, eAdministrador);

// --- Rotas GET ---
router.get('/estatisticas', adminController.getEstatisticas);
router.get('/usuarios', adminController.listarUsuarios);
router.get('/solicitacoes', adminController.listarSolicitacoes);
router.get('/usuarios/:id/editar', adminController.renderFormEdicaoUsuario);

// --- Rotas POST ---
router.post('/usuarios/:id/deletar', adminController.deletarUsuario);
router.post('/solicitacoes/:id/aprovar', adminController.aprovarSolicitacao); // Corrected spelling
router.post('/usuarios/:id/editar', 
    uploadImagem.single('foto_perfil'), 
    adminController.atualizarUsuario
);

export default router;