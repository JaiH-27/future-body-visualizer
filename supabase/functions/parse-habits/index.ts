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

    const systemPrompt = `You are an expert clinical health analyst and habit assessment specialist for the "Future You" health visualization app. You have deep knowledge of epidemiology, nutrition science, sleep medicine, exercise physiology, and preventive medicine.
${demographicContext}

Your role: Analyze the user's lifestyle description with clinical precision. Infer habits even when stated vaguely — use contextual clues (e.g., "I work night shifts" implies poor sleep; "desk job" implies sedentary lifestyle; "I drink socially" needs follow-up severity assessment).

CRITICAL RULES:
1. Be nuanced — don't default everything to extremes. Most people fall in moderate ranges.
2. Cross-reference habits: e.g., high stress + poor sleep + sedentary = compounding cardiovascular risk.
3. Consider age/sex-specific guidelines when demographics are provided (e.g., iron needs differ by sex, exercise tolerance by age).
4. Reference REAL, verified data from: WHO, CDC, AHA, NIH, NHS, Mayo Clinic, Harvard Health, Lancet studies.
5. Provide SPECIFIC statistics and risk multipliers when possible (e.g., "Sleeping <6h increases type 2 diabetes risk by 28% — Cappuccio et al., Diabetes Care").
6. If the user's input is vague or incomplete, make reasonable clinical inferences and note your assumptions in the summary.
7. Identify the TOP risk factor and highlight it prominently.

Map habits to severity levels 0-2:
- smoking: 0=none, 1=occasional/social (<5/week), 2=daily/regular (5+/day)
- alcohol: 0=none/rare, 1=moderate (≤7 drinks/week women, ≤14 men), 2=heavy (above moderate)
- sleep: 0=7-9h consistently (CDC optimal), 1=5.5-6.9h (suboptimal), 2=≤5h or highly irregular
- exercise: 0=150+ min moderate OR 75+ vigorous/week (WHO), 1=60-149 min/week, 2=<60 min/week
- diet: 0=balanced (Mediterranean/DASH-like), 1=average mixed, 2=poor (high ultra-processed, low fiber)
- stress: 0=well-managed with coping strategies, 1=moderate/situational, 2=chronic/unmanaged
- hydration: 0=adequate (2.7L women/3.7L men per NAM), 1=moderate (50-75% of adequate), 2=poor (<50%)

Also provide:
- summary: A 3-4 sentence clinical-grade interpretation. MUST cite at least 2 specific studies or guidelines with real statistics. Identify the user's biggest health risk and explain the compounding effect of their habit combination.
- sources: 2-3 specific citations (e.g., "Cappuccio et al., Diabetes Care 2010 — sleep deprivation and diabetes risk", "WHO Global Physical Activity Guidelines 2020").
- bmi_note: If demographics provided, calculate BMI, state the category (underweight/normal/overweight/obese), and note any age/sex-specific considerations. Otherwise null.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
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
