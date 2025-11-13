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
    const { planId, userId, amount, planName } = await req.json();

    if (!planId || !userId || !amount) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          status: "failed",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // In production, integrate with Stripe/PayPal here
    // For now, log payment intent
    console.log(`Payment processed:`, {
      userId,
      planId,
      amount,
      planName,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Payment processed successfully",
        paymentId: `PAY_${Date.now()}_${userId}`,
        amount,
        planName,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage, status: "error" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
