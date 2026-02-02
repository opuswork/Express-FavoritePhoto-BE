import { prisma } from "../db/prisma.js";
import purchaseRepo from "../repositories/purchaseRepository.js";
import pointHistoryRepo from "../repositories/pointHistoryRepository.js";

async function purchaseCard(buyerUserId, listingId, quantity) {
  return prisma.$transaction(async (tx) => {
    const listing = await tx.listing.findUnique({
      where: { id: Number(listingId) },
      include: {
        userCard: { include: { photoCard: true } },
      },
    });

    if (!listing) {
      const e = new Error("리스팅을 찾을 수 없습니다.");
      e.status = 404;
      throw e;
    }
    if (listing.status !== "ACTIVE") {
      const e = new Error("판매 중인 리스팅이 아닙니다.");
      e.status = 400;
      throw e;
    }
    const saleType = (listing.saleType || "").toUpperCase();
    if (saleType !== "SELL" && saleType !== "SELL_OR_EXCHANGE") {
      const e = new Error("구매할 수 없는 리스팅입니다.");
      e.status = 400;
      throw e;
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      const e = new Error("구매 수량은 1 이상이어야 합니다.");
      e.status = 400;
      throw e;
    }
    if (qty > listing.quantity) {
      const e = new Error(`구매 가능 수량 초과 (가능: ${listing.quantity})`);
      e.status = 400;
      throw e;
    }

    const unitPrice = Number(listing.pricePerUnit);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      const e = new Error("가격 정보가 올바르지 않습니다.");
      e.status = 400;
      throw e;
    }
    const totalPrice = qty * unitPrice;
    const sellerUserId = listing.sellerUserId;
    const userCardId = listing.userCardId;
    const photoCardId = listing.userCard?.photoCardId;

    const buyer = await tx.user.findUnique({
      where: { id: Number(buyerUserId) },
      select: { points: true },
    });
    if (!buyer) {
      const e = new Error("구매자를 찾을 수 없습니다.");
      e.status = 404;
      throw e;
    }
    const buyerPoints = Number(buyer.points) ?? 0;
    if (buyerPoints <= 0) {
      const e = new Error("포인트가 없어 구매할 수 없습니다.");
      e.status = 400;
      throw e;
    }
    if (buyerPoints < totalPrice) {
      const e = new Error(`포인트 부족 (필요: ${totalPrice}, 보유: ${buyerPoints})`);
      e.status = 400;
      throw e;
    }

    const buyerUpdated = await tx.user.updateMany({
      where: { id: Number(buyerUserId), points: { gte: totalPrice } },
      data: { points: { decrement: totalPrice } },
    });
    if (buyerUpdated.count === 0) {
      const e = new Error("포인트가 부족하여 구매할 수 없습니다.");
      e.status = 400;
      throw e;
    }

    await tx.user.update({
      where: { id: sellerUserId },
      data: { points: { increment: totalPrice } },
    });

    const buyPhId = await pointHistoryRepo.createPointHistory(
      {
        userId: buyerUserId,
        amount: -totalPrice,
        type: "PURCHASE",
        refEntityType: "PURCHASE",
        refEntityId: null,
      },
      tx
    );
    const sellPhId = await pointHistoryRepo.createPointHistory(
      {
        userId: sellerUserId,
        amount: totalPrice,
        type: "SELL",
        refEntityType: "PURCHASE",
        refEntityId: null,
      },
      tx
    );

    await tx.userCard.update({
      where: { id: userCardId },
      data: { quantity: { decrement: qty } },
    });

    await tx.userCard.upsert({
      where: {
        userId_photoCardId: {
          userId: Number(buyerUserId),
          photoCardId,
        },
      },
      create: {
        userId: Number(buyerUserId),
        photoCardId,
        quantity: qty,
      },
      update: { quantity: { increment: qty } },
    });

    const newQty = listing.quantity - qty;
    const status = newQty === 0 ? "SOLD_OUT" : "ACTIVE";
    await tx.listing.update({
      where: { id: Number(listingId) },
      data: { quantity: newQty, status },
    });

    const purchaseId = await purchaseRepo.createPurchase(
      {
        buyerUserId,
        listingId,
        quantity: qty,
        unitPrice,
        totalPrice,
      },
      tx
    );

    await tx.pointHistory.updateMany({
      where: { id: { in: [buyPhId, sellPhId] } },
      data: { refEntityId: purchaseId },
    });

    const purchase = await purchaseRepo.getPurchaseById(purchaseId);
    return {
      purchaseId,
      buyerUserId,
      sellerUserId,
      listingId,
      quantity: qty,
      unitPrice,
      totalPrice,
      purchase,
    };
  });
}

async function getPurchaseById(purchaseId) {
  if (!purchaseId) {
    const e = new Error("구매 ID가 필요합니다.");
    e.status = 400;
    throw e;
  }
  const p = await purchaseRepo.getPurchaseById(purchaseId);
  if (!p) {
    const e = new Error("구매 내역을 찾을 수 없습니다.");
    e.status = 404;
    throw e;
  }
  return p;
}

async function getPurchasesByBuyer(buyerUserId, { limit = 50, offset = 0 } = {}) {
  if (!buyerUserId) {
    const e = new Error("구매자 ID가 필요합니다.");
    e.status = 400;
    throw e;
  }
  return purchaseRepo.getPurchasesByBuyerId(buyerUserId, { limit, offset });
}

async function getPurchasesBySeller(sellerUserId, { limit = 50, offset = 0 } = {}) {
  if (!sellerUserId) {
    const e = new Error("판매자 ID가 필요합니다.");
    e.status = 400;
    throw e;
  }
  return purchaseRepo.getPurchasesBySellerId(sellerUserId, { limit, offset });
}

export default {
  purchaseCard,
  getPurchaseById,
  getPurchasesByBuyer,
  getPurchasesBySeller,
};
