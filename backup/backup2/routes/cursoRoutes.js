// file: routes/cursoRoutes.js
import express from 'express';
import CursoController from '../controllers/cursoController.js';
import { eAutenticado, eProfessorOuAdmin } from '../middleware/authMiddleware.js';
import { uploadImagem } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ========================================
// MIDDLEWARE: Todas as rotas precisam de autenticação
// ========================================
router.use(eAutenticado);

// ========================================
// ROTAS PÚBLICAS (Autenticadas)
// ========================================

// GET - Listar todos os cursos (catálogo)
router.get('/', CursoController.listarCursos);

// GET - Meus cursos (professor/aluno)
router.get('/meus-cursos', CursoController.meusCursos);

// GET - Detalhes de um curso específico
router.get('/:id', CursoController.detalhesCurso);

// ========================================
// INSCRIÇÕES
// ========================================

// POST - Inscrever-se em um curso (JSON)
router.post('/:id/inscrever', CursoController.inscrever);

// ========================================
// GERENCIAR CURSOS (Professor/Admin)
// ========================================

// POST - Criar novo curso (JSON)
router.post('/',
  eProfessorOuAdmin,
  uploadImagem.single('capa_curso'),
  CursoController.criarCurso
);

// PUT - Editar curso (JSON)
router.put('/:id',
  eProfessorOuAdmin,
  uploadImagem.single('capa_curso'),
  CursoController.editarCurso
);

// DELETE - Deletar curso (JSON)
router.delete('/:id',
  eProfessorOuAdmin,
  CursoController.deletarCurso
);

export default router;