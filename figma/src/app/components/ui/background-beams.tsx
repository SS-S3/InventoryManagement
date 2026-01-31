import { cn } from "@/app/components/ui/utils";

export const BackgroundBeams = ({ className }: { className?: string }) => {
  return (
    <div className={cn("fixed inset-0 z-0 pointer-events-none", className)}>
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-black to-black" />
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-full bg-gradient-to-b from-transparent via-violet-500/20 to-transparent animate-pulse"
            style={{
              left: `${(i + 1) * 5}%`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
