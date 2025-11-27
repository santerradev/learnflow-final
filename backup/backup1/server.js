// file: server.js
import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import passport from 'passport'; // ADICIONADO: Importa o Passport
import flash from 'express-flash'; // ADICIONADO: Importa o connect-flash

// Importando Rotas
import authRoutes from './routes/authRoutes.js'; 
import adminRoutes from './routes/adminRoutes.js'; 
import cursoRoutes from './routes/cursoRoutes.js';
import progressoRoutes from './routes/progressoRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Importando PageController e Middleware
import * as pageController from './controllers/pageController.js'; 
import { eAutenticado } from './middleware/authMiddleware.js';
// ADICIONADO: Importa a configuração do Passport
import initializePassport from './config/passport.js'; // (Baseado no nome do arquivo 'passport.js' )

// Configuração de diretório
const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename); 

// Carrega variáveis de ambiente
dotenv.config(); 

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

// 3. Configuração da Sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'um_segredo_muito_forte',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, 
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 
  },
}));

// ADICIONADO: Configuração do Passport (DEVE vir DEPOIS do session)
initializePassport(passport); // 
app.use(passport.initialize());
app.use(passport.session()); // 

// ADICIONADO: Configuração do Flash (para mensagens de erro/sucesso)
app.use(flash());

// 4. Middleware Global para expor 'usuario' e 'flash' às views EJS
app.use((req, res, next) => {
  // CORREÇÃO: Usa req.user (do Passport) em vez de req.session.usuario
  res.locals.usuario = req.user || null;
  // Expõe as mensagens flash para o EJS
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// === REGISTRO DAS ROTAS (DEPOIS DOS MIDDLEWARES ACIMA) ===
app.use('/auth', authRoutes); 
app.use('/admin', adminRoutes); 
app.use('/cursos', cursoRoutes); 
app.use('/progresso', progressoRoutes); 
app.use('/user', userRoutes); 

// --- ROTAS PRINCIPAIS ---
app.get('/', pageController.renderLandingPage); 
app.get('/inicio', eAutenticado, pageController.renderInicio); 

// === HANDLER 404 (ÚLTIMO middleware de rota) ===
app.use((req, res, next) => {
  if (res.locals.usuario) {
    res.status(404).render('404_app');
  } else {
    res.status(404).render('404_auth');
  }
}); 

// --- Inicialização do Servidor ---
app.listen(PORT, () => {
  console.log(`Servidor LearnFlow a rodar em http://localhost:${PORT}`);
}); 