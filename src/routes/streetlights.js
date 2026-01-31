import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * Get all streetlights
 * GET /streetlights
 */
router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, latitude, longitude FROM streetlights`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch streetlights" });
  }
});

export default router;
