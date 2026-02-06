import { prisma } from "../db/prisma.js";

/** Map Prisma User to legacy row shape (id, email, nickname, password_hash, points, reg_date, upt_date, emailVerified) */
function toRow(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    password_hash: user.passwordHash,
    points: user.points,
    reg_date: user.regDate,
    upt_date: user.uptDate,
    emailVerified: user.emailVerified,
  };
}

async function findById(id) {
  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
  });
  return toRow(user);
}

async function findByEmail(email) {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  return toRow(user);
}

async function findByNickname(nickname) {
  const user = await prisma.user.findFirst({
    where: { nickname },
  });
  return toRow(user);
}

async function save(user) {
  const { email, nickname, password_hash, emailVerified } = user;
  const created = await prisma.user.create({
    data: {
      email,
      nickname,
      passwordHash: password_hash ?? null,
      emailVerified: emailVerified ?? false,
    },
  });
  return toRow(created);
}

async function update(id, data) {
  const allowed = ["email", "nickname", "password_hash"];
  const keys = Object.keys(data).filter((k) => allowed.includes(k));
  if (keys.length === 0) return findById(id);

  const updateData = {};
  if (data.email !== undefined) updateData.email = data.email;
  if (data.nickname !== undefined) updateData.nickname = data.nickname;
  if (data.password_hash !== undefined) updateData.passwordHash = data.password_hash;

  const updated = await prisma.user.update({
    where: { id: Number(id) },
    data: updateData,
  });
  return toRow(updated);
}

async function createOrUpdate(provider, providerId, email, name) {
  const existing = await findByEmail(email);
  if (existing) {
    return update(existing.id, { email, nickname: name ?? existing.nickname });
  }
  return save({
    email,
    nickname: name ?? email.split("@")[0],
    password_hash: null,
  });
}

async function findAll() {
  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
  });
  return users.map(toRow);
}

export default {
  findById,
  findByEmail,
  findByNickname,
  save,
  update,
  createOrUpdate,
  findAll,
};
