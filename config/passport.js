// file: config/passport.js
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import prisma from './prisma.js'; // Importe sua instância do Prisma

// Exporta uma função que configura o passport
export default function(passport) {
  
  // 1. DEFINIÇÃO DA ESTRATÉGIA LOCAL
  // Define como o Passport deve tentar autenticar usando 'email' e 'senha'
  passport.use(new LocalStrategy(
    {
      usernameField: 'email', // O campo 'username' no formulário é o 'email'
      passwordField: 'senha', // O campo 'password' no formulário é a 'senha'
      passReqToCallback: true // Permite passar 'req' para o callback (para flash messages)
    },
    async (req, email, senha, done) => {
      // Lógica de verificação (movida do authController)
      try {
        const usuario = await prisma.usuario.findUnique({ where: { email } });

        // Usuário não encontrado
        if (!usuario) {
          // done(erro, usuario, mensagem_flash)
          return done(null, false, req.flash('error', 'Usuário não encontrado.'));
        }

        // Usuário inativo (se status existir)
        if (usuario.status === 'inativo') {
            return done(null, false, req.flash('error', 'Esta conta está inativa.'));
        }

        // Comparar senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
          return done(null, false, req.flash('error', 'Senha incorreta.'));
        }

        // Sucesso! Retorna o usuário
        return done(null, usuario);

      } catch (error) {
        return done(error); // Erro do servidor (ex: banco de dados caiu)
      }
    }
  ));

  // 2. SERIALIZAÇÃO (O que salvar na Sessão)
  // Chamado APÓS o login bem-sucedido.
  // Salva APENAS o ID do usuário na sessão.
  passport.serializeUser((usuario, done) => {
    done(null, usuario.id);
  });

  // 3. DESSERIALIZAÇÃO (O que ler da Sessão)
  // Chamado em CADA requisição subsequente.
  // Pega o ID da sessão, busca o usuário completo no banco e anexa em 'req.user'.
  passport.deserializeUser(async (id, done) => {
    try {
      const usuario = await prisma.usuario.findUnique({ where: { id } });
      done(null, usuario); // Anexa o usuário como req.user
    } catch (error) {
      done(error, null);
    }
  });
}