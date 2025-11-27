// file: server.js
import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

// Importando Rotas
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import cursoRoutes from './routes/cursoRoutes.js';
import progressoRoutes from './routes/progressoRoutes.js';

// Importando PageController e Middleware
import * as pageController from './controllers/pageController.js';
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
// GARANTIR QUE express.static está aqui, ANTES das rotas
app.use(express.static(path.join(__dirname, 'public'))); 

// 3. Configuração da Sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_key', // Adiciona um fallback
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }, 
}));

// 4. Middleware Global para expor 'usuario' às views EJS
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario;
  next();
});

// === REGISTRO DAS ROTAS (DEPOIS DOS MIDDLEWARES ACIMA) ===
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/cursos', cursoRoutes);
app.use('/progresso', progressoRoutes);

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