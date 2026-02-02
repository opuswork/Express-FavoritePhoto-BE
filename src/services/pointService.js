import { prisma } from "../db/prisma.js";
import pointHistoryRepo from "../repositories/pointHistoryRepository.js";
import pointBoxDrawRepo from "../repositories/pointBoxDrawRepository.js";

async function updateUserPoints(userId, amount, type, refEntityType = null, refEntityId = null) {
  return prisma.$transaction(async (tx) => {
    const pointHistoryId = await pointHistoryRepo.createPointHistory(
      { userId, amount, type, refEntityType, refEntityId },
      tx
    );

    const user = await tx.user.findUnique({
      where: { id: Number(userId) },
      select: { id: true },
    });
    if (!user) {
      const err = new Error("유저를 찾을 수 없습니다.");
      err.status = 404;
      throw err;
    }

    const updated = await tx.user.update({
      where: { id: Number(userId) },
      data: { points: { increment: amount } },
      select: { points: true },
    });

    return {
      pointHistoryId,
      newBalance: updated.points,
    };
  });
}

async function drawPointBox(userId) {
  return prisma.$transaction(async (tx) => {
    const lastDraw = await pointBoxDrawRepo.getLastDrawByUserIdForUpdate(userId, tx);

    if (lastDraw) {
      const secondsSinceLastDraw = lastDraw.seconds_since_last_draw ?? 0;
      const oneHourInSeconds = 60 * 60;

      if (secondsSinceLastDraw < oneHourInSeconds) {
        const remainingSeconds = oneHourInSeconds - secondsSinceLastDraw;
        const remainingMinutes = Math.floor(remainingSeconds / 60);
        const remainingSecs = remainingSeconds % 60;
        let message = "";
        if (remainingMinutes > 0 && remainingSecs > 0) {
          message += `${remainingMinutes}분 ${remainingSecs}초 후 시도해주세요.`;
        } else if (remainingMinutes > 0) {
          message += `${remainingMinutes}분 후 시도해주세요.`;
        } else {
          message += `${remainingSecs}초 후 시도해주세요.`;
        }
        const error = new Error(message);
        error.status = 429;
        throw error;
      }
    }

    const earnedPoints = Math.floor(Math.random() * 10) + 1;

    const pointHistoryId = await pointHistoryRepo.createPointHistory(
      {
        userId,
        amount: earnedPoints,
        type: "POINT_BOX_DRAW",
        refEntityType: "POINT_BOX_DRAW",
        refEntityId: null,
      },
      tx
    );

    const updated = await tx.user.update({
      where: { id: Number(userId) },
      data: { points: { increment: earnedPoints } },
      select: { points: true },
    });

    const drawRow = await tx.pointBoxDraw.create({
      data: {
        userId: Number(userId),
        pointHistoryId,
        earnedPoints,
      },
    });

    return {
      drawId: drawRow.id,
      earnedPoints,
      newBalance: updated.points,
      pointHistoryId,
    };
  });
}

async function getPointHistory(userId, { limit = 50, offset = 0 } = {}) {
  if (!userId) {
    const error = new Error("유저 ID가 필요합니다.");
    error.status = 400;
    throw error;
  }
  return pointHistoryRepo.getPointHistoryByUserId(userId, { limit, offset });
}

async function getDrawHistory(userId, { limit = 50, offset = 0 } = {}) {
  if (!userId) {
    const error = new Error("유저 ID가 필요합니다.");
    error.status = 400;
    throw error;
  }
  return pointBoxDrawRepo.getDrawHistoryByUserId(userId, { limit, offset });
}

async function getUserPoints(userId) {
  if (!userId) {
    const error = new Error("유저 ID가 필요합니다.");
    error.status = 400;
    throw error;
  }
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { id: true, points: true },
  });
  if (!user) {
    const error = new Error("유저를 찾을 수 없습니다.");
    error.status = 404;
    throw error;
  }
  return {
    userId: user.id,
    points: user.points,
  };
}

export default {
  updateUserPoints,
  drawPointBox,
  getPointHistory,
  getDrawHistory,
  getUserPoints,
};
