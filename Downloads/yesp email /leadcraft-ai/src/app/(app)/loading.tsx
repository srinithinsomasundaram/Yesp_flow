import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-700">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 animate-pulse"></div>
        {/* Inner spinning loader */}
        <div className="bg-background/80 p-4 rounded-full shadow-sm border border-border/50 backdrop-blur-sm z-10">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold tracking-tight text-foreground/90">
          Loading Data...
        </h2>
        <p className="text-sm font-medium text-muted-foreground/80">
          Please wait while we fetch the latest information.
        </p>
      </div>
    </div>
  );
}
