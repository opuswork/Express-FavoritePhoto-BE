import crypto from "crypto";
import fs from "fs";
import path from "path";
import multer from "multer";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

function extFromMime(mime) {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return null;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // userId OR creatorUserId (to support both standalone upload and create-with-upload)
    const id = req.body?.userId || req.body?.creatorUserId;
    const userId = Number(id);
    // If we can't determine userId here, we might either error or save to a temp dir.
    // For now, assuming FE sends fields in order or we default to a safeguard (but path depends on ID).
    // Note: multer processes fields in order. 'creatorUserId' MUST be sent before 'file'.

    if (!userId) {
      // Fail safe: if no user ID found, maybe error? 
      // But cb(err) might capture it. 
      // Let's assume valid ID or handle generic path (bad practice for this specific structure).
      // We'll trust the validation step later to catch it, but here we need a path.
      // Let's error if missing.
      return cb(new Error("MISSING_USER_ID_FOR_UPLOAD"));
    }

    const baseDir = path.join(process.cwd(), "public", "users", String(userId), "photocards");
    fs.mkdirSync(baseDir, { recursive: true });
    cb(null, baseDir);
  },
  filename: (req, file, cb) => {
    const ext = extFromMime(file.mimetype) || "bin";
    cb(null, `${crypto.randomUUID()}.${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    const err = new Error("UNSUPPORTED_FILE_TYPE");
    err.status = 400;
    err.meta = { allowed: Array.from(ALLOWED_MIME) };
    return cb(err, false);
  }
  return cb(null, true);
}

export const photocardImageUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("file");

// Alias or specific config if needed, but the storage logic above now handles both keys.
export const photocardCreateUpload = photocardImageUpload;

export async function uploadPhotocardImage(req, res, next) {
  try {
    const userId = Number(req.body?.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      const err = new Error("VALIDATION_ERROR");
      err.status = 400;
      err.meta = { field: "userId", rule: "must be a positive integer" };
      throw err;
    }

    if (!req.file?.filename) {
      const err = new Error("VALIDATION_ERROR");
      err.status = 400;
      err.meta = { required: ["file"], note: "multipart field name must be 'file'" };
      throw err;
    }

    // DB에 저장/프론트 표시용: 서버 정적 경로
    const imageUrl = `/public/users/${userId}/photocards/${req.file.filename}`;
    return res.json({ ok: true, data: { imageUrl } });
  } catch (err) {
    return next(err);
  }
}
