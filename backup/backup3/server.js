// file: server.js (ATUALIZADO COM TODAS AS ROTAS)
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import flash from 'connect-flash';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ========================================
// IMPORTAR CONFIGURAÇÃO DO PASSPORT
// ========================================
import configurePassport from './config/passport.js';

// ========================================
// IMPORTAR TODAS AS ROTAS
// ========================================
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import cursoRoutes from './routes/cursoRoutes.js';
import aulaRoutes from './routes/aulaRoutes.js';
import atividadeRoutes from './routes/atividadeRoutes.js';
import inscricaoRoutes from './routes/inscricaoRoutes.js';
import muralRoutes from './routes/muralRoutes.js';
import progressoRoutes from './routes/progressoRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificacaoRoutes from './routes/notificacaoRoutes.js';

// ========================================
// IMPORTAR CONTROLLERS DE PÁGINA
// ========================================
import * as pageController from './controllers/pageController.js';
import { eAutenticado } from './middleware/authMiddleware.js';

// ========================================
// CONFIGURAÇÃO DE DIRETÓRIO
// ========================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente
dotenv.config();

// ========================================
// INICIALIZAÇÃO
// ========================================
const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// CONFIGURAÇÃO ESSENCIAL
// ========================================

// 1. View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 2. Middlewares Globais de Parsing e Arquivos Estáticos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 3. Configuração da Sessão (DEVE VIR ANTES DO PASSPORT!)
app.use(session({
  secret: process.env.SESSION_SECRET || 'um_segredo_muito_forte',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Mude para true se estiver usando HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 dia
  },
}));

// 4. Inicializar o Passport
app.use(passport.initialize());
app.use(passport.session());

// 5. Configurar as Estratégias do Passport
configurePassport(passport);

// 6. Inicializar o Connect-Flash
app.use(flash());

// 7. Middleware para expor dados às views
app.use((req, res, next) => {
  // Expõe o usuário autenticado (Passport armazena em req.user)
  res.locals.usuario = req.user || null;
  
  // Expõe mensagens flash
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  
  next();
});

// ========================================
// REGISTRO DAS ROTAS
// ========================================

// --- ROTAS PRINCIPAIS ---
app.get('/', pageController.renderLandingPage);
app.get('/inicio', eAutenticado, pageController.renderInicio);
app.get('/buscar', eAutenticado, pageController.buscar);
app.get('/sobre', pageController.renderSobre);
app.get('/contato', pageController.renderContato);
app.post('/contato', pageController.processarContato);

// --- ROTAS DE MÓDULOS ---
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/cursos', cursoRoutes);
app.use('/curso', cursoRoutes); // Alias para /cursos
app.use('/aulas', aulaRoutes);
app.use('/atividades', atividadeRoutes);
app.use('/inscricoes', inscricaoRoutes);
app.use('/mural', muralRoutes);
app.use('/progresso', progressoRoutes);
app.use('/user', userRoutes);
app.use('/', notificacaoRoutes); // Rotas de notificações (raiz)

// ========================================
// HANDLER 404 (Último middleware de rota)
// ========================================
app.use((req, res, next) => {
  if (res.locals.usuario) {
    res.status(404).render('404_app', {
      pageTitle: '404 - Página não encontrada'
    });
  } else {
    res.status(404).render('404_auth', {
      pageTitle: '404 - Página não encontrada'
    });
  }
});

// ========================================
// HANDLER DE ERROS (Opcional mas recomendado)
// ========================================
app.use((err, req, res, next) => {
  console.error('❌ Erro no servidor:', err);
  
  res.status(err.status || 500);
  
  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    // Se for requisição AJAX/JSON
    res.json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } else {
    // Se for requisição de página
    res.render('error', {
      message: 'Ocorreu um erro no servidor',
      error: process.env.NODE_ENV === 'development' ? err : {},
      pageTitle: 'Erro'
    });
  }
});

// ========================================
// INICIALIZAÇÃO DO SERVIDOR
// ========================================
app.listen(PORT, () => {
  console.log(`✅ Servidor LearnFlow rodando em http://localhost:${PORT}`);
  console.log(`📚 Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Sessão: ${session ? 'Configurada' : 'Erro'}`);
  console.log(`🎯 Passport: ${passport ? 'Configurado' : 'Erro'}`);
  console.log(`\n🚀 Rotas registradas:`);
  console.log(`   - /auth (Autenticação)`);
  console.log(`   - /admin (Administração)`);
  console.log(`   - /cursos (Cursos)`);
  console.log(`   - /aulas (Aulas)`);
  console.log(`   - /atividades (Atividades)`);
  console.log(`   - /inscricoes (Inscrições)`);
  console.log(`   - /mural (Mural/Fórum)`);
  console.log(`   - /progresso (Progresso)`);
  console.log(`   - /user (Usuário/Perfil)`);
  console.log(`   - /notificacoes (Notificações)`);
  console.log(`\n🎉 Sistema pronto para uso!\n`);
});

export default app;