import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-none hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90",
        outline: "border border-border bg-card text-foreground hover:bg-muted hover:border-primary/40",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/30 hover:shadow-xl hover:shadow-secondary/40 hover:scale-[1.02] active:scale-[0.98]",
        accent: "bg-accent text-accent-foreground shadow-lg shadow-accent/30 hover:bg-accent/90 hover:shadow-xl",
        "outline-light": "border-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:border-primary-foreground/50",
        glass: "border border-white/35 bg-white/[0.16] text-foreground shadow-soft backdrop-blur-xl backdrop-saturate-150 hover:bg-white/[0.26] hover:shadow-elevated dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15",
        success: "bg-success text-success-foreground shadow-md hover:bg-success/90",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-10 rounded-full px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
