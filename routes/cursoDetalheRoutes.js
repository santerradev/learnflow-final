// file: routes/cursoDetalheRoutes.js
import { Router } from 'express';
import * as cursoDetalheController from '../controllers/cursoDetalheController.js';
import * as listaController from '../controllers/listaController.js';
import * as aulaController from '../controllers/aulaController.js';
import * as atividadeController from '../controllers/atividadeController.js';
import * as materialController from '../controllers/materialController.js';
import * as muralController from '../controllers/muralController.js';
import { eAutenticado } from '../middleware/authMiddleware.js';
import { eInscrito, eDonoDoCurso, carregarDadosCurso } from '../middleware/cursoMiddleware.js';
import { uploadAula, uploadImagem } from '../middleware/uploadMiddleware.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(eAutenticado);

// ==========================================
// ========= PÁGINAS DO CURSO ===============
// ==========================================

// GET /cursos/:cursoId/mural
router.get('/:cursoId/mural', eInscrito, carregarDadosCurso, cursoDetalheController.renderMural);

// GET /cursos/:cursoId/aulas
router.get('/:cursoId/aulas', eInscrito, carregarDadosCurso, cursoDetalheController.renderAulas);

// GET /cursos/:cursoId/atividades
router.get('/:cursoId/atividades', eInscrito, carregarDadosCurso, cursoDetalheController.renderAtividades);

// GET /cursos/:cursoId/materiais
router.get('/:cursoId/materiais', eInscrito, carregarDadosCurso, cursoDetalheController.renderMateriais);

// GET /cursos/:cursoId/pessoas
router.get('/:cursoId/pessoas', eInscrito, carregarDadosCurso, cursoDetalheController.renderPessoas);

// GET /cursos/:cursoId/aulas/:aulaId - Ver aula específica
router.get('/:cursoId/aulas/:aulaId', eInscrito, carregarDadosCurso, cursoDetalheController.renderVerAula);

// GET /cursos/:cursoId/atividades/:atividadeId - Ver atividade específica
router.get('/:cursoId/atividades/:atividadeId', eInscrito, carregarDadosCurso, cursoDetalheController.renderVerAtividade);

// ==========================================
// ============== LISTAS ====================
// ==========================================

// GET /cursos/:cursoId/listas - Listar listas
router.get('/:cursoId/listas', eInscrito, listaController.listarListas);

// POST /cursos/:cursoId/listas - Criar lista
router.post('/:cursoId/listas', eDonoDoCurso, listaController.criarLista);

// PUT /cursos/:cursoId/listas/:listaId - Atualizar lista
router.put('/:cursoId/listas/:listaId', eDonoDoCurso, listaController.atualizarLista);

// DELETE /cursos/:cursoId/listas/:listaId - Deletar lista
router.delete('/:cursoId/listas/:listaId', eDonoDoCurso, listaController.deletarLista);

// ==========================================
// ============== AULAS =====================
// ==========================================

// POST /cursos/:cursoId/aulas - Criar aula
router.post('/:cursoId/aulas', eDonoDoCurso, uploadAula, aulaController.criarAula);

// GET /cursos/:cursoId/aulas/:aulaId/dados - Dados da aula (API)
router.get('/:cursoId/aulas/:aulaId/dados', eInscrito, aulaController.obterAula);

// PUT /cursos/:cursoId/aulas/:aulaId - Atualizar aula
router.put('/:cursoId/aulas/:aulaId', eDonoDoCurso, uploadAula, aulaController.atualizarAula);

// DELETE /cursos/:cursoId/aulas/:aulaId - Deletar aula
router.delete('/:cursoId/aulas/:aulaId', eDonoDoCurso, aulaController.deletarAula);

// POST /cursos/:cursoId/aulas/:aulaId/concluir - Marcar como concluída
router.post('/:cursoId/aulas/:aulaId/concluir', eInscrito, aulaController.concluirAula);

// ==========================================
// ============ ATIVIDADES ==================
// ==========================================

