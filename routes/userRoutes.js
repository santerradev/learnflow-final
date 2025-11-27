// file: routes/userRoutes.js
import express from 'express';
import { eAutenticado } from '../middleware/authMiddleware.js';
import { uploadImagem } from '../middleware/uploadMiddleware.js';
import { 
    renderProfile, 
    updateProfile, 
    updateFoto,
    renderConfiguracoes,
    alterarSenha 
} from '../controllers/userController.js';

const router = express.Router();

// GET /user/perfil - Renderizar página de perfil
router.get('/perfil', eAutenticado, renderProfile);

// PATCH /user/perfil - Atualizar informações pessoais
router.patch('/perfil', eAutenticado, updateProfile);

// POST /user/perfil/foto - Atualizar foto de perfil
router.post('/perfil/foto', eAutenticado, uploadImagem.single('foto_perfil'), updateFoto);

// GET /user/configuracoes - Página de configurações
router.get('/configuracoes', eAutenticado, renderConfiguracoes);

// POST /user/alterar-senha - Alterar senha
router.post('/alterar-senha', eAutenticado, alterarSenha);

export default router;