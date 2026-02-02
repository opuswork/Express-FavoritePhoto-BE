import { prisma } from "../db/prisma.js";

function toPurchaseRow(p) {
  if (!p) return null;
  return {
    purchase_id: p.id,
    buyer_user_id: p.buyerUserId,
    listing_id: p.listingId,
    quantity: p.quantity,
    unit_price: p.unitPrice,
    total_price: p.totalPrice,
    reg_date: p.regDate,
    ...(p.listing && {
      seller_user_id: p.listing.sellerUserId,
      user_card_id: p.listing.userCardId,
      photo_card_id: p.listing.userCard?.photoCardId,
      creator_user_id: p.listing.userCard?.photoCard?.creatorUserId,
      name: p.listing.userCard?.photoCard?.name,
      image_url: p.listing.userCard?.photoCard?.imageUrl,
      genre: p.listing.userCard?.photoCard?.genre,
      grade: p.listing.userCard?.photoCard?.grade,
    }),
  };
}

async function createPurchase(
  { buyerUserId, listingId, quantity, unitPrice, totalPrice },
  tx = null
) {
  const client = tx ?? prisma;
  const purchase = await client.purchase.create({
    data: {
      buyerUserId: Number(buyerUserId),
      listingId: Number(listingId),
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      totalPrice: Number(totalPrice),
    },
  });
  return purchase.id;
}

async function getPurchaseById(purchaseId) {
  const p = await prisma.purchase.findUnique({
    where: { id: Number(purchaseId) },
    include: {
      listing: {
        include: {
          userCard: { include: { photoCard: true } },
        },
      },
    },
  });
  if (!p) return null;
  const row = toPurchaseRow(p);
  if (p.listing?.userCard?.photoCard) {
    const pc = p.listing.userCard.photoCard;
    row.photo_card_id = pc.id;
    row.creator_user_id = pc.creatorUserId;
    row.name = pc.name;
    row.image_url = pc.imageUrl;
    row.genre = pc.genre;
    row.grade = pc.grade;
  }
  row.user_id = p.listing?.sellerUserId;
  row.user_card_id = p.listing?.userCardId;
  return row;
}

async function getPurchasesByBuyerId(buyerUserId, { limit = 50, offset = 0 } = {}) {
  const rows = await prisma.purchase.findMany({
    where: { buyerUserId: Number(buyerUserId) },
    orderBy: { regDate: "desc" },
    take: limit,
    skip: offset,
    include: {
      listing: {
        include: {
          userCard: { include: { photoCard: true } },
        },
      },
    },
  });
  return rows.map((p) => {
    const row = toPurchaseRow(p);
    if (p.listing?.userCard?.photoCard) {
      const pc = p.listing.userCard.photoCard;
      row.photo_card_id = pc.id;
      row.creator_user_id = pc.creatorUserId;
      row.name = pc.name;
      row.image_url = pc.imageUrl;
      row.genre = pc.genre;
      row.grade = pc.grade;
    }
    row.seller_user_id = p.listing?.sellerUserId;
    row.user_card_id = p.listing?.userCardId;
    return row;
  });
}

async function getPurchasesBySellerId(sellerUserId, { limit = 50, offset = 0 } = {}) {
  const rows = await prisma.purchase.findMany({
    where: { listing: { sellerUserId: Number(sellerUserId) } },
    orderBy: { regDate: "desc" },
    take: limit,
    skip: offset,
    include: {
      listing: {
        include: {
          userCard: { include: { photoCard: true } },
        },
      },
    },
  });
  return rows.map((p) => {
    const row = toPurchaseRow(p);
    if (p.listing?.userCard?.photoCard) {
      const pc = p.listing.userCard.photoCard;
      row.photo_card_id = pc.id;
      row.creator_user_id = pc.creatorUserId;
      row.name = pc.name;
      row.image_url = pc.imageUrl;
      row.genre = pc.genre;
      row.grade = pc.grade;
    }
    row.seller_user_id = p.listing?.sellerUserId;
    row.user_card_id = p.listing?.userCardId;
    return row;
  });
}

export default {
  createPurchase,
  getPurchaseById,
  getPurchasesByBuyerId,
  getPurchasesBySellerId,
};