// POST /cursos/:cursoId/atividades - Criar atividade
router.post('/:cursoId/atividades', eDonoDoCurso, atividadeController.criarAtividade);

// GET /cursos/:cursoId/atividades/:atividadeId/dados - Dados da atividade (API)
router.get('/:cursoId/atividades/:atividadeId/dados', eInscrito, atividadeController.obterAtividade);

// PUT /cursos/:cursoId/atividades/:atividadeId - Atualizar atividade
router.put('/:cursoId/atividades/:atividadeId', eDonoDoCurso, atividadeController.atualizarAtividade);

// DELETE /cursos/:cursoId/atividades/:atividadeId - Deletar atividade
router.delete('/:cursoId/atividades/:atividadeId', eDonoDoCurso, atividadeController.deletarAtividade);

// POST /cursos/:cursoId/atividades/:atividadeId/submeter - Submeter respostas
router.post('/:cursoId/atividades/:atividadeId/submeter', eInscrito, atividadeController.submeterAtividade);

// ==========================================
// ============ MATERIAIS ===================
// ==========================================

// Configuração do multer para materiais
import multer from 'multer';
import path from 'path';

const storageMateriais = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/materials/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const uploadMaterial = multer({ storage: storageMateriais });

// POST /cursos/:cursoId/materiais - Criar material
router.post('/:cursoId/materiais', eDonoDoCurso, uploadMaterial.single('arquivo'), materialController.criarMaterial);

// GET /cursos/:cursoId/materiais/:materialId/dados - Dados do material (API)
router.get('/:cursoId/materiais/:materialId/dados', eInscrito, materialController.obterMaterial);

// PUT /cursos/:cursoId/materiais/:materialId - Atualizar material
router.put('/:cursoId/materiais/:materialId', eDonoDoCurso, uploadMaterial.single('arquivo'), materialController.atualizarMaterial);

// DELETE /cursos/:cursoId/materiais/:materialId - Deletar material
router.delete('/:cursoId/materiais/:materialId', eDonoDoCurso, materialController.deletarMaterial);

// GET /cursos/:cursoId/materiais/:materialId/download - Download do material
router.get('/:cursoId/materiais/:materialId/download', eInscrito, materialController.downloadMaterial);

// ==========================================
// ============== MURAL =====================
// ==========================================

// GET /cursos/:cursoId/publicacoes - Listar publicações (API)
router.get('/:cursoId/publicacoes', eInscrito, muralController.listarPublicacoes);

// POST /cursos/:cursoId/publicacoes - Criar publicação
router.post('/:cursoId/publicacoes', eInscrito, carregarDadosCurso, muralController.criarPublicacao);

// PUT /cursos/:cursoId/publicacoes/:publicacaoId - Atualizar publicação
router.put('/:cursoId/publicacoes/:publicacaoId', eInscrito, carregarDadosCurso, muralController.atualizarPublicacao);

// DELETE /cursos/:cursoId/publicacoes/:publicacaoId - Deletar publicação
router.delete('/:cursoId/publicacoes/:publicacaoId', eInscrito, carregarDadosCurso, muralController.deletarPublicacao);

// POST /cursos/:cursoId/publicacoes/:publicacaoId/comentarios - Criar comentário
router.post('/:cursoId/publicacoes/:publicacaoId/comentarios', eInscrito, muralController.criarComentario);

// PUT /cursos/:cursoId/publicacoes/:publicacaoId/comentarios/:comentarioId - Atualizar comentário
router.put('/:cursoId/publicacoes/:publicacaoId/comentarios/:comentarioId', eInscrito, muralController.atualizarComentario);

// DELETE /cursos/:cursoId/publicacoes/:publicacaoId/comentarios/:comentarioId - Deletar comentário
router.delete('/:cursoId/publicacoes/:publicacaoId/comentarios/:comentarioId', eInscrito, carregarDadosCurso, muralController.deletarComentario);

export default router;