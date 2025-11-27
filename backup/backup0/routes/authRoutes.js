// file: routes/authRoutes.js
import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { uploadImagem } from '../middleware/uploadMiddleware.js'; // Para a foto de perfil

const router = Router();

// --- Rotas GET (Para mostrar as páginas EJS) ---
router.get('/login', authController.renderLogin);       // Mostra o formulário de login
router.get('/cadastro', authController.renderCadastro); // Mostra o formulário de cadastro

// --- Rotas POST (Para processar os formulários) ---
router.post('/cadastro', 
    uploadImagem.single('foto_perfil'), // Middleware do Multer para processar o upload da foto
    authController.processarCadastro  // Controller para criar aluno ou solicitação de professor
);
router.post('/login', authController.processarLogin);   // Controller para validar o login e criar a sessão
router.post('/logout', authController.processarLogout); // Controller para destruir a sessão

export default router;