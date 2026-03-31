import { motion } from "framer-motion";
import type { NutritionData, PackageData } from "@/lib/food-api";
import { HealthRatingBadge } from "./HealthRatingBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThumbsUp, ThumbsDown, Flame, Dumbbell, Wheat, Droplets } from "lucide-react";

interface NutritionResultProps {
  data: NutritionData | PackageData;
  onAddToLog?: () => void;
}

export function NutritionResult({ data, onAddToLog }: NutritionResultProps) {
  const isPackaged = "ingredients" in data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">{data.name}</h2>
              <p className="text-sm text-muted-foreground">Per {data.servingSize}</p>
              <Badge variant="secondary" className="mt-2 capitalize">{data.category}</Badge>
            </div>
            <HealthRatingBadge rating={data.healthRating} size="lg" />
          </div>
        </CardContent>
      </Card>

      {/* Macros */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Nutrition Facts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <MacroItem icon={<Flame className="h-4 w-4" />} label="Calories" value={`${data.calories}`} unit="kcal" color="text-accent" />
            <MacroItem icon={<Dumbbell className="h-4 w-4" />} label="Protein" value={`${data.protein}`} unit="g" color="text-primary" />
            <MacroItem icon={<Wheat className="h-4 w-4" />} label="Carbs" value={`${data.carbs}`} unit="g" color="text-health-moderate" />
            <MacroItem icon={<Droplets className="h-4 w-4" />} label="Fat" value={`${data.fat}`} unit="g" color="text-health-poor" />
          </div>
          <Separator className="my-3" />
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Fiber</span><span className="font-medium">{data.fiber}g</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Sugar</span><span className="font-medium">{data.sugar}g</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Vitamins & Minerals */}
      {(data.vitamins.length > 0 || data.minerals.length > 0) && (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vitamins & Minerals</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {data.vitamins.map((v) => (
              <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>
            ))}
            {data.minerals.map((m) => (
              <Badge key={m} variant="outline" className="text-xs">{m}</Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Packaged-specific info */}
      {isPackaged && (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingredients & Additives</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Ingredients</p>
              <p className="text-sm">{(data as PackageData).ingredients.join(", ")}</p>
            </div>
            {(data as PackageData).allergens.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Allergens</p>
                <div className="flex flex-wrap gap-1">
                  {(data as PackageData).allergens.map((a) => (
                    <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>
                  ))}
                </div>
              </div>
            )}
            {(data as PackageData).additives.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Additives</p>
                <div className="flex flex-wrap gap-1">
                  {(data as PackageData).additives.map((a) => (
                    <Badge key={a} variant="outline" className="text-xs border-health-moderate text-health-moderate">{a}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 gap-3">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-health-excellent">
              <ThumbsUp className="h-4 w-4" /> Pros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {data.pros.map((pro, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-health-excellent shrink-0" />
                  {pro}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-health-bad">
              <ThumbsDown className="h-4 w-4" /> Cons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {data.cons.map((con, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-health-bad shrink-0" />
                  {con}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {onAddToLog && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onAddToLog}
          className="w-full py-3 rounded-xl gradient-primary font-display font-semibold text-primary-foreground shadow-elevated"
        >
          + Add to Today's Log
        </motion.button>
      )}
    </motion.div>
  );
}

function MacroItem({ icon, label, value, unit, color }: { icon: React.ReactNode; label: string; value: string; unit: string; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
      <div className={`${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-display font-bold text-foreground">
          {value}<span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>
        </p>
      </div>
    </div>
  );
}
