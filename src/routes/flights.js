import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * Create a new flight
 * POST /flights
 * body:
 * {
 *   mode: "pothole" | "streetlight",
 *   start_time?: ISO8601 string,
 *   end_time?: ISO8601 string
 * }
 */
router.post("/", async (req, res) => {
  const { mode, start_time, end_time } = req.body;

  if (!mode || !["pothole", "streetlight"].includes(mode)) {
    return res.status(400).json({ error: "Invalid mode" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO flights (mode, start_time, end_time)
      VALUES (
        $1,
        COALESCE($2::timestamptz, now()),
        $3::timestamptz
      )
      RETURNING id
      `,
      [mode, start_time || null, end_time || null]
    );

    res.json({ flight_id: result.rows[0].id });
  } catch (err) {
    console.error("Failed to create flight:", err);
    res.status(500).json({ error: "Failed to create flight" });
  }
});

export default router;
