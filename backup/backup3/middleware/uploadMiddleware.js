// middleware/uploadMiddleware.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Garantir diretórios
const dirImagens = 'public/uploads/images/';
const dirVideos = 'public/uploads/videos/';

// Storage para imagens
const storageImagens = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dirImagens);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  },
});

// Storage para vídeos
const storageVideos = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dirVideos);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Middleware para imagem única
export const uploadImagem = multer({ storage: storageImagens });

// Middleware para vídeo único
export const uploadVideo = multer({ storage: storageVideos });

// Middleware para aulas (capa + vídeo)
export const uploadAula = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let dest = dirImagens;
      if (file.fieldname === 'video') {
        dest = dirVideos;
      }
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  }),
}).fields([
  { name: 'capa_aula', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]);