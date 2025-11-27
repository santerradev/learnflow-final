// file: routes/authRoutes.js
import express from 'express';
import passport from 'passport';
import AuthController from '../controllers/authController.js';
import { uploadImagem } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ========================================
// ROTAS PÚBLICAS (Sem autenticação)
// ========================================

// GET - Renderizar página de login
router.get('/login', AuthController.renderLogin);

// POST - Processar login (Passport)
router.post('/login',
  passport.authenticate('local', {
    failureRedirect: '/auth/login',
    failureFlash: true
  }),
  AuthController.processarLogin
);

// GET - Renderizar página de cadastro
router.get('/cadastro', AuthController.renderCadastro);

// POST - Processar cadastro
router.post('/cadastro',
  uploadImagem.single('foto_perfil'),
  AuthController.processarCadastro
);

// ========================================
// ROTAS AUTENTICADAS
// ========================================

// GET/POST - Logout
router.get('/logout', AuthController.logout);
router.post('/logout', AuthController.logout);

export default router;