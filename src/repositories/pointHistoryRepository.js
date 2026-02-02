import { prisma } from "../db/prisma.js";

async function createPointHistory(
  { userId, amount, type, refEntityType, refEntityId },
  tx = null
) {
  const client = tx ?? prisma;
  const row = await client.pointHistory.create({
    data: {
      userId: Number(userId),
      amount: Number(amount),
      type,
      refEntityType: refEntityType ?? null,
      refEntityId: refEntityId ?? null,
    },
  });
  return row.id;
}

async function getPointHistoryByUserId(userId, { limit = 50, offset = 0 } = {}) {
  const rows = await prisma.pointHistory.findMany({
    where: { userId: Number(userId) },
    orderBy: { regDate: "desc" },
    take: limit,
    skip: offset,
  });
  return rows.map((r) => ({
    point_history_id: r.id,
    user_id: r.userId,
    amount: r.amount,
    type: r.type,
    ref_entity_type: r.refEntityType,
    ref_entity_id: r.refEntityId,
    reg_date: r.regDate,
  }));
}

async function getPointHistoryById(pointHistoryId) {
  const row = await prisma.pointHistory.findUnique({
    where: { id: Number(pointHistoryId) },
  });
  if (!row) return null;
  return {
    point_history_id: row.id,
    user_id: row.userId,
    amount: row.amount,
    type: row.type,
    ref_entity_type: row.refEntityType,
    ref_entity_id: row.refEntityId,
    reg_date: row.regDate,
  };
}

export default {
  createPointHistory,
  getPointHistoryByUserId,
  getPointHistoryById,
};
