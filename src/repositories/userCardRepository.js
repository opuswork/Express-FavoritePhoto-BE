import { prisma } from "../db/prisma.js";

export async function createUserCard({
  ownerId,
  photocardId,
  quantity,
  userId,
}) {
  const finalUserId = ownerId != null ? Number(ownerId) : Number(userId);

  const created = await prisma.userCard.upsert({
    where: {
      userId_photoCardId: {
        userId: finalUserId,
        photoCardId: Number(photocardId),
      },
    },
    create: {
      userId: finalUserId,
      photoCardId: Number(photocardId),
      quantity: Number(quantity),
    },
    update: {
      quantity: { increment: Number(quantity) },
    },
  });
  return created.id;
}

export async function getUserCard(userId, photoCardId) {
  const row = await prisma.userCard.findUnique({
    where: {
      userId_photoCardId: {
        userId: Number(userId),
        photoCardId: Number(photoCardId),
      },
    },
  });
  if (!row) return null;
  return {
    user_card_id: row.id,
    user_id: row.userId,
    photo_card_id: row.photoCardId,
    quantity: row.quantity,
    reg_date: row.regDate,
    upt_date: row.uptDate,
  };
}

export async function findAllByUserId(userId) {
  const rows = await prisma.userCard.findMany({
    where: { userId: Number(userId) },
    orderBy: { regDate: "desc" },
    include: {
      photoCard: true,
    },
  });
  return rows.map((uc) => ({
    user_card_id: uc.id,
    user_id: uc.userId,
    quantity: uc.quantity,
    acquired_date: uc.regDate,
    photo_card_id: uc.photoCard.id,
    name: uc.photoCard.name,
    description: uc.photoCard.description,
    genre: uc.photoCard.genre,
    grade: uc.photoCard.grade,
    min_price: uc.photoCard.minPrice,
    image_url: uc.photoCard.imageUrl,
    creator_user_id: uc.photoCard.creatorUserId,
  }));
}

export async function getTotalQuantityByPhotoCardId(photoCardId) {
  const result = await prisma.userCard.aggregate({
    where: { photoCardId: Number(photoCardId) },
    _sum: { quantity: true },
  });
  return Number(result._sum?.quantity ?? 0);
}

export default {
  createUserCard,
  getUserCard,
  findAllByUserId,
  getTotalQuantityByPhotoCardId,
};
