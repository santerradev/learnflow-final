// file: middleware/uploadMiddleware.js
// Configuração centralizada do Multer para uploads de arquivos

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Função auxiliar para garantir que o diretório exista
const ensureDirectoryExistence = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// Define os diretórios de destino
const dirImagens = 'public/uploads/images/';
const dirVideos = 'public/uploads/videos/';
const dirMateriais = 'public/uploads/materials/';

// Garante que os diretórios existam ao iniciar
ensureDirectoryExistence(dirImagens);
ensureDirectoryExistence(dirVideos);
ensureDirectoryExistence(dirMateriais);

// Filtro de tipos de arquivo para imagens
const imageFileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    }
    cb(new Error('Apenas arquivos de imagem são permitidos (jpeg, jpg, png, gif, webp).'));
};

// Filtro de tipos de arquivo para vídeos
const videoFileFilter = (req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|wmv|mkv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (extname) {
        return cb(null, true);
    }
    cb(new Error('Apenas arquivos de vídeo são permitidos (mp4, avi, mov, wmv, mkv, webm).'));
};

// Filtro de tipos de arquivo para materiais
const materialFileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.zip', '.rar', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
        return cb(null, true);
    }
    cb(new Error('Tipo de arquivo não permitido. Permitidos: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, ZIP, RAR, TXT.'));
};

// Configuração para salvar imagens (fotos de perfil, capas de curso/aula)
const storageImagens = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, dirImagens);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

// Configuração para salvar vídeos (aulas)
const storageVideos = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, dirVideos);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

// Configuração para salvar materiais
const storageMateriais = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, dirMateriais);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

 
// EXPORTS - Middlewares de Upload

// Middleware Multer para upload de imagem única
export const uploadImagem = multer({
    storage: storageImagens,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: imageFileFilter
});

// Middleware Multer para upload de vídeo único
export const uploadVideo = multer({
    storage: storageVideos,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
    fileFilter: videoFileFilter
});

// Middleware Multer para upload de material único
export const uploadMaterial = multer({
    storage: storageMateriais,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: materialFileFilter
});

// Middleware Multer para múltiplos campos de upload (Aulas)
// Espera um campo 'capa_aula' (imagem) e um campo 'video' (vídeo)
export const uploadAula = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            if (file.fieldname === 'video') {
                cb(null, dirVideos);
            } else {
                cb(null, dirImagens);
            }
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        },
    }),
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB para vídeos
    }
}).fields([
    { name: 'capa_aula', maxCount: 1 },
    { name: 'video', maxCount: 1 },
]);