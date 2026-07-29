import { Package, PawPrint, Wheat } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageFallbackProps {
  category?: string | null;
  title?: string | null;
  className?: string;
}

export function ProductImageFallback({ category, title, className }: ProductImageFallbackProps) {
  const normalized = category?.toLowerCase() || "";
  const Icon = normalized.includes("livestock") ? Wheat : normalized.includes("pet") ? PawPrint : Package;

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-6",
        className,
      )}
      aria-label={title ? `${title} product image fallback` : "Product image fallback"}
      role="img"
    >
      <div className="relative flex h-full w-full items-center justify-center rounded-[1.25rem] border border-white/45 bg-white/35 shadow-inner backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-secondary/20 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/50 bg-background/70 text-primary shadow-soft">
          <Icon className="h-11 w-11" />
        </div>
      </div>
    </div>
  );
}
