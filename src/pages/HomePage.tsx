import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Apple, ScanBarcode, History, BarChart3, Sparkles } from "lucide-react";

export default function HomePage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary shadow-elevated">
            <span className="text-4xl">🥗</span>
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-gradient">NutriScan AI</h1>
            <p className="mt-2 text-muted-foreground">
              Scan any food to get instant nutrition analysis, health ratings, and track your daily intake.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              { icon: <Apple className="h-5 w-5" />, label: "Fresh Food", desc: "Fruits & veggies" },
              { icon: <ScanBarcode className="h-5 w-5" />, label: "Barcode Scan", desc: "Packaged foods" },
              { icon: <History className="h-5 w-5" />, label: "Track Daily", desc: "Log everything" },
              { icon: <BarChart3 className="h-5 w-5" />, label: "Reports", desc: "Weekly insights" },
            ].map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="rounded-xl border border-border bg-card p-3 shadow-soft"
              >
                <div className="text-primary">{f.icon}</div>
                <p className="mt-1.5 font-display text-sm font-semibold text-foreground">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          <Button
            onClick={signInWithGoogle}
            size="lg"
            className="w-full gradient-primary font-display font-semibold text-primary-foreground shadow-elevated hover:opacity-90 transition-opacity"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>
        </motion.div>
      </div>
    );
  }

  // Logged in home
  return (
    <div className="space-y-6 px-4 pb-24 pt-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="font-display text-2xl font-bold text-foreground">
          {user.user_metadata?.full_name || user.email?.split("@")[0]} 👋
        </h1>
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate("/scan?type=fresh")}
          className="rounded-2xl gradient-primary p-5 text-left shadow-elevated"
        >
          <Apple className="h-8 w-8 text-primary-foreground/90" />
          <p className="mt-3 font-display text-lg font-bold text-primary-foreground">Fresh Food</p>
          <p className="text-xs text-primary-foreground/70">Scan fruits & veggies</p>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => navigate("/scan?type=packaged")}
          className="rounded-2xl gradient-scan p-5 text-left shadow-elevated"
        >
          <ScanBarcode className="h-8 w-8 text-primary-foreground/90" />
          <p className="mt-3 font-display text-lg font-bold text-primary-foreground">Packaged</p>
          <p className="text-xs text-primary-foreground/70">Scan barcode or name</p>
        </motion.button>
      </div>

      {/* Quick stats placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-border bg-card p-4 shadow-card"
      >
        <h3 className="font-display text-sm font-semibold text-muted-foreground">Today's Summary</h3>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          {[
            { label: "Calories", value: "—", color: "text-accent" },
            { label: "Protein", value: "—", color: "text-primary" },
            { label: "Carbs", value: "—", color: "text-health-moderate" },
            { label: "Fat", value: "—", color: "text-health-poor" },
          ].map((s) => (
            <div key={s.label}>
              <p className={`font-display text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent scans */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-foreground">Recent Scans</h3>
          <button onClick={() => navigate("/history")} className="text-xs text-primary font-medium">View all</button>
        </div>
        <div className="mt-2 rounded-xl border border-border bg-card p-6 text-center shadow-soft">
          <p className="text-sm text-muted-foreground">Start scanning to see your history here!</p>
        </div>
      </div>
    </div>
  );
}
