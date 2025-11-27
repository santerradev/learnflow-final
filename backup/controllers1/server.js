// file: server.js
import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import passport from 'passport'; // Importa o Passport
import flash from 'connect-flash'; // Importa o connect-flash
import configurePassport from './config/passport.js'; // Importa sua configuração do passport.js

// Importando Rotas
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import cursoRoutes from './routes/cursoRoutes.js';
import progressoRoutes from './routes/progressoRoutes.js';

// (Certifique-se de ter as rotas aulaRoutes e atividadeRoutes se já as criou)
// import aulaRoutes from './routes/aulaRoutes.js'; 
// import atividadeRoutes from './routes/atividadeRoutes.js';
// (Certifique-se de ter a rota perfilRoutes se já a criou)
// import perfilRoutes from './routes/perfilRoutes.js'; 

// Importando PageController e Middleware
import * as pageController from './controllers/pageController.js';
// Importe o eAutenticado do seu middleware (ele será atualizado para Passport no próximo passo)
import { eAutenticado } from './middleware/authMiddleware.js'; 

// Configuração de diretório
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicialização
const app = express();
const PORT = process.env.PORT || 3000;

// === CONFIGURAÇÃO ESSENCIAL ANTES DAS ROTAS ===

// 1. Configuração da View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 2. Middlewares Globais de Parsing e Arquivos Estáticos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); 

// 3. Configuração da Sessão (O PASSPORT PRECISA DISSO)
// (Deve vir ANTES do passport.session())
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_key_muito_segura', // Use uma chave forte no .env
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, // Em produção, mude para 'true' e use HTTPS
    httpOnly: true 
  }, 
}));

// 4. INICIALIZAÇÃO DO PASSPORT (DEVE VIR APÓS A SESSÃO)
app.use(flash()); // Inicia o connect-flash (para mensagens de erro/sucesso)
app.use(passport.initialize());
app.use(passport.session()); // Permite que o Passport use a sessão do Express

// 5. Chama nossa função de configuração do Passport (que você já criou)
configurePassport(passport);

// 6. MIDDLEWARE GLOBAL (ATUALIZADO PARA PASSPORT)
app.use((req, res, next) => {
  // O Passport anexa o usuário logado em 'req.user'
  // Passamos para res.locals.usuario para que o EJS continue funcionando sem alterações
  res.locals.usuario = req.user; 
  
  // Passa as mensagens de erro/sucesso do connect-flash para todas as views
  res.locals.error = req.flash('error')[0]; // Pega a primeira mensagem de erro
  res.locals.success = req.flash('success')[0]; // Pega a primeira mensagem de sucesso
  
  next();
});

// === REGISTRO DAS ROTAS (DEPOIS DOS MIDDLEWARES) ===
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/cursos', cursoRoutes);
app.use('/progresso', progressoRoutes);
// app.use('/perfil', perfilRoutes); // Descomente quando criar

// (As rotas aninhadas são registradas dentro de cursoRoutes.js, não aqui)

// --- ROTAS PRINCIPAIS ---
app.get('/', pageController.renderLandingPage); 
app.get('/inicio', eAutenticado, pageController.renderInicio); // Protegida pelo middleware

// === HANDLER 404 (ÚLTIMO middleware de rota) ===
app.use((req, res, next) => {
    if (res.locals.usuario) {
        res.status(404).render('404_app'); 
    } else {
        res.status(404).render('404_auth');
    }
});

// === INICIALIZAÇÃO DO SERVIDOR ===
app.listen(PORT, () => {
  console.log(`Servidor LearnFlow a rodar em http://localhost:${PORT}`);
});