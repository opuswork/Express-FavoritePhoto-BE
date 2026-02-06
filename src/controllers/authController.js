// src/controllers/authController.js
import { sendVerificationEmail } from '../services/emailService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const requestVerification = async (req, res) => {
  const raw = req.body?.email;
  const email = typeof raw === "string" ? raw.trim() : "";

  if (!email) {
    return res.status(400).json({ ok: false, message: "이메일이 필요합니다." });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60000); // 5분 후 만료

  try {
    await prisma.emailVerification.upsert({
      where: { email },
      update: { code, expiresAt },
      create: { email, code, expiresAt },
    });

    // 3. Send via Resend
    await sendVerificationEmail(email, code);

    res.status(200).json({ ok: true, message: "Verification code sent!" });
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ ok: false, message: "서버 오류가 발생했습니다." });
  }
};



export const verifyCode = async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";

  if (!email || !code) {
    return res.status(400).json({ ok: false, message: "이메일과 인증번호를 모두 입력해주세요." });
  }

  try {
    const verification = await prisma.emailVerification.findUnique({
      where: { email },
    });

    if (!verification) {
      return res.status(404).json({ ok: false, message: "인증 요청 내역을 찾을 수 없습니다." });
    }
    if (new Date() > verification.expiresAt) {
      return res.status(410).json({ ok: false, message: "인증번호가 만료되었습니다. 다시 요청해주세요." });
    }
    if (verification.code !== code) {
      return res.status(400).json({ ok: false, message: "인증번호가 일치하지 않습니다." });
    }

    await prisma.emailVerification.delete({
      where: { email },
    });

    res.status(200).json({ ok: true, message: "이메일 인증에 성공했습니다!" });
  } catch (error) {
    console.error("Verify Code Error:", error);
    res.status(500).json({ ok: false, message: "인증 처리 중 오류가 발생했습니다." });
  }
};