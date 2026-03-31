import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface DaySummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  avgHealthRating: number;
  itemCount: number;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [weekData, setWeekData] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchWeekData();
  }, [user]);

  const fetchWeekData = async () => {
    const sevenDaysAgo = subDays(new Date(), 6);
    const { data, error } = await supabase
      .from("food_logs")
      .select("*")
      .eq("user_id", user!.id)
      .gte("created_at", startOfDay(sevenDaysAgo).toISOString())
      .lte("created_at", endOfDay(new Date()).toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load reports");
      setLoading(false);
      return;
    }

    // Group by day
    const dayMap = new Map<string, any[]>();
    for (let i = 0; i < 7; i++) {
      const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
      dayMap.set(d, []);
    }

    (data || []).forEach((log: any) => {
      const d = format(new Date(log.created_at), "yyyy-MM-dd");
      if (dayMap.has(d)) dayMap.get(d)!.push(log);
    });

    const summaries: DaySummary[] = [];
    dayMap.forEach((logs, date) => {
      summaries.push({
        date,
        totalCalories: logs.reduce((s: number, l: any) => s + (l.calories || 0), 0),
        totalProtein: logs.reduce((s: number, l: any) => s + (l.protein || 0), 0),
        totalCarbs: logs.reduce((s: number, l: any) => s + (l.carbs || 0), 0),
        totalFat: logs.reduce((s: number, l: any) => s + (l.fat || 0), 0),
        totalFiber: logs.reduce((s: number, l: any) => s + (l.fiber || 0), 0),
        avgHealthRating: logs.length > 0
          ? Math.round(logs.reduce((s: number, l: any) => s + (l.health_rating || 0), 0) / logs.length)
          : 0,
        itemCount: logs.length,
      });
    });

    setWeekData(summaries);
    setLoading(false);
  };

  const downloadReport = () => {
    if (weekData.length === 0) {
      toast.error("No data to download");
      return;
    }

    const headers = "Date,Calories,Protein(g),Carbs(g),Fat(g),Fiber(g),Health Rating,Items\n";
    const rows = weekData
      .map(
        (d) =>
          `${d.date},${d.totalCalories},${d.totalProtein},${d.totalCarbs},${d.totalFat},${d.totalFiber},${d.avgHealthRating},${d.itemCount}`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nutriscan-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  };

  const weekTotals = weekData.reduce(
    (acc, d) => ({
      calories: acc.calories + d.totalCalories,
      protein: acc.protein + d.totalProtein,
      carbs: acc.carbs + d.totalCarbs,
      fat: acc.fat + d.totalFat,
      fiber: acc.fiber + d.totalFiber,
      items: acc.items + d.itemCount,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, items: 0 }
  );

  const maxCals = Math.max(...weekData.map((d) => d.totalCalories), 1);

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-muted-foreground">Sign in to see your reports</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Reports</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadReport}
          className="text-xs"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" /> Download
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Week totals */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" /> This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="font-display text-2xl font-bold text-accent">{weekTotals.calories}</p>
                  <p className="text-[10px] text-muted-foreground">Calories</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-primary">{weekTotals.protein}g</p>
                  <p className="text-[10px] text-muted-foreground">Protein</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-foreground">{weekTotals.items}</p>
                  <p className="text-[10px] text-muted-foreground">Items logged</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily bar chart */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BarChart3 className="h-4 w-4" /> Daily Calories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-40">
                {weekData.map((d, i) => (
                  <motion.div
                    key={d.date}
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.totalCalories / maxCals) * 100}%` }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className="flex-1 flex flex-col items-center justify-end"
                  >
                    <div
                      className="w-full rounded-t-lg gradient-primary min-h-[4px]"
                      style={{ height: `${Math.max((d.totalCalories / maxCals) * 100, 3)}%` }}
                    />
                    <p className="mt-1 text-[9px] text-muted-foreground">
                      {format(new Date(d.date), "EEE")}
                    </p>
                    <p className="text-[9px] font-medium text-foreground">{d.totalCalories || "—"}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Daily breakdown */}
          <div className="space-y-2">
            <h3 className="font-display text-sm font-semibold text-foreground">Daily Breakdown</h3>
            {weekData
              .slice()
              .reverse()
              .map((d) => (
                <div
                  key={d.date}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-soft"
                >
                  <div className="shrink-0 text-center">
                    <p className="font-display text-lg font-bold text-foreground">
                      {format(new Date(d.date), "d")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(d.date), "MMM")}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{d.itemCount} items logged</p>
                    <p className="text-xs text-muted-foreground">
                      {d.totalCalories} cal · {d.totalProtein}g protein · Avg rating: {d.avgHealthRating}/100
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
