// file: middleware/uploadMiddleware.js
// Configuração centralizada do Multer para uploads de arquivos

import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Importa o módulo 'fs' para criar pastas

// Função auxiliar para garantir que o diretório de destino exista
const ensureDirectoryExistence = (filePath) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname); // Cria recursivamente
  fs.mkdirSync(dirname);
};

// Define os diretórios de destino
const dirImagens = 'public/uploads/images/';
const dirVideos = 'public/uploads/videos/';

// Garante que os diretórios existam ao iniciar
ensureDirectoryExistence(path.join(dirImagens, 'placeholder.txt')); // Cria a pasta se não existir
ensureDirectoryExistence(path.join(dirVideos, 'placeholder.txt'));  // Cria a pasta se não existir

// Configuração para salvar imagens (fotos de perfil, capas de curso/aula)
const storageImagens = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dirImagens); // Salva na pasta de imagens
  },
  filename: (req, file, cb) => {
    // Gera um nome único: timestamp + extensão original
    cb(null, Date.now() + path.extname(file.originalname)); 
  },
});

// Configuração para salvar vídeos (aulas)
const storageVideos = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dirVideos); // Salva na pasta de vídeos
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Middleware Multer para um único upload de imagem
// Usado no cadastro (foto_perfil) e criação/edição de curso (capa_curso)
export const uploadImagem = multer({ storage: storageImagens });

// Middleware Multer para um único upload de vídeo
// (Pode não ser usado diretamente, veja uploadAula)
export const uploadVideo = multer({ storage: storageVideos });

// Middleware Multer para múltiplos campos de upload (Aulas)
// Espera um campo 'capa_aula' (imagem) e um campo 'video' (vídeo)
export const uploadAula = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let dest = dirImagens; // Padrão é salvar como imagem
      if (file.fieldname === 'video') { // Se o campo for 'video'
        dest = dirVideos; // Muda o destino para a pasta de vídeos
      }
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      // Nome único para ambos os tipos de arquivo
      cb(null, Date.now() + path.extname(file.originalname));
    },
  }),
}).fields([ // Espera múltiplos campos
  { name: 'capa_aula', maxCount: 1 }, // Um arquivo no campo 'capa_aula'
  { name: 'video', maxCount: 1 },     // Um arquivo no campo 'video'
]);