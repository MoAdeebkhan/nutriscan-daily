import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Apple, ScanBarcode, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NutritionResult } from "@/components/NutritionResult";
import { analyzeFreshFood, analyzePackagedFood } from "@/lib/food-api";
import type { NutritionData, PackageData } from "@/lib/food-api";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function ScanPage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("type") === "packaged" ? "packaged" : "fresh";

  const [freshInput, setFreshInput] = useState("");
  const [packageInput, setPackageInput] = useState("");
  const [isBarcode, setIsBarcode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NutritionData | PackageData | null>(null);

  const handleFreshScan = async () => {
    if (!freshInput.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await analyzeFreshFood(freshInput.trim());
      setResult(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to analyze food");
    } finally {
      setLoading(false);
    }
  };

  const handlePackageScan = async () => {
    if (!packageInput.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await analyzePackagedFood(packageInput.trim(), isBarcode);
      setResult(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to analyze food");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLog = async () => {
    if (!result) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to log food");
        return;
      }
      const { error } = await supabase.from("food_logs").insert({
        user_id: user.id,
        food_name: result.name,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        fiber: result.fiber,
        health_rating: result.healthRating,
        category: result.category,
        nutrition_data: result as any,
      });
      if (error) throw error;
      toast.success(`${result.name} added to today's log!`);
    } catch (e: any) {
      toast.error(e.message || "Failed to add to log");
    }
  };

  return (
    <div className="px-4 pb-24 pt-4 space-y-4">
      <h1 className="font-display text-xl font-bold text-foreground">Scan Food</h1>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="fresh" className="font-display text-sm">
            <Apple className="mr-1.5 h-4 w-4" /> Fresh
          </TabsTrigger>
          <TabsTrigger value="packaged" className="font-display text-sm">
            <ScanBarcode className="mr-1.5 h-4 w-4" /> Packaged
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fresh" className="space-y-4 mt-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter the name of any fruit, vegetable, or natural food
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Apple, Broccoli, Salmon..."
                value={freshInput}
                onChange={(e) => setFreshInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFreshScan()}
                className="flex-1"
              />
              <Button
                onClick={handleFreshScan}
                disabled={loading || !freshInput.trim()}
                className="gradient-primary text-primary-foreground shrink-0"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Quick picks */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Quick picks</p>
            <div className="flex flex-wrap gap-2">
              {["🍎 Apple", "🥦 Broccoli", "🍌 Banana", "🥕 Carrot", "🍗 Chicken", "🍚 Rice", "🥑 Avocado", "🍳 Egg"].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setFreshInput(item.slice(2).trim());
                    }}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="packaged" className="space-y-4 mt-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter product name or barcode number
            </p>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setIsBarcode(false)}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
                  !isBarcode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                Product Name
              </button>
              <button
                onClick={() => setIsBarcode(true)}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
                  isBarcode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                Barcode
              </button>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={isBarcode ? "Enter barcode number..." : "e.g., Coca Cola, Doritos..."}
                value={packageInput}
                onChange={(e) => setPackageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePackageScan()}
                className="flex-1"
              />
              <Button
                onClick={handlePackageScan}
                disabled={loading || !packageInput.trim()}
                className="gradient-primary text-primary-foreground shrink-0"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-12 gap-3"
          >
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center animate-pulse-glow">
              <Search className="h-8 w-8 text-primary-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Analyzing with AI...</p>
          </motion.div>
        )}

        {result && !loading && (
          <NutritionResult data={result} onAddToLog={handleAddToLog} />
        )}
      </AnimatePresence>
    </div>
  );
}
