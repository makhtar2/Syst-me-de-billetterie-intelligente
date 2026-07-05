import multer from 'multer';

// Stockage en mémoire : le buffer est parsé en flux, aucun fichier temporaire sur disque
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isCsv =
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.originalname.toLowerCase().endsWith('.csv');
  if (isCsv) return cb(null, true);
  return cb(new Error('Seuls les fichiers CSV sont acceptés'));
};

export const uploadCsv = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
}).single('file');
