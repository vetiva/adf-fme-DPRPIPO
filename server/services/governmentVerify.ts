export type StudentCredentials = {
  university: string;
  matricNumber: string;
  surname: string;
};

export type GovernmentVerificationResult =
  | {
      ok: true;
      reference?: string;
      payload?: unknown;
    }
  | {
      ok: false;
      code: "invalid_credentials" | "upstream_error" | "misconfigured";
      message: string;
    };

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/**
 * Calls the configured Federal / education verification API.
 * Mode is controlled by GOVERNMENT_VERIFY_MODE:
 * - mock: local acceptance (rejects matric numbers starting with INVALID)
 * - live: POST credentials to GOVERNMENT_VERIFY_API_URL with API key header
 */
export async function verifyStudentWithGovernment(
  input: StudentCredentials,
): Promise<GovernmentVerificationResult> {
  const university = normalize(input.university);
  const matricNumber = normalize(input.matricNumber);
  const surname = normalize(input.surname);

  if (!university || !matricNumber || !surname) {
    return {
      ok: false,
      code: "invalid_credentials",
      message: "University, matric number, and surname are required.",
    };
  }

  const mode = (process.env.GOVERNMENT_VERIFY_MODE ?? "mock").toLowerCase();

  if (mode === "mock") {
    if (matricNumber.toUpperCase().startsWith("INVALID")) {
      return {
        ok: false,
        code: "invalid_credentials",
        message:
          "We could not verify these student details. Please check your university records and try again.",
      };
    }

    return {
      ok: true,
      reference: `MOCK-${matricNumber.toUpperCase()}`,
      payload: {
        mode: "mock",
        university,
        matricNumber,
        surname,
        verifiedAt: new Date().toISOString(),
      },
    };
  }

  const apiUrl = process.env.GOVERNMENT_VERIFY_API_URL?.trim();
  const apiKey = process.env.GOVERNMENT_VERIFY_API_KEY?.trim();
  const timeoutMs = Number(process.env.GOVERNMENT_VERIFY_TIMEOUT_MS ?? 15000);

  if (!apiUrl || !apiKey) {
    return {
      ok: false,
      code: "misconfigured",
      message:
        "Government verification is not configured. Set GOVERNMENT_VERIFY_API_URL and GOVERNMENT_VERIFY_API_KEY.",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({
        university,
        matricNumber,
        surname,
      }),
      signal: controller.signal,
    });

    const body = (await response.json().catch(() => null)) as
      | {
          valid?: boolean;
          verified?: boolean;
          reference?: string;
          message?: string;
          error?: string;
        }
      | null;

    if (!response.ok) {
      return {
        ok: false,
        code: response.status >= 500 ? "upstream_error" : "invalid_credentials",
        message:
          body?.message ||
          body?.error ||
          "Student credential verification failed.",
      };
    }

    const valid = body?.valid === true || body?.verified === true;
    if (!valid) {
      return {
        ok: false,
        code: "invalid_credentials",
        message:
          body?.message ||
          "We could not verify these student details against government records.",
      };
    }

    return {
      ok: true,
      reference: body?.reference,
      payload: body,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Government verification failed.";
    return {
      ok: false,
      code: "upstream_error",
      message,
    };
  } finally {
    clearTimeout(timer);
  }
}
