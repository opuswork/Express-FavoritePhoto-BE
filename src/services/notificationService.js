import notificationRepository from "../repositories/notificationRepository.js";

function formatGrade(grade) {
  if (!grade) return "COMMON";
  const g = String(grade).toLowerCase();
  const map = { common: "COMMON", rare: "RARE", epic: "SUPER RARE", legendary: "LEGENDARY" };
  return map[g] ?? g.toUpperCase();
}

function relativeTimeText(regDate) {
  const now = new Date();
  const then = new Date(regDate);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return then.toLocaleDateString("ko-KR");
}

/**
 * Returns notifications for the user: { notifications, unreadCount }.
 * Each notification: { id, message, timeText, regDate }.
 */
async function getNotificationsForUser(userId, { limit = 30 } = {}) {
  const events = await notificationRepository.getNotificationEventsForUser(userId, { limit });

  const notifications = events.map((ev) => {
    let message;
    const gradeLabel = ev.grade ? `[${formatGrade(ev.grade)}] ` : "";

    switch (ev.type) {
      case "purchase_as_buyer":
        message = `${gradeLabel}${ev.cardName} ${ev.quantity}장을 성공적으로 구매했습니다.`;
        break;
      case "purchase_as_seller":
        message = `${ev.buyerNickname}님이 ${gradeLabel}${ev.cardName}을 ${ev.quantity}장 구매했습니다.`;
        break;
      case "point_box_draw":
        message = `포인트 박스에서 ${Number(ev.earnedPoints).toLocaleString()} P를 획득했습니다.`;
        break;
      default:
        message = "알림";
    }

    return {
      id: ev.id,
      message,
      timeText: relativeTimeText(ev.regDate),
      regDate: ev.regDate,
    };
  });

  return {
    notifications,
    unreadCount: notifications.length,
  };
}

export default {
  getNotificationsForUser,
};
