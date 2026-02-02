import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * Get all streetlights (fixed poles)
 * GET /streetlights
 */
router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, latitude, longitude
      FROM streetlights
      ORDER BY id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("STREETLIGHT LIST ERROR:", err);
    res.status(500).json({ error: err.message });
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
          flight_id,
          MAX(utc_datetime) AS last_seen
        FROM streetlight_events
        WHERE utc_datetime IS NOT NULL
        GROUP BY streetlight_id, flight_id
      ),
      latest_per_streetlight AS (
        SELECT DISTINCT ON (streetlight_id)
          streetlight_id,
          flight_id
        FROM latest_flight
        ORDER BY streetlight_id, last_seen DESC
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
          SUM(CASE WHEN e.status = 'ON' THEN 1 ELSE 0 END)::numeric
          / NULLIF(COUNT(*), 0),
          3
        ) AS on_ratio,
        CASE
          WHEN
            SUM(CASE WHEN e.status = 'ON' THEN 1 ELSE 0 END)::numeric
            / NULLIF(COUNT(*), 0) >= 0.5
          THEN 'ON'
          ELSE 'OFF'
        END AS inferred_status
      FROM streetlights s
      JOIN latest_per_streetlight lf
        ON s.id = lf.streetlight_id
      JOIN streetlight_events e
        ON e.streetlight_id = lf.streetlight_id
       AND e.flight_id = lf.flight_id
      GROUP BY
        s.id,
        s.latitude,
        s.longitude,
        e.flight_id
      ORDER BY s.id;
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("STREETLIGHT STATUS ERROR:", err);
    res.status(500).json({
      error: err.message,
      code: err.code
    });
  }
});

export default router;
