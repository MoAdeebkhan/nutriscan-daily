import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { HealthRatingBadge } from "@/components/HealthRatingBadge";
import { Calendar, Flame, Dumbbell, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface FoodLog {
  id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  health_rating: number;
  category: string;
  created_at: string;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchLogs();
  }, [user]);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("food_logs")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      toast.error("Failed to load history");
    } else {
      setLogs((data as FoodLog[]) || []);
    }
    setLoading(false);
  };

  const deleteLog = async (id: string) => {
    const { error } = await supabase.from("food_logs").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      setLogs((prev) => prev.filter((l) => l.id !== id));
      toast.success("Removed from log");
    }
  };

  // Group by date
  const grouped = logs.reduce<Record<string, FoodLog[]>>((acc, log) => {
    const date = format(new Date(log.created_at), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-muted-foreground">Sign in to see your history</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-4 space-y-4">
      <h1 className="font-display text-xl font-bold text-foreground">History</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-soft">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">No food logged yet. Start scanning!</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, items]) => {
          const totalCals = items.reduce((s, l) => s + l.calories, 0);
          const totalProtein = items.reduce((s, l) => s + l.protein, 0);
          return (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-foreground">
                  {format(new Date(date), "EEEE, MMM d")}
                </h3>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-accent" />{totalCals} cal</span>
                  <span className="flex items-center gap-1"><Dumbbell className="h-3 w-3 text-primary" />{totalProtein}g</span>
                </div>
              </div>

              {items.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-soft"
                >
                  <HealthRatingBadge rating={log.health_rating} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{log.food_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.calories} cal · {log.protein}g protein · {log.carbs}g carbs
                    </p>
                  </div>
                  <button
                    onClick={() => deleteLog(log.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </motion.div>
          );
        })
      )}
    </div>
  );
}
