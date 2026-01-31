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

      if (!streetlight_id || !flight_id || !status) {
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

export default router;
