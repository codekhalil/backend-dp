import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * Insert pothole events
 * POST /pothole-events
 */
router.post("/", async (req, res) => {
  const events = req.body;

  if (!Array.isArray(events)) {
    return res.status(400).json({ error: "Expected an array" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const e of events) {
      const { lat, lon, confidence, flight_id } = e;

      if (
        lat == null ||
        lon == null ||
        confidence == null ||
        !flight_id
      ) {
        throw new Error("Invalid pothole event payload");
      }

      await client.query(
        `INSERT INTO pothole_events (lat, lon, confidence, flight_id)
         VALUES ($1, $2, $3, $4)`,
        [lat, lon, confidence, flight_id]
      );
    }

    await client.query("COMMIT");
    res.json({ inserted: events.length });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to insert pothole events" });
  } finally {
    client.release();
  }
});

/**
 * Get pothole events
 * GET /pothole-events
 * Optional query: ?flight_id=<uuid>
 */
router.get("/", async (req, res) => {
  const { flight_id } = req.query;

  try {
    let query = `
      SELECT
        id,
        lat,
        lon,
        confidence,
        flight_id,
        created_at
      FROM pothole_events
    `;
    const params = [];

    if (flight_id) {
      query += " WHERE flight_id = $1";
      params.push(flight_id);
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pothole events" });
  }
});

export default router;
