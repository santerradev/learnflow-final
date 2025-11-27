    // file: routes/authRoutes.js
    import { Router } from 'express';
    import passport from 'passport'; // Importa o Passport
    import * as authController from '../controllers/authController.js';
    import { uploadImagem } from '../middleware/uploadMiddleware.js';

    const router = Router();

    // --- Rotas GET (Para mostrar as páginas) ---
    router.get('/login', authController.renderLogin);
    router.get('/cadastro', authController.renderCadastro);

    // --- Rotas POST (Processamento) ---

    // Rota de Cadastro (Sem alterações, Passport não lida com registro)
    router.post('/cadastro', 
        uploadImagem.single('foto_perfil'), 
        authController.processarCadastro
    );

    // Rota de Login (ATUALIZADA PARA PASSPORT)
    // O middleware 'passport.authenticate' faz a verificação usando a estratégia 'local'
    router.post('/login', passport.authenticate('local', {
        successRedirect: '/inicio',         // Para onde ir se o login funcionar
        failureRedirect: '/auth/login', // Para onde ir se falhar
        failureFlash: true                  // Ativa o 'connect-flash' para enviar a mensagem de erro
    }));

    // Rota de Logout (ATUALIZADA)
    // Usamos POST para logout por segurança (evita logout acidental por links)
    router.post('/logout', authController.processarLogout);

    export default router;