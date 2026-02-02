import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * Insert streetlight events
 * POST /streetlight-events
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
      const {
        streetlight_id,
        flight_id,
        utc_datetime,
        lux,
        status
      } = e;

      if (
        !streetlight_id ||
        !flight_id ||
        !utc_datetime ||
        lux == null ||
        !status
      ) {
        throw new Error("Invalid streetlight event payload");
      }

      await client.query(
        `INSERT INTO streetlight_events
         (streetlight_id, flight_id, utc_datetime, lux, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [streetlight_id, flight_id, utc_datetime, lux, status]
      );
    }

    await client.query("COMMIT");
    res.json({ inserted: events.length });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to insert streetlight events" });
  } finally {
    client.release();
  }
});

/**
 * Get streetlight events
 * GET /streetlight-events
 * Optional query params:
 *   ?streetlight_id=<uuid>
 *   ?flight_id=<uuid>
 */
router.get("/", async (req, res) => {
  const { streetlight_id, flight_id } = req.query;

  try {
    let query = `
      SELECT
        id,
        streetlight_id,
        flight_id,
        utc_datetime,
        lux,
        status
      FROM streetlight_events
    `;
    const params = [];
    const conditions = [];

    if (streetlight_id) {
      params.push(streetlight_id);
      conditions.push(`streetlight_id = $${params.length}`);
    }

    if (flight_id) {
      params.push(flight_id);
      conditions.push(`flight_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY utc_datetime DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch streetlight events" });
  }
});

export default router;
