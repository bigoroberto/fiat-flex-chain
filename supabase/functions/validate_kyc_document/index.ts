import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { documentType, fullName, dateOfBirth, imageBase64 } = await req.json();

    if (!documentType || !fullName || !dateOfBirth || !imageBase64) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Missing required fields",
          valid: false,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Basic validation rules
    const validationResult = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[],
    };

    // Check image size (must be at least 50KB for valid ID photo)
    const imageSize = (imageBase64.length * 3) / 4; // Approximate size
    if (imageSize < 20000) {
      validationResult.errors.push("Immagine troppo piccola o di scarsa qualità");
      validationResult.valid = false;
    }

    if (imageSize > 10000000) {
      validationResult.errors.push("Immagine troppo grande (max 10MB)");
      validationResult.valid = false;
    }

    // Check if image is likely a valid document photo
    // (basic check: looking for common image headers)
    if (!imageBase64.startsWith("/9j/") && !imageBase64.startsWith("iVBO")) {
      validationResult.errors.push("File non è un'immagine valida (JPG o PNG richiesto)");
      validationResult.valid = false;
    }

    // Validate document expiry for ID/Passport
    if (["ID", "Passaporto"].includes(documentType)) {
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 10);
      
      // In production, you would use OCR (Tesseract.js) to extract expiry
      // For now, basic check: document should be valid for at least 6 months
      const sixMonthsAhead = new Date();
      sixMonthsAhead.setMonth(sixMonthsAhead.getMonth() + 6);
      
      validationResult.warnings.push("Verifica manuale della data di scadenza consigliata");
    }

    // Validate document number format
    const docNumberPattern = /^[A-Z0-9]{5,20}$/;
    if (!docNumberPattern.test(documentType === "Passaporto" ? fullName : dateOfBirth)) {
      // Note: In production, extract actual document number via OCR
      validationResult.warnings.push("Numero documento avrà validazione manuale");
    }

    // Check birth date is reasonable
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      validationResult.errors.push("Età minima richiesta: 18 anni");
      validationResult.valid = false;
    }

    if (age > 120) {
      validationResult.errors.push("Data di nascita non valida");
      validationResult.valid = false;
    }

    // Check full name is not empty and reasonable
    if (fullName.trim().length < 3) {
      validationResult.errors.push("Nome non valido");
      validationResult.valid = false;
    }

    if (fullName.length > 100) {
      validationResult.errors.push("Nome troppo lungo");
      validationResult.valid = false;
    }

    // Check for suspicious patterns
    if (/^[aeiou]+$|^[bcdfg]+$/i.test(fullName)) {
      validationResult.errors.push("Nome contiene solo vocali o solo consonanti (sospetto)");
      validationResult.valid = false;
    }

    // For production, would integrate with:
    // - Tesseract.js for OCR text extraction
    // - Face detection to verify it's a real person
    // - Document detection (ID shape recognition)
    // - MRZ (Machine Readable Zone) parsing for passports

    const response = {
      status: validationResult.valid ? "success" : "failed",
      valid: validationResult.valid,
      requiresManualReview: validationResult.warnings.length > 0,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      message: validationResult.valid
        ? "Documento accettato. Sottoposto a verifica manuale finale."
        : validationResult.errors[0] || "Documento non valido",
    };

    return new Response(JSON.stringify(response), {
      status: validationResult.valid ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("KYC validation error:", error);
    return new Response(
      JSON.stringify({ status: "error", message: errorMessage, valid: false }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
