import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyPinRequest {
  email: string;
  pin: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, pin }: VerifyPinRequest = await req.json();

    if (!email || !pin) {
      return new Response(
        JSON.stringify({ error: "Email and PIN are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find matching PIN
    const { data: verifications, error: fetchError } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("pin_code", pin)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("Database error:", fetchError);
      throw fetchError;
    }

    if (!verifications || verifications.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired PIN" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark PIN as verified
    const { error: updateError } = await supabase
      .from("email_verifications")
      .update({ verified: true })
      .eq("id", verifications[0].id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw updateError;
    }

    console.log("PIN verified successfully for:", email);

    return new Response(
      JSON.stringify({ success: true, verified: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in verify-pin:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
