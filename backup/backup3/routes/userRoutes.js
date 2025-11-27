// file: routes/userRoutes.js
import express from 'express';
import UserController from '../controllers/userController.js';
import { eAutenticado } from '../middleware/authMiddleware.js';
import { uploadImagem } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ========================================
// MIDDLEWARE: Todas as rotas precisam de autenticação
// ========================================
router.use(eAutenticado);

// ========================================
// PERFIL
// ========================================

// GET - Visualizar perfil
router.get('/perfil', UserController.verPerfil);
router.get('/profile', UserController.verPerfil); // Alias em inglês

// POST - Editar perfil inline (JSON)
router.post('/perfil/editar', UserController.editarPerfil);

// POST - Upload foto de perfil (JSON)
router.post('/perfil/foto',
  uploadImagem.single('foto_perfil'),
  UserController.uploadFotoPerfil
);

// ========================================
// SEGURANÇA
// ========================================

// POST - Alterar senha (JSON)
router.post('/perfil/alterar-senha', UserController.alterarSenha);

// POST - Desativar conta (JSON)
router.post('/perfil/desativar', UserController.desativarConta);

// ========================================
// ESTATÍSTICAS
// ========================================

// GET - Estatísticas do usuário (JSON)
router.get('/estatisticas', UserController.estatisticas);

export default router;