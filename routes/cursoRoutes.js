// file: routes/cursoRoutes.js
import { Router } from 'express';
import * as cursoController from '../controllers/cursoController.js';
import { eAutenticado, eProfessorOuAdmin } from '../middleware/authMiddleware.js';
import { listarListas} from '../controllers/cursoController.js';
import { inscreverCurso, desinscreverCurso} from '../controllers/cursoController.js';
import { uploadImagem, uploadAula, uploadMaterial } from '../middleware/uploadMiddleware.js'; 

const router = Router();
router.use(eAutenticado);


// ROTAS DE LISTAGEM E CRIAÇÃO DE CURSOS

router.get('/', cursoController.renderMeusCursos);
router.get('/novo', eProfessorOuAdmin, cursoController.renderFormCurso);
router.post('/novo', 
    eProfessorOuAdmin, 
    uploadImagem.single('capa_curso'), 
    cursoController.criarCurso
);


// ROTAS DE INSCRIÇÃO
router.post('/:id/inscrever', eAutenticado, inscreverCurso);
router.post('/:id/desinscrever', eAutenticado, desinscreverCurso);


// ROTAS DE VISUALIZAÇÃO DO CURSO (PÁGINAS INTERNAS)
 
// Mural
router.get('/:id/mural', cursoController.renderMural);
router.post('/:id/publicacoes', cursoController.criarPublicacao);
router.put('/:id/publicacoes/:pubId', cursoController.editarPublicacao);
router.delete('/:id/publicacoes/:pubId', cursoController.deletarPublicacao);
router.post('/:id/publicacoes/:pubId/comentarios', cursoController.criarComentario);
router.delete('/:id/publicacoes/:pubId/comentarios/:comId', cursoController.deletarComentario);

// Aulas
router.get('/:id/aulas', cursoController.renderAulas);
router.post('/:id/aulas', eProfessorOuAdmin, uploadAula, cursoController.criarAula);
router.get('/:id/aulas/:aulaId', cursoController.renderVerAula);
router.post('/:id/aulas/:aulaId/concluir', cursoController.concluirAula);
router.delete('/:id/aulas/:aulaId', eProfessorOuAdmin, cursoController.deletarAula);

// Atividades
router.get('/:id/atividades', cursoController.renderAtividades);
router.post('/:id/atividades', eProfessorOuAdmin, cursoController.criarAtividade);
router.get('/:id/atividades/:atividadeId', cursoController.renderVerAtividade);
router.post('/:id/atividades/:atividadeId/submeter', cursoController.submeterAtividade);
router.delete('/:id/atividades/:atividadeId', eProfessorOuAdmin, cursoController.deletarAtividade);

// Materiais
router.get('/:id/materiais', cursoController.renderMateriais);
router.post('/:id/materiais', eProfessorOuAdmin, uploadMaterial.single('arquivo'), cursoController.criarMaterial);
router.get('/:id/materiais/:materialId/download', cursoController.downloadMaterial);
router.delete('/:id/materiais/:materialId', eProfessorOuAdmin, cursoController.deletarMaterial);

// Pessoas
router.get('/:id/pessoas', cursoController.renderPessoas);

// Listas
// GET /cursos/:id/listas - Listar listas (API)
router.get('/:id/listas', eAutenticado, listarListas);
router.get('/:id/listas', cursoController.listarListas);
router.post('/:id/listas', eProfessorOuAdmin, cursoController.criarLista);
router.delete('/:id/listas/:listaId', eProfessorOuAdmin, cursoController.deletarLista);

 
// ROTAS DE EDIÇÃO E DELEÇÃO DO CURSO
 
router.get('/:id/editar', eProfessorOuAdmin, cursoController.renderFormEdicaoCurso);
router.post('/:id/editar', 
    eProfessorOuAdmin, 
    uploadImagem.single('capa_curso'), 
    cursoController.atualizarCurso
);
router.post('/:id/deletar', eProfessorOuAdmin, cursoController.deletarCurso);

// Redireciona /cursos/:id para /cursos/:id/mural
router.get('/:id', (req, res) => {
    res.redirect(`/cursos/${req.params.id}/mural`);
});

export default router;