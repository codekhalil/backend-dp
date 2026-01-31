import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import flightsRouter from "./routes/flights.js";
import potholeEventsRouter from "./routes/potholeEvents.js";
import streetlightEventsRouter from "./routes/streetlightEvents.js";
import streetlightsRouter from "./routes/streetlights.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/flights", flightsRouter);
app.use("/pothole-events", potholeEventsRouter);
app.use("/streetlight-events", streetlightEventsRouter);
app.use("/streetlights", streetlightsRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
