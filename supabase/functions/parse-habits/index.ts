import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, demographics } = await req.json();
    const API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!API_KEY) throw new Error("API key is not configured");

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

Return a JSON object with EXACTLY this structure (no markdown, no code fences, just raw JSON):
{
  "smoking": <0-2>,
  "alcohol": <0-2>,
  "sleep": <0-2>,
  "exercise": <0-2>,
  "diet": <0-2>,
  "stress": <0-2>,
  "hydration": <0-2>,
  "summary": "<2-3 sentence evidence-based interpretation with specific health citations>",
  "sources": ["<source1>", "<source2>"],
  "bmi_note": "<BMI observation if demographics provided, or null>"
}

Map habits to severity levels 0-2:
- smoking: 0=none, 1=occasional/social, 2=daily/regular
- alcohol: 0=none, 1=weekends/social (≤7 drinks/week), 2=frequent/daily (>14 drinks/week)
- sleep: 0=7-9h (CDC recommended), 1=6h (below recommended), 2=5h or less (sleep deprived)
- exercise: 0=150+ min/week (WHO guideline), 1=60-149 min/week, 2=<60 min/week (sedentary)
- diet: 0=balanced (fruits, vegetables, whole grains), 1=average/mixed, 2=poor (high processed, fast food)
- stress: 0=well-managed, 1=moderate, 2=chronic/high
- hydration: 0=adequate (8+ cups/day), 1=moderate (4-7 cups), 2=poor (<4 cups/day)

Cite at least one specific health guideline or statistic in the summary.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: "user", content: message }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "API credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Anthropic API error:", response.status, t);
      return new Response(JSON.stringify({ error: `API error: ${response.status}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const textContent = data.content?.find((block: any) => block.type === "text")?.text;
    if (!textContent) throw new Error("No text in response");

    // Extract JSON from response (handle potential markdown fences)
    let jsonStr = textContent.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    const parsed = JSON.parse(jsonStr);

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
