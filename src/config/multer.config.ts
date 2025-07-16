import multer from "multer"

export const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
    files: 20,
    fields: 1
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'))
    }
  }
}).array('file', 20)


export function multerConfig({ allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'], maxFiles = 20, maxSize = 1024 * 1024 * 5, propName = 'file' }: { allowedMimes?: string[], maxFiles?: number, maxSize?: number, propName?: string }) {
  return multer({
    dest: 'uploads/',
    limits: {
      fileSize: maxSize,
      files: maxFiles,
    },
    fileFilter: (_req, file, cb) => {
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new Error('Invalid file type'))
      }
    }
  }).array(propName, maxFiles)
}
