// file: server.js

import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import passport from 'passport';
import flash from 'express-flash';
import fs from 'fs';

// Importando Rotas
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import cursoRoutes from './routes/cursoRoutes.js';
import progressoRoutes from './routes/progressoRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificacaoRoutes from './routes/notificacaoRoutes.js';

// Importando PageController e Middleware
import * as pageController from './controllers/pageController.js';
import { eAutenticado } from './middleware/authMiddleware.js';
import initializePassport from './config/passport.js';

// Configuração de diretório
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente
dotenv.config();

// Inicialização
const app = express();
const PORT = process.env.PORT || 3000;

// CRIAR DIRETÓRIOS DE UPLOAD SE NÃO EXISTIREM
const uploadDirs = [
    'public/uploads/images',
    'public/uploads/videos',
    'public/uploads/materials'
];

uploadDirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`📁 Diretório criado: ${dir}`);
    }
});

// CONFIGURAÇÃO ESSENCIAL ANTES DAS ROTAS

// 1. Configuração da View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 2. Middlewares Globais de Parsing e Arquivos Estáticos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 3. Configuração da Sessão
app.use(session({
    secret: process.env.SESSION_SECRET || 'um_segredo_muito_forte_altere_isso',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true apenas em produção com HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 dias
    },
}));

// 4. Configuração do Passport
initializePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

// 5. Configuração do Flash
app.use(flash());

// 6. Middleware Global para expor variáveis às views EJS
app.use((req, res, next) => {
    res.locals.usuario = req.user || null;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.activeLink = ''; // Valor padrão
    next();
});

// REGISTRO DAS ROTAS

// Rotas de autenticação
app.use('/auth', authRoutes);

// Rotas de usuário
app.use('/user', userRoutes);

// Rotas de admin
app.use('/admin', adminRoutes);

// Rotas de cursos
app.use('/cursos', cursoRoutes);

// Rotas de progresso
app.use('/progresso', progressoRoutes);

// Rotas de notificações
app.use('/notificacoes', notificacaoRoutes);

// ROTAS PRINCIPAIS (PÁGINAS)

// Rota raiz - redireciona para login ou início
app.get('/', pageController.renderLandingPage);

// Dashboard principal (Início)
app.get('/inicio', eAutenticado, pageController.renderInicio);

// Página "Meus Cursos"
app.get('/meus-cursos', eAutenticado, pageController.renderMeusCursos);

// Página de Atividades (placeholder)
app.get('/atividades', eAutenticado, (req, res) => {
    res.render('plataforma/atividades', {
        activeLink: 'atividades'
    });
});

// Página de Materiais (placeholder)
app.get('/materiais', eAutenticado, (req, res) => {
    res.render('plataforma/materiais', {
        activeLink: 'materiais'
    });
});

// HANDLER 404 (NOT FOUND)
app.use((req, res, next) => {
    if (req.isAuthenticated()) {
        // Usuário autenticado - mostrar 404 da área logada
        res.status(404).render('errors/404', {
            activeLink: '',
            usuario: req.user
        });
    } else {
        // Usuário não autenticado - mostrar 404 pública
        res.status(404).render('errors/404_public', {
            usuario: null
        });
    }
});

// HANDLER DE ERROS GLOBAL
app.use((err, req, res, next) => {
    console.error('❌ Erro não tratado:', err.stack);
    
    // Log detalhado em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
        console.error('Erro detalhado:', err);
    }
    
    // Resposta ao cliente
    if (req.isAuthenticated()) {
        res.status(500).render('errors/500', {
            activeLink: '',
            usuario: req.user,
            error: process.env.NODE_ENV === 'development' ? err : {}
        });
    } else {
        res.status(500).json({ 
            error: 'Erro interno do servidor.',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// INICIALIZAÇÃO DO SERVIDOR
app.listen(PORT, () => {
    console.log(`🚀 Servidor LearnFlow rodando!`);
    console.log(`🚀 URL: http://localhost:${PORT}`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

export default app;
