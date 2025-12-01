import multer from "multer"

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/gif", "application/pdf", "image/webp", "image/jpg", "image/avif"]

export const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 1024 * 1024 * 10, // 13
    files: 20
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Invalid file type"))
    }
  }
}).array("file", 20)

export function multerConfig({
  allowedMimes = ALLOWED_MIMES,
  maxFiles = 20,
  maxSize = 1024 * 1024 * 10,
  propName = "file"
}: {
  allowedMimes?: string[]
  maxFiles?: number
  maxSize?: number
  propName?: string
}) {
  return multer({
    dest: "uploads/",
    limits: {
      fileSize: maxSize,
      files: maxFiles
    },
    fileFilter: (_req, file, cb) => {
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new Error("Invalid file type"))
      }
    }
  }).array(propName, maxFiles)
}
