import notificationService from "../services/notificationService.js";

/**
 * GET /users/me/notifications
 * Requires auth. Returns { notifications, unreadCount } from Purchase and PointBoxDraw.
 */
export async function getMyNotifications(req, res, next) {
  try {
    const userId = req.userId;
    const limit = Math.min(Number(req.query?.limit) || 30, 50);
    const result = await notificationService.getNotificationsForUser(userId, { limit });
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
