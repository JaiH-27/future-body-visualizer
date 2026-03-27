import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a health habit parser for the "Future You" demo app. Given a user's description of their lifestyle habits, extract structured data.

Return a JSON object using the tool provided. Map habits to severity levels 0-2:
- smoking: 0=none, 1=occasional, 2=daily
- alcohol: 0=none, 1=weekends/social, 2=frequent/daily
- sleep: 0=8h+ (good), 1=6h (moderate), 2=5h or less (poor)
- exercise: 0=regular, 1=low/occasional, 2=none/sedentary
- diet: 0=balanced/healthy, 1=average/mixed, 2=poor/fast food

Also provide a brief, friendly 1-2 sentence summary of what you interpreted. Be encouraging but honest.`
          },
          { role: "user", content: message }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_habits",
              description: "Parse user habits into structured format",
              parameters: {
                type: "object",
                properties: {
                  habits: {
                    type: "object",
                    properties: {
                      smoking: { type: "number", enum: [0, 1, 2] },
                      alcohol: { type: "number", enum: [0, 1, 2] },
                      sleep: { type: "number", enum: [0, 1, 2] },
                      exercise: { type: "number", enum: [0, 1, 2] },
                      diet: { type: "number", enum: [0, 1, 2] },
                    },
                    required: ["smoking", "alcohol", "sleep", "exercise", "diet"],
                  },
                  summary: { type: "string", description: "Brief friendly interpretation" },
                },
                required: ["habits", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "parse_habits" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-habits error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
