import bcrypt from "bcryptjs";
import userRepository from "../repositories/userRepository.js";
import { prisma } from "../db/prisma.js";

const BCRYPT_ROUNDS = 10;

async function createUser(userData) {
  const { email, nickname, password } = userData;

  // 필수 필드 검증
  if (!email || !nickname) {
    const error = new Error("이메일과 닉네임은 필수입니다.");
    error.code = 400;
    throw error;
  }

  // 이메일 중복 확인
  const existingUserByEmail = await userRepository.findByEmail(email);
  if (existingUserByEmail) {
    const error = new Error("이미 사용 중인 이메일입니다.");
    error.code = 409;
    throw error;
  }

  // 닉네임 중복 확인
  const existingUserByNickname = await userRepository.findByNickname(nickname);
  if (existingUserByNickname) {
    const error = new Error("이미 사용 중인 닉네임입니다.");
    error.code = 409;
    throw error;
  }

  // 비밀번호 bcrypt 해싱
  const password_hash = password
    ? await bcrypt.hash(password, BCRYPT_ROUNDS)
    : null;

  // 유저 생성 (이메일 인증 완료 후 가입이므로 emailVerified: true)
  const newUser = await userRepository.save({
    email,
    nickname,
    password_hash,
    emailVerified: true,
  });

  // 비밀번호 해시는 응답에서 제외
  delete newUser.password_hash;

  return newUser;
}

async function getUserById(userId) {
  if (!userId) {
    const error = new Error("유저 ID가 필요합니다.");
    error.code = 400;
    throw error;
  }

  const user = await userRepository.findById(userId);

  if (!user) {
    const error = new Error("유저를 찾을 수 없습니다.");
    error.code = 404;
    throw error;
  }

  // 클라이언트에 비밀번호 변경 가능 여부만 전달 (Google 로그인 등은 password_hash가 null)
  user.hasPassword = !!user.password_hash;
  delete user.password_hash;

  return user;
}

/**
 * 로그인: 이메일로 유저 조회 후 비밀번호 검증, getUserById로 정제된 유저 반환
 */
async function login(email, password) {
  if (!email || !password) {
    const error = new Error("이메일과 비밀번호를 입력해 주세요.");
    error.status = 400;
    throw error;
  }

  const userByEmail = await userRepository.findByEmail(email);
  if (!userByEmail) {
    const error = new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    error.status = 401;
    throw error;
  }

  // 비밀번호 검증 (bcrypt.compare)
  if (!userByEmail.password_hash || !(await bcrypt.compare(password, userByEmail.password_hash))) {
    const err = new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    err.status = 401;
    throw err;
  }

  return getUserById(userByEmail.id);
}

/**
 * Google OAuth: find or create user by email/name, return sanitized user
 */
async function loginWithGoogle(profile) {
  const { id: providerId, email, name } = profile;
  if (!email) {
    const err = new Error("Google 계정에서 이메일을 가져올 수 없습니다.");
    err.status = 400;
    throw err;
  }
  const user = await userRepository.createOrUpdate("google", providerId, email, name ?? email.split("@")[0]);
  const sanitized = await getUserById(user.id);
  return sanitized;
}

async function getAllUsers() {
  const users = await userRepository.findAll();
  
  // 모든 유저의 비밀번호 해시 제외
  return users.map(user => {
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
}

/** Validate new password: 8+ chars, letter, number, special. Returns error message or null. */
function validateNewPassword(value) {
  if (!value || typeof value !== "string") return "비밀번호를 입력해 주세요.";
  const s = value;
  if (s.length < 8 || s.length > 128) return "비밀번호는 8자 이상 128자 이하여야 합니다.";
  if (!/[a-zA-Z]/.test(s)) return "비밀번호에 영문자를 포함해 주세요.";
  if (!/[0-9]/.test(s)) return "비밀번호에 숫자를 포함해 주세요.";
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(s)) return "비밀번호에 특수문자를 포함해 주세요.";
  return null;
}

/**
 * Change password: verify current with bcrypt, validate new, ensure new !== current, hash and update.
 * Caller should clear session/cookie after success so user must re-login.
 */
async function changePassword(userId, currentPassword, newPassword) {
  if (!userId) {
    const err = new Error("인증이 필요합니다.");
    err.status = 401;
    throw err;
  }
  if (!currentPassword || typeof currentPassword !== "string") {
    const err = new Error("현재 비밀번호를 입력해 주세요.");
    err.status = 400;
    throw err;
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    const err = new Error("유저를 찾을 수 없습니다.");
    err.status = 404;
    throw err;
  }
  if (!user.password_hash) {
    const err = new Error("비밀번호로 가입한 계정만 비밀번호를 변경할 수 있습니다.");
    err.status = 400;
    throw err;
  }

  const match = await bcrypt.compare(currentPassword, user.password_hash);
  if (!match) {
    const err = new Error("현재 비밀번호가 올바르지 않습니다.");
    err.status = 401;
    throw err;
  }

  const validationErr = validateNewPassword(newPassword);
  if (validationErr) {
    const err = new Error(validationErr);
    err.status = 400;
    throw err;
  }

  if (currentPassword === newPassword) {
    const err = new Error("새 비밀번호는 현재 비밀번호와 달라야 합니다.");
    err.status = 400;
    throw err;
  }

  const password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await userRepository.update(userId, { password_hash });
  return { ok: true };
}

/**
 * Confirm email change: verify code for newEmail, then update user's email and delete verification.
 */
async function confirmEmailChange(userId, newEmail, code) {
  const email = typeof newEmail === "string" ? newEmail.trim() : "";
  const codeStr = typeof code === "string" ? String(code).trim() : "";

  if (!userId) {
    const err = new Error("인증이 필요합니다.");
    err.status = 401;
    throw err;
  }
  if (!email || !email.includes("@")) {
    const err = new Error("올바른 새 이메일을 입력해 주세요.");
    err.status = 400;
    throw err;
  }
  if (!codeStr || codeStr.length !== 6) {
    const err = new Error("인증코드 6자리를 입력해 주세요.");
    err.status = 400;
    throw err;
  }

  const verification = await prisma.emailVerification.findUnique({
    where: { email },
  });
  if (!verification) {
    const err = new Error("인증 요청 내역을 찾을 수 없습니다. 새 이메일로 인증코드를 먼저 요청해 주세요.");
    err.status = 404;
    throw err;
  }
  if (new Date() > verification.expiresAt) {
    const err = new Error("인증번호가 만료되었습니다. 다시 인증코드를 요청해 주세요.");
    err.status = 410;
    throw err;
  }
  if (verification.code !== codeStr) {
    const err = new Error("인증번호가 일치하지 않습니다.");
    err.status = 400;
    throw err;
  }

  const existingUser = await userRepository.findByEmail(email);
  if (existingUser && existingUser.id !== userId) {
    const err = new Error("이미 사용 중인 이메일입니다.");
    err.status = 409;
    throw err;
  }

  await userRepository.update(userId, { email });
  await prisma.emailVerification.delete({
    where: { email },
  });
  return { ok: true };
}

export default {
  createUser,
  getUserById,
  getAllUsers,
  login,
  loginWithGoogle,
  changePassword,
  confirmEmailChange,
  validateNewPassword,
};
