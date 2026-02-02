import { prisma } from "../db/prisma.js";

function listingRow(row) {
  if (!row) return null;
  const l = row.listing ?? row;
  const uc = row.userCard ?? l?.userCard;
  const pc = row.photoCard ?? uc?.photoCard ?? l?.photoCard;
  const seller = row.seller ?? l?.seller;
  return {
    listing_id: l.id,
    user_card_id: l.userCardId,
    seller_user_id: l.sellerUserId,
    sale_type: l.saleType,
    status: l.status,
    quantity: l.quantity,
    price_per_unit: l.pricePerUnit != null ? Number(l.pricePerUnit) : null,
    desired_grade: l.desiredGrade,
    desired_genre: l.desiredGenre,
    desired_desc: l.desiredDesc,
    reg_date: l.regDate,
    upt_date: l.uptDate,
    photo_card_id: pc?.id,
    name: pc?.name,
    description: pc?.description,
    genre: pc?.genre,
    grade: pc?.grade,
    min_price: pc?.minPrice,
    image_url: pc?.imageUrl,
    creator_user_id: pc?.creatorUserId,
    seller_nickname: seller?.nickname ?? null,
  };
}

async function createListing({
  userCardId,
  sellerUserId,
  saleType,
  status,
  quantity,
  pricePerUnit,
  desiredGrade = null,
  desiredGenre = null,
  desiredDesc = null,
}) {
  const listing = await prisma.listing.create({
    data: {
      userCardId: Number(userCardId),
      sellerUserId: Number(sellerUserId),
      saleType,
      status,
      quantity: Number(quantity),
      pricePerUnit: Number(pricePerUnit),
      desiredGrade: desiredGrade ?? null,
      desiredGenre: desiredGenre ?? null,
      desiredDesc: desiredDesc ?? null,
    },
  });
  return listing.id;
}

async function getListingById(listingId) {
  const row = await prisma.listing.findUnique({
    where: { id: Number(listingId) },
    include: {
      userCard: { include: { photoCard: true } },
      seller: { select: { nickname: true } },
    },
  });
  if (!row) return null;
  const pc = row.userCard?.photoCard;
  return listingRow({
    listing: row,
    photoCard: pc,
    seller: row.seller,
    userCard: row.userCard,
  });
}

async function listListings({
  limit,
  cursor,
  sortBy = "reg_date",
  sortOrder = "DESC",
  status = "ACTIVE",
}) {
  const order = sortOrder.toUpperCase() === "ASC" ? "asc" : "desc";
  const orderField = sortBy === "price" ? "pricePerUnit" : "regDate";
  const where = { status };
  const orderBy = [{ [orderField]: order }, { id: "desc" }];
  const cursorClause =
    cursor != null
      ? { cursor: { id: Number(cursor) }, skip: 1 }
      : {};

  const rows = await prisma.listing.findMany({
    where,
    take: limit,
    ...cursorClause,
    orderBy,
    include: {
      userCard: { include: { photoCard: true } },
      seller: { select: { nickname: true } },
    },
  });

  return rows.map((r) =>
    listingRow({
      listing: r,
      photoCard: r.userCard?.photoCard,
      seller: r.seller,
      userCard: r.userCard,
    })
  );
}

async function updateListing(listingId, patch) {
  const data = {};
  if (patch.quantity !== undefined) data.quantity = patch.quantity;
  if (patch.pricePerUnit !== undefined) data.pricePerUnit = patch.pricePerUnit;
  if (patch.status !== undefined) data.status = patch.status;
  if (patch.saleType !== undefined) data.saleType = patch.saleType;
  if (Object.keys(data).length === 0) return 0;

  const result = await prisma.listing.updateMany({
    where: { id: Number(listingId) },
    data,
  });
  return result.count;
}

async function deleteListing(listingId) {
  const result = await prisma.listing.deleteMany({
    where: { id: Number(listingId) },
  });
  return result.count;
}

async function getActiveListingByUserCardId(userCardId) {
  const row = await prisma.listing.findFirst({
    where: {
      userCardId: Number(userCardId),
      status: "ACTIVE",
    },
  });
  if (!row) return null;
  return {
    listing_id: row.id,
    user_card_id: row.userCardId,
    seller_user_id: row.sellerUserId,
    sale_type: row.saleType,
    status: row.status,
    quantity: row.quantity,
    price_per_unit: row.pricePerUnit,
    desired_grade: row.desiredGrade,
    desired_genre: row.desiredGenre,
    desired_desc: row.desiredDesc,
    reg_date: row.regDate,
    upt_date: row.uptDate,
  };
}

async function getUserCardById(userCardId) {
  const row = await prisma.userCard.findUnique({
    where: { id: Number(userCardId) },
    include: { photoCard: true },
  });
  if (!row) return null;
  return {
    user_card_id: row.id,
    user_id: row.userId,
    quantity: row.quantity,
    photo_card_id: row.photoCardId,
    total_supply: row.photoCard?.totalSupply ?? 0,
  };
}

export default {
  createListing,
  getListingById,
  listListings,
  updateListing,
  deleteListing,
  getActiveListingByUserCardId,
  getUserCardById,
};
