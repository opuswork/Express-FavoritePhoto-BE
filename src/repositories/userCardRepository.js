import { pool } from "../db/mysql.js";

export async function createUserCard({
  ownerId,
  photocardId,
  quantity,
  userId,
}) {
  const finalUserId = ownerId || userId;

  const sql = `
    INSERT INTO user_card
      (user_id, photo_card_id, quantity)
    VALUES
      (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      quantity = quantity + VALUES(quantity),
      upt_date = NOW()
  `;

  const [result] = await pool.query(sql, [
    finalUserId,
    photocardId,
    quantity
  ]);

  return result.insertId;
}

export async function getUserCard(userId, photoCardId) {
  const sql = `
        SELECT * FROM user_card
        WHERE user_id = ? AND photo_card_id = ?
    `;
  const [rows] = await pool.query(sql, [userId, photoCardId]);
  return rows[0] || null;
}

export async function findAllByUserId(userId) {
  const sql = `
    SELECT 
      uc.user_card_id,
      uc.user_id,
      uc.quantity,
      uc.reg_date as acquired_date,
      pc.photo_card_id,
      pc.name,
      pc.description,
      pc.genre,
      pc.grade,
      pc.min_price,
      pc.image_url,
      pc.creator_user_id
    FROM user_card uc
    JOIN photo_card pc ON uc.photo_card_id = pc.photo_card_id
    WHERE uc.user_id = ?
    ORDER BY uc.reg_date DESC
  `;
  const [rows] = await pool.query(sql, [userId]);
  return rows;
}
