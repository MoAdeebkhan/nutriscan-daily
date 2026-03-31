import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { foodName, type, isBarcode } = await req.json();

    if (!foodName || !type) {
      return new Response(JSON.stringify({ error: "Missing foodName or type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt: string;
    let userPrompt: string;

    if (type === "fresh") {
      systemPrompt = `You are a professional nutritionist AI. Analyze the given natural food item and return accurate nutritional data. You MUST respond ONLY with a valid JSON object (no markdown, no explanation, no code blocks). Use tool calling to return structured data.`;
      userPrompt = `Analyze the fresh food: "${foodName}". Provide accurate nutrition per 100g serving.`;
    } else {
      systemPrompt = `You are a professional nutritionist AI that analyzes packaged/processed food products. You MUST respond ONLY with accurate nutritional and ingredient data. Use tool calling to return structured data.`;
      userPrompt = isBarcode
        ? `Analyze the packaged food product with barcode: "${foodName}". If you recognize the barcode, provide accurate data. If not, provide your best estimate based on typical products with similar barcodes.`
        : `Analyze the packaged food product: "${foodName}". Provide accurate nutrition per serving.`;
    }

    const tools = type === "fresh" ? [
      {
        type: "function",
        function: {
          name: "return_nutrition_data",
          description: "Return complete nutrition analysis for a fresh food item",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Food name" },
              calories: { type: "number", description: "Calories per serving in kcal" },
              protein: { type: "number", description: "Protein in grams" },
              carbs: { type: "number", description: "Carbohydrates in grams" },
              fat: { type: "number", description: "Fat in grams" },
              fiber: { type: "number", description: "Fiber in grams" },
              sugar: { type: "number", description: "Sugar in grams" },
              vitamins: { type: "array", items: { type: "string" }, description: "Key vitamins present" },
              minerals: { type: "array", items: { type: "string" }, description: "Key minerals present" },
              healthRating: { type: "number", description: "Health rating from 0-100 based on overall nutritional value" },
              pros: { type: "array", items: { type: "string" }, description: "Health benefits, 3-5 items" },
              cons: { type: "array", items: { type: "string" }, description: "Potential downsides, 2-4 items" },
              servingSize: { type: "string", description: "Serving size description" },
              category: { type: "string", enum: ["fruit", "vegetable", "grain", "protein", "dairy", "other"] }
            },
            required: ["name", "calories", "protein", "carbs", "fat", "fiber", "sugar", "vitamins", "minerals", "healthRating", "pros", "cons", "servingSize", "category"],
            additionalProperties: false
          }
        }
      }
    ] : [
      {
        type: "function",
        function: {
          name: "return_package_data",
          description: "Return complete nutrition analysis for a packaged food product",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string" },
              brand: { type: "string" },
              calories: { type: "number" },
              protein: { type: "number" },
              carbs: { type: "number" },
              fat: { type: "number" },
              fiber: { type: "number" },
              sugar: { type: "number" },
              vitamins: { type: "array", items: { type: "string" } },
              minerals: { type: "array", items: { type: "string" } },
              healthRating: { type: "number", description: "Health rating 0-100" },
              pros: { type: "array", items: { type: "string" } },
              cons: { type: "array", items: { type: "string" } },
              servingSize: { type: "string" },
              category: { type: "string", enum: ["packaged", "other"] },
              ingredients: { type: "array", items: { type: "string" } },
              allergens: { type: "array", items: { type: "string" } },
              preservatives: { type: "array", items: { type: "string" } },
              isOrganic: { type: "boolean" },
              additives: { type: "array", items: { type: "string" } }
            },
            required: ["name", "calories", "protein", "carbs", "fat", "fiber", "sugar", "vitamins", "minerals", "healthRating", "pros", "cons", "servingSize", "category", "ingredients", "allergens", "preservatives", "isOrganic", "additives"],
            additionalProperties: false
          }
        }
      }
    ];

    const toolChoice = type === "fresh"
      ? { type: "function", function: { name: "return_nutrition_data" } }
      : { type: "function", function: { name: "return_package_data" } };

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
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: toolChoice,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(aiResult));
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nutritionData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(nutritionData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-food error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
