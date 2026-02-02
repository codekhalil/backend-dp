import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * Get all streetlights (fixed poles)
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

/**
 * Get inferred streetlight status (latest flight, majority vote)
 * GET /streetlights/status
 */
router.get("/status", async (_req, res) => {
  try {
    const query = `
      WITH latest_flight AS (
        SELECT
          streetlight_id,
          MAX(flight_id) AS latest_flight_id
        FROM streetlight_events
        GROUP BY streetlight_id
      )
      SELECT
        s.id AS streetlight_id,
        s.latitude,
        s.longitude,
        e.flight_id,
        COUNT(*) AS total_samples,
        SUM(CASE WHEN e.status = 'ON' THEN 1 ELSE 0 END) AS on_count,
        SUM(CASE WHEN e.status = 'OFF' THEN 1 ELSE 0 END) AS off_count,
        ROUND(
          SUM(CASE WHEN e.status = 'ON' THEN 1 ELSE 0 END)::float / COUNT(*),
          3
        ) AS on_ratio,
        CASE
          WHEN SUM(CASE WHEN e.status = 'ON' THEN 1 ELSE 0 END)::float / COUNT(*) >= 0.5
            THEN 'ON'
          ELSE 'OFF'
        END AS inferred_status
      FROM streetlights s
      JOIN latest_flight lf
        ON s.id = lf.streetlight_id
      JOIN streetlight_events e
        ON e.streetlight_id = lf.streetlight_id
       AND e.flight_id = lf.latest_flight_id
      GROUP BY s.id, s.latitude, s.longitude, e.flight_id
      ORDER BY s.id
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to compute streetlight status" });
  }
});

export default router;
