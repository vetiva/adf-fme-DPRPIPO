import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase.js";
import { verifyStudentWithGovernment } from "../services/governmentVerify.js";

const submitSchema = z.object({
  university: z.string().trim().min(2).max(200),
  matric: z.string().trim().min(2).max(80),
  surname: z.string().trim().min(1).max(120),
});

export const studentApplicationsRouter = Router();

studentApplicationsRouter.post("/", async (req, res) => {
  const parsed = submitSchema.safeParse({
    university: req.body?.university,
    matric: req.body?.matric ?? req.body?.matricNumber,
    surname: req.body?.surname,
  });

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "validation_error",
      message: "Please provide a valid university, matric number, and surname.",
      details: parsed.error.flatten(),
    });
  }

  const { university, matric, surname } = parsed.data;

  const verification = await verifyStudentWithGovernment({
    university,
    matricNumber: matric,
    surname,
  });

  if (!verification.ok) {
    const status =
      verification.code === "misconfigured" || verification.code === "upstream_error"
        ? 502
        : 422;
    return res.status(status).json({
      ok: false,
      error: verification.code,
      message: verification.message,
    });
  }

  const redirectUrl =
    process.env.IPO_REDIRECT_URL?.trim() || "https://ipo.vetiva.com/";

  const now = new Date().toISOString();
  const row = {
    university,
    matric_number: matric,
    surname,
    verification_status: "verified",
    government_reference: verification.reference ?? null,
    verification_payload: verification.payload
      ? JSON.stringify(verification.payload)
      : null,
    updated_at: now,
  };

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("student_applications")
      .upsert(row, {
        onConflict: "university,matric_number,surname",
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Failed to store student application", error);
      return res.status(500).json({
        ok: false,
        error: "storage_error",
        message:
          "Your details were verified but could not be saved. Please try again.",
      });
    }

    return res.status(201).json({
      ok: true,
      applicationId: data.id,
      redirectUrl,
    });
  } catch (error) {
    console.error("Failed to store student application", error);
    return res.status(500).json({
      ok: false,
      error: "storage_error",
      message: "Your details were verified but could not be saved. Please try again.",
    });
  }
});
