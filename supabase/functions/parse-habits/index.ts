import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, demographics } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI API key is not configured");

    const demographicContext = demographics
      ? `\nUser demographics: Age ${demographics.age || 'unknown'}, Height ${demographics.height || 'unknown'}cm, Weight ${demographics.weight || 'unknown'}kg, Sex: ${demographics.sex || 'unknown'}.`
      : '';

    const systemPrompt = `You are a health habit parser for the "Future You" educational health visualization app. Given a user's description of their lifestyle habits, extract structured data and provide evidence-based health insights.
${demographicContext}

IMPORTANT: Reference REAL, verified health data from reputable sources when providing your summary. Include specific references to organizations like:
- WHO (World Health Organization)
- CDC (Centers for Disease Control and Prevention)
- AHA (American Heart Association)
- NIH (National Institutes of Health)
- NHS (National Health Service)

Return a JSON object using the tool provided. Map habits to severity levels 0-2:
- smoking: 0=none, 1=occasional/social, 2=daily/regular
- alcohol: 0=none, 1=weekends/social (≤7 drinks/week), 2=frequent/daily (>14 drinks/week)
- sleep: 0=7-9h (CDC recommended), 1=6h (below recommended), 2=5h or less (sleep deprived)
- exercise: 0=150+ min/week (WHO guideline), 1=60-149 min/week, 2=<60 min/week (sedentary)
- diet: 0=balanced (fruits, vegetables, whole grains), 1=average/mixed, 2=poor (high processed, fast food)
- stress: 0=well-managed, 1=moderate, 2=chronic/high
- hydration: 0=adequate (8+ cups/day), 1=moderate (4-7 cups), 2=poor (<4 cups/day)

Also provide:
- summary: A 2-3 sentence evidence-based interpretation. Cite at least one specific health guideline or statistic (e.g., "According to the CDC, adults need 7+ hours of sleep per night. Your 5 hours puts you at 65% higher risk of obesity.").
- sources: An array of 1-3 short source citations (e.g., "CDC Sleep Guidelines 2024", "WHO Physical Activity Recommendations").
- bmi_note: If demographics provided, include a brief BMI observation. Otherwise null.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_habits",
              description: "Parse user habits into structured format with evidence-based analysis.",
              parameters: {
                type: "object",
                properties: {
                  smoking: { type: "number", description: "0=none, 1=occasional, 2=daily" },
                  alcohol: { type: "number", description: "0=none, 1=weekends, 2=frequent" },
                  sleep: { type: "number", description: "0=7-9h, 1=6h, 2=5h or less" },
                  exercise: { type: "number", description: "0=150+ min/week, 1=60-149, 2=<60" },
                  diet: { type: "number", description: "0=balanced, 1=average, 2=poor" },
                  stress: { type: "number", description: "0=low, 1=moderate, 2=high" },
                  hydration: { type: "number", description: "0=adequate, 1=moderate, 2=poor" },
                  summary: { type: "string", description: "Evidence-based interpretation with specific health citations" },
                  sources: {
                    type: "array",
                    items: { type: "string" },
                    description: "1-3 short source citations from major health organizations"
                  },
                  bmi_note: { type: "string", description: "BMI observation if demographics provided, null otherwise" },
                },
                required: ["smoking", "alcohol", "sleep", "exercise", "diet", "stress", "hydration", "summary", "sources"],
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
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: `AI error: ${response.status}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const parsed = JSON.parse(toolCall.function.arguments);

    const clamp = (v: number) => Math.min(2, Math.max(0, Math.round(v ?? 0)));

    const result = {
      habits: {
        smoking: clamp(parsed.smoking),
        alcohol: clamp(parsed.alcohol),
        sleep: clamp(parsed.sleep),
        exercise: clamp(parsed.exercise),
        diet: clamp(parsed.diet),
        stress: clamp(parsed.stress),
        hydration: clamp(parsed.hydration),
      },
      summary: parsed.summary || "Habits analyzed.",
      sources: parsed.sources || [],
      bmi_note: parsed.bmi_note || null,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-habits error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
