// file: routes/cursoRoutes.js
import { Router } from 'express';
import * as cursoController from '../controllers/cursoController.js';
import { eAutenticado, eProfessorOuAdmin } from '../middleware/authMiddleware.js';
import { uploadImagem } from '../middleware/uploadMiddleware.js'; 
import aulaRoutes from './aulaRoutes.js';
import atividadeRoutes from './atividadeRoutes.js';

const router = Router();
router.use(eAutenticado);

// --- Rotas de Curso Existentes ---
router.get('/', cursoController.renderMeusCursos);
router.get('/novo', eProfessorOuAdmin, cursoController.renderFormCurso);
router.post('/novo', 
    eProfessorOuAdmin, 
    uploadImagem.single('capa_curso'), 
    cursoController.criarCurso
);
router.get('/:id/editar', eProfessorOuAdmin, cursoController.renderFormEdicaoCurso);
router.post('/:id/editar', 
    eProfessorOuAdmin, 
    uploadImagem.single('capa_curso'), 
    cursoController.atualizarCurso
);

// --- NOVA ROTA DE DELEÇÃO ---
// Rota POST /cursos/:id/deletar (Processa a exclusão)
// Apenas o dono do curso ou admin podem deletar
router.post('/:id/deletar', eProfessorOuAdmin, cursoController.deletarCurso); 
// ----------------------------

// --- Rota de Detalhes (Exemplo) ---
// router.get('/:id', cursoController.renderDetalheCurso); 

// --- Rotas Aninhadas ---
router.use('/:cursoId/aulas', aulaRoutes);
router.use('/:cursoId/atividades', atividadeRoutes);

export default router;