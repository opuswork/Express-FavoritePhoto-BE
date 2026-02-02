import { prisma } from "../db/prisma.js";

/**
 * Fetches notification events for a user from Purchase (as buyer + as seller) and PointBoxDraw.
 * Returns raw events with type and regDate for the service to format.
 */
async function getNotificationEventsForUser(userId, { limit = 30 } = {}) {
  const uid = Number(userId);

  const [purchasesAsBuyer, purchasesAsSeller, pointBoxDraws] = await Promise.all([
    prisma.purchase.findMany({
      where: { buyerUserId: uid },
      orderBy: { regDate: "desc" },
      take: limit,
      include: {
        listing: {
          include: {
            userCard: { include: { photoCard: true } },
          },
        },
      },
    }),
    prisma.purchase.findMany({
      where: { listing: { sellerUserId: uid } },
      orderBy: { regDate: "desc" },
      take: limit,
      include: {
        buyer: { select: { nickname: true } },
        listing: {
          include: {
            userCard: { include: { photoCard: true } },
          },
        },
      },
    }),
    prisma.pointBoxDraw.findMany({
      where: { userId: uid },
      orderBy: { regDate: "desc" },
      take: limit,
      include: { pointHistory: true },
    }),
  ]);

  const events = [];

  for (const p of purchasesAsBuyer) {
    const card = p.listing?.userCard?.photoCard;
    events.push({
      type: "purchase_as_buyer",
      id: `p-b-${p.id}`,
      regDate: p.regDate,
      grade: card?.grade ?? null,
      cardName: card?.name ?? "포토카드",
      quantity: p.quantity,
    });
  }

  for (const p of purchasesAsSeller) {
    const card = p.listing?.userCard?.photoCard;
    events.push({
      type: "purchase_as_seller",
      id: `p-s-${p.id}`,
      regDate: p.regDate,
      buyerNickname: p.buyer?.nickname ?? "회원",
      grade: card?.grade ?? null,
      cardName: card?.name ?? "포토카드",
      quantity: p.quantity,
    });
  }

  for (const d of pointBoxDraws) {
    events.push({
      type: "point_box_draw",
      id: `draw-${d.id}`,
      regDate: d.regDate,
      earnedPoints: d.earnedPoints ?? d.pointHistory?.amount ?? 0,
    });
  }

  events.sort((a, b) => new Date(b.regDate) - new Date(a.regDate));
  return events.slice(0, limit);
}

export default {
  getNotificationEventsForUser,
};
