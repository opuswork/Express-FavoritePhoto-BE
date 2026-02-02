import { prisma } from "../db/prisma.js";

async function countMonthlyByCreatorUserId(creatorUserId, from, to) {
  const result = await prisma.photoCard.count({
    where: {
      creatorUserId: Number(creatorUserId),
      regDate: {
        gte: from,
        lt: to,
      },
    },
  });
  return result;
}

async function createPhotoCard({
  creatorUserId,
  name,
  description,
  genre,
  grade,
  minPrice,
  totalSupply,
  imageUrl,
}) {
  const card = await prisma.photoCard.create({
    data: {
      creatorUserId: Number(creatorUserId),
      name,
      description: description ?? null,
      genre: genre ?? null,
      grade: grade ?? null,
      minPrice: minPrice ?? 0,
      totalSupply: Number(totalSupply),
      imageUrl: imageUrl ?? null,
    },
  });
  return card.id;
}

async function listPhotoCards({ limit, cursor }) {
  const where = cursor != null ? { id: { lt: Number(cursor) } } : {};
  const rows = await prisma.photoCard.findMany({
    where,
    orderBy: { id: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    photo_card_id: r.id,
    creator_user_id: r.creatorUserId,
    name: r.name,
    description: r.description,
    genre: r.genre,
    grade: r.grade,
    min_price: r.minPrice,
    total_supply: r.totalSupply,
    image_url: r.imageUrl,
    reg_date: r.regDate,
    upt_date: r.uptDate,
  }));
}

async function getPhotoCardById(photoCardId) {
  const card = await prisma.photoCard.findUnique({
    where: { id: Number(photoCardId) },
  });
  if (!card) return null;
  return {
    photo_card_id: card.id,
    creator_user_id: card.creatorUserId,
    name: card.name,
    description: card.description,
    genre: card.genre,
    grade: card.grade,
    min_price: card.minPrice,
    total_supply: card.totalSupply,
    image_url: card.imageUrl,
    reg_date: card.regDate,
    upt_date: card.uptDate,
  };
}

async function updatePhotoCardById(photoCardId, patch) {
  const data = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.description !== undefined) data.description = patch.description;
  if (patch.genre !== undefined) data.genre = patch.genre;
  if (patch.grade !== undefined) data.grade = patch.grade;
  if (patch.minPrice !== undefined) data.minPrice = patch.minPrice;
  if (patch.totalSupply !== undefined) data.totalSupply = patch.totalSupply;
  if (patch.imageUrl !== undefined) data.imageUrl = patch.imageUrl;
  if (Object.keys(data).length === 0) return 0;

  const result = await prisma.photoCard.updateMany({
    where: { id: Number(photoCardId) },
    data,
  });
  return result.count;
}

async function findDuplicatePhotoCard({ name, description, genre, grade, minPrice, imageUrl }) {
  const card = await prisma.photoCard.findFirst({
    where: {
      name,
      description: description ?? null,
      genre: genre ?? null,
      grade: grade ?? null,
      minPrice: minPrice ?? 0,
      imageUrl: imageUrl ?? null,
    },
    select: { id: true, totalSupply: true },
  });
  if (!card) return null;
  return { photo_card_id: card.id, total_supply: card.totalSupply };
}

async function incrementTotalSupply(photoCardId, increment = 1) {
  const count = await prisma.$executeRaw`
    UPDATE photo_card
    SET total_supply = total_supply + ${increment}, upt_date = NOW()
    WHERE id = ${Number(photoCardId)}
  `;
  return typeof count === "number" ? count : 1;
}

async function updateTotalSupply(photoCardId, totalSupply) {
  const result = await prisma.photoCard.updateMany({
    where: { id: Number(photoCardId) },
    data: { totalSupply: Number(totalSupply) },
  });
  return result.count;
}

// Legacy createPhotocard (card_name, card_type, description, owner_id) - minimal PhotoCard for old flow
async function createPhotocard({ card_name, card_type, description, owner_id }) {
  const creatorUserId = owner_id ? Number(owner_id) : null;
  if (creatorUserId == null) throw new Error("owner_id required for createPhotocard");
  const card = await prisma.photoCard.create({
    data: {
      creatorUserId,
      name: card_name ?? "Untitled",
      description: description ?? null,
      genre: card_type ?? null,
    },
  });
  return { id: card.id };
}

export default {
  countMonthlyByCreatorUserId,
  createPhotoCard,
  listPhotoCards,
  getPhotoCardById,
  updatePhotoCardById,
  createPhotocard,
  findDuplicatePhotoCard,
  incrementTotalSupply,
  updateTotalSupply,
};
