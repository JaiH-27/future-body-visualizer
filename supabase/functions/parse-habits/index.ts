import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, demographics, chatHistory, currentHabits, currentBiomarkers } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI API key is not configured");

    const demographicContext = demographics
      ? `\nUser demographics: Age ${demographics.age || 'unknown'}, Height ${demographics.height || 'unknown'}cm, Weight ${demographics.weight || 'unknown'}kg, Sex: ${demographics.sex || 'unknown'}.`
      : '';

    const currentStateContext = `
Current habit levels: ${JSON.stringify(currentHabits || {})}
Current biomarkers: ${JSON.stringify(currentBiomarkers || {})}
(null biomarkers = not yet reported by user)`;

    const systemPrompt = `You are an expert clinical health analyst for the "Future You" health visualization app. You have deep knowledge of epidemiology, nutrition science, sleep medicine, exercise physiology, and preventive medicine.
${demographicContext}
${currentStateContext}

Your role: Have a natural conversation about the user's health. Analyze their lifestyle descriptions with clinical precision. When they share new details (symptoms, conditions, test results, lifestyle changes), update the relevant data.

CRITICAL RULES:
1. Be conversational but clinically precise. The user may share info gradually across multiple messages.
2. Infer habits even when stated vaguely (e.g., "I work night shifts" = poor sleep; "desk job" = sedentary).
3. Cross-reference habits: e.g., high stress + poor sleep + sedentary = compounding cardiovascular risk.
4. When the user mentions symptoms, conditions, or test results, estimate reasonable biomarker values.
5. Reference REAL data from: WHO, CDC, AHA, NIH, NHS, Mayo Clinic, Harvard Health.
6. If user mentions blood work results, map them to biomarker fields.
7. If user mentions conditions (e.g., "I have high blood pressure"), set reasonable biomarker estimates.
8. Only set biomarker values you have evidence for — leave others as null.
9. Consider previous conversation context when updating values.
10. Identify the TOP risk factor and highlight it.

Map habits to severity levels 0-2:
- smoking: 0=none, 1=occasional/social, 2=daily/regular
- alcohol: 0=none/rare, 1=moderate, 2=heavy
- sleep: 0=7-9h consistently, 1=5.5-6.9h, 2=≤5h or highly irregular
- exercise: 0=150+ min/week, 1=60-149 min/week, 2=<60 min/week
- diet: 0=balanced, 1=average mixed, 2=poor (high processed)
- stress: 0=well-managed, 1=moderate/situational, 2=chronic/unmanaged
- hydration: 0=adequate, 1=moderate, 2=poor

Biomarker fields you can set (use null if unknown/unchanged):
- totalCholesterol (mg/dL), ldl (mg/dL), hdl (mg/dL), triglycerides (mg/dL)
- fastingGlucose (mg/dL), hba1c (%)
- creatinine (mg/dL), bun (mg/dL), egfr (mL/min)
- alt (U/L), ast (U/L)
- systolic (mmHg), diastolic (mmHg)
- hemoglobin (g/dL), wbc (x10³/µL)
- psa (ng/mL), tsh (mIU/L), crp (mg/L), ferritin (ng/mL), vitaminD (ng/mL)

Demographics you can update (use null if unchanged):
- age (number), height (cm), weight (kg), sex ("male"/"female"/"other")

Provide:
- summary: 2-4 sentence clinical interpretation. Cite specific studies/stats. Highlight the biggest risk.
- sources: 1-3 citations.
- bmi_note: BMI observation if demographics available, null otherwise.`;

    // Build messages array with chat history
    const messages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add previous chat history for context
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const msg of chatHistory.slice(-10)) { // Keep last 10 messages for context
        messages.push({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.text,
        });
      }
    }

    // Add current message
    messages.push({ role: "user", content: message });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "update_health_data",
              description: "Update the user's health data based on the conversation. Set habits, biomarkers, and demographics.",
              parameters: {
                type: "object",
                properties: {
                  habits: {
                    type: "object",
                    properties: {
                      smoking: { type: "number", description: "0=none, 1=occasional, 2=daily" },
                      alcohol: { type: "number", description: "0=none, 1=moderate, 2=heavy" },
                      sleep: { type: "number", description: "0=7-9h, 1=6h, 2=≤5h" },
                      exercise: { type: "number", description: "0=150+min/wk, 1=60-149, 2=<60" },
                      diet: { type: "number", description: "0=balanced, 1=average, 2=poor" },
                      stress: { type: "number", description: "0=low, 1=moderate, 2=high" },
                      hydration: { type: "number", description: "0=adequate, 1=moderate, 2=poor" },
                    },
                    required: ["smoking", "alcohol", "sleep", "exercise", "diet", "stress", "hydration"],
                  },
                  biomarkers: {
                    type: "object",
                    description: "Only include fields mentioned or inferable from conversation. Use null for unknown.",
                    properties: {
                      totalCholesterol: { type: ["number", "null"] },
                      ldl: { type: ["number", "null"] },
                      hdl: { type: ["number", "null"] },
                      triglycerides: { type: ["number", "null"] },
                      fastingGlucose: { type: ["number", "null"] },
                      hba1c: { type: ["number", "null"] },
                      creatinine: { type: ["number", "null"] },
                      bun: { type: ["number", "null"] },
                      egfr: { type: ["number", "null"] },
                      alt: { type: ["number", "null"] },
                      ast: { type: ["number", "null"] },
                      systolic: { type: ["number", "null"] },
                      diastolic: { type: ["number", "null"] },
                      hemoglobin: { type: ["number", "null"] },
                      wbc: { type: ["number", "null"] },
                      psa: { type: ["number", "null"] },
                      tsh: { type: ["number", "null"] },
                      crp: { type: ["number", "null"] },
                      ferritin: { type: ["number", "null"] },
                      vitaminD: { type: ["number", "null"] },
                    },
                  },
                  demographics: {
                    type: "object",
                    description: "Only include fields mentioned. Use null for unchanged.",
                    properties: {
                      age: { type: ["number", "null"] },
                      height: { type: ["number", "null"] },
                      weight: { type: ["number", "null"] },
                      sex: { type: ["string", "null"], enum: ["male", "female", "other", null] },
                    },
                  },
                  summary: { type: "string", description: "Clinical interpretation with citations" },
                  sources: {
                    type: "array",
                    items: { type: "string" },
                    description: "1-3 source citations",
                  },
                  bmi_note: { type: ["string", "null"] },
                },
                required: ["habits", "summary", "sources"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "update_health_data" } },
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

    const result: Record<string, unknown> = {
      habits: {
        smoking: clamp(parsed.habits?.smoking),
        alcohol: clamp(parsed.habits?.alcohol),
        sleep: clamp(parsed.habits?.sleep),
        exercise: clamp(parsed.habits?.exercise),
        diet: clamp(parsed.habits?.diet),
        stress: clamp(parsed.habits?.stress),
        hydration: clamp(parsed.habits?.hydration),
      },
      summary: parsed.summary || "Habits analyzed.",
      sources: parsed.sources || [],
      bmi_note: parsed.bmi_note || null,
    };

    // Include biomarker updates if provided
    if (parsed.biomarkers && typeof parsed.biomarkers === 'object') {
      const bio: Record<string, number | null> = {};
      const bioKeys = [
        'totalCholesterol', 'ldl', 'hdl', 'triglycerides',
        'fastingGlucose', 'hba1c', 'creatinine', 'bun', 'egfr',
        'alt', 'ast', 'systolic', 'diastolic',
        'hemoglobin', 'wbc', 'psa', 'tsh', 'crp', 'ferritin', 'vitaminD',
      ];
      for (const key of bioKeys) {
        const val = parsed.biomarkers[key];
        if (val !== undefined && val !== null && typeof val === 'number') {
          bio[key] = val;
        }
      }
      if (Object.keys(bio).length > 0) {
        result.biomarkers = bio;
      }
    }

    // Include demographics updates if provided
    if (parsed.demographics && typeof parsed.demographics === 'object') {
      const demo: Record<string, unknown> = {};
      if (parsed.demographics.age != null && typeof parsed.demographics.age === 'number') demo.age = parsed.demographics.age;
      if (parsed.demographics.height != null && typeof parsed.demographics.height === 'number') demo.height = parsed.demographics.height;
      if (parsed.demographics.weight != null && typeof parsed.demographics.weight === 'number') demo.weight = parsed.demographics.weight;
      if (parsed.demographics.sex != null && typeof parsed.demographics.sex === 'string') demo.sex = parsed.demographics.sex;
      if (Object.keys(demo).length > 0) {
        result.demographics = demo;
      }
    }

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
