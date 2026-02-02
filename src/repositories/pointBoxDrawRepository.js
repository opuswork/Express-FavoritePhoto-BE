import { prisma } from "../db/prisma.js";

async function createPointBoxDraw({ userId, pointHistoryId, earnedPoints }, tx = null) {
  const client = tx ?? prisma;
  const row = await client.pointBoxDraw.create({
    data: {
      userId: Number(userId),
      pointHistoryId: Number(pointHistoryId),
      earnedPoints: Number(earnedPoints),
    },
  });
  return row.id;
}

async function getLastDrawByUserId(userId) {
  const row = await prisma.pointBoxDraw.findFirst({
    where: { userId: Number(userId) },
    orderBy: { regDate: "desc" },
  });
  if (!row) return null;
  return {
    point_box_draw_id: row.id,
    user_id: row.userId,
    point_history_id: row.pointHistoryId,
    earned_points: row.earnedPoints,
    reg_date: row.regDate,
  };
}

async function getLastDrawByUserIdForUpdate(userId, tx) {
  if (!tx) throw new Error("Transaction required for getLastDrawByUserIdForUpdate");
  const row = await tx.pointBoxDraw.findFirst({
    where: { userId: Number(userId) },
    orderBy: { regDate: "desc" },
  });
  if (!row) return null;
  const now = new Date();
  const secondsSinceLastDraw = Math.floor((now - row.regDate) / 1000);
  return {
    point_box_draw_id: row.id,
    user_id: row.userId,
    point_history_id: row.pointHistoryId,
    earned_points: row.earnedPoints,
    reg_date: row.regDate,
    seconds_since_last_draw: secondsSinceLastDraw,
  };
}

async function getDrawHistoryByUserId(userId, { limit = 50, offset = 0 } = {}) {
  const rows = await prisma.pointBoxDraw.findMany({
    where: { userId: Number(userId) },
    orderBy: { regDate: "desc" },
    take: limit,
    skip: offset,
    include: { pointHistory: true },
  });
  return rows.map((r) => ({
    point_box_draw_id: r.id,
    user_id: r.userId,
    point_history_id: r.pointHistoryId,
    earned_points: r.earnedPoints,
    reg_date: r.regDate,
    amount: r.pointHistory?.amount,
    type: r.pointHistory?.type,
  }));
}

async function findAll() {
  const rows = await prisma.pointBoxDraw.findMany({
    orderBy: { regDate: "desc" },
    include: {
      pointHistory: true,
      user: { select: { nickname: true } },
    },
  });
  return rows.map((r) => ({
    point_box_draw_id: r.id,
    user_id: r.userId,
    point_history_id: r.pointHistoryId,
    earned_points: r.earnedPoints,
    reg_date: r.regDate,
    amount: r.pointHistory?.amount,
    type: r.pointHistory?.type,
    nickname: r.user?.nickname,
  }));
}

export default {
  createPointBoxDraw,
  getLastDrawByUserId,
  getLastDrawByUserIdForUpdate,
  getDrawHistoryByUserId,
  findAll,
};
