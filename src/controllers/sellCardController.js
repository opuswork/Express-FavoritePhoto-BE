/**
 * Sell-card controller: POST /api/sell (auth required).
 * req.userId is set by requireAuth middleware.
 */

import sellCardService from "../services/sellCardService.js";

function parseNumber(value) {
    if (value == null) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

export async function create(req, res, next) {
    try {
        const sellerUserId = Number(req.userId);
        const userCardId = req.body?.userCardId != null ? Number(req.body.userCardId) : null;
        const quantity = req.body?.quantity != null ? Number(req.body.quantity) : null;
        // Accept pricePerUnit, price_per_unit, or price (client may send any of these)
        const pricePerUnit =
            parseNumber(req.body?.pricePerUnit) ??
            parseNumber(req.body?.price_per_unit) ??
            parseNumber(req.body?.price) ??
            null;
        const desiredGrade = req.body?.desired_grade != null ? String(req.body.desired_grade).trim() || null : null;
        const desiredGenre = req.body?.desired_genre != null ? String(req.body.desired_genre).trim() || null : null;
        const desiredDesc = req.body?.desired_desc != null ? String(req.body.desired_desc).trim() || null : null;

        const data = await sellCardService.createSellListing(sellerUserId, {
            userCardId,
            quantity,
            pricePerUnit,
            desiredGrade,
            desiredGenre,
            desiredDesc,
        });
        return res.status(201).json({ ok: true, data });
    } catch (err) {
        return next(err);
    }
}
