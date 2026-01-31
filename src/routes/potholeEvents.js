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

export default router;
