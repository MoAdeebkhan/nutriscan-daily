import { supabase } from "@/integrations/supabase/client";

export interface NutritionData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  vitamins: string[];
  minerals: string[];
  healthRating: number;
  pros: string[];
  cons: string[];
  servingSize: string;
  category: "fruit" | "vegetable" | "grain" | "protein" | "dairy" | "packaged" | "other";
}

export interface PackageData extends NutritionData {
  brand?: string;
  ingredients: string[];
  allergens: string[];
  preservatives: string[];
  isOrganic: boolean;
  additives: string[];
}

export async function analyzeFreshFood(foodName: string): Promise<NutritionData> {
  const { data, error } = await supabase.functions.invoke("analyze-food", {
    body: { foodName, type: "fresh" },
  });

  if (error) throw new Error(error.message || "Failed to analyze food");
  return data;
}

export async function analyzePackagedFood(input: string, isBarcode: boolean): Promise<PackageData> {
  const { data, error } = await supabase.functions.invoke("analyze-food", {
    body: { foodName: input, type: "packaged", isBarcode },
  });

  if (error) throw new Error(error.message || "Failed to analyze packaged food");
  return data;
}
