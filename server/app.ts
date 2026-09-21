import express from "express";
import { studentApplicationsRouter } from "./routes/studentApplications.js";

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "32kb" }));
  app.use(express.urlencoded({ extended: false }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "dangote-foundation-student-offer" });
  });

  app.use("/api/v1/student-applications", studentApplicationsRouter);

  return app;
}
