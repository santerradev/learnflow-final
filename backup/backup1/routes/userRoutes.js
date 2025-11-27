// file: routes/userRoutes.js
import express from 'express';
import { eAutenticado } from '../middleware/authMiddleware.js';
import { renderProfile, updateProfile } from '../controllers/userController.js';

const router = express.Router();

/**
 * Rota GET /perfil
 * Montada em '/user', o caminho completo se torna '/user/perfil'
 * Protegida pelo middleware 'eAutenticado'
 */
router.get('/perfil', eAutenticado, renderProfile);

/**
 * Rota PATCH /perfil
 * Montada em '/user', o caminho completo se torna '/user/perfil'
 * Protegida pelo middleware 'eAutenticado'
 */
router.patch('/perfil', eAutenticado, updateProfile);

export default router;