interface HealthRatingBadgeProps {
  rating: number;
  size?: "sm" | "md" | "lg";
}

function getRatingColor(rating: number): string {
  if (rating >= 80) return "text-health-excellent";
  if (rating >= 60) return "text-health-good";
  if (rating >= 40) return "text-health-moderate";
  if (rating >= 20) return "text-health-poor";
  return "text-health-bad";
}

function getRatingBg(rating: number): string {
  if (rating >= 80) return "bg-health-excellent/10 border-health-excellent/30";
  if (rating >= 60) return "bg-health-good/10 border-health-good/30";
  if (rating >= 40) return "bg-health-moderate/10 border-health-moderate/30";
  if (rating >= 20) return "bg-health-poor/10 border-health-poor/30";
  return "bg-health-bad/10 border-health-bad/30";
}

function getRatingLabel(rating: number): string {
  if (rating >= 80) return "Excellent";
  if (rating >= 60) return "Good";
  if (rating >= 40) return "Moderate";
  if (rating >= 20) return "Poor";
  return "Unhealthy";
}

const sizeClasses = {
  sm: "h-12 w-12 text-sm",
  md: "h-16 w-16 text-lg",
  lg: "h-24 w-24 text-2xl",
};

export function HealthRatingBadge({ rating, size = "md" }: HealthRatingBadgeProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeClasses[size]} ${getRatingBg(rating)} rounded-full border-2 flex items-center justify-center font-display font-bold ${getRatingColor(rating)}`}
      >
        {rating}
      </div>
      <span className={`text-xs font-medium ${getRatingColor(rating)}`}>
        {getRatingLabel(rating)}
      </span>
    </div>
  );
}
