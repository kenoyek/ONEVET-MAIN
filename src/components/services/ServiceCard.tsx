import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ComingSoonBadge } from "@/components/shared/ComingSoonBadge";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  comingSoon?: boolean;
  color?: string;
}

export function ServiceCard({ icon: Icon, title, description, href, comingSoon = false, color = "primary" }: ServiceCardProps) {
  const colorClasses: Record<string, string> = {
    primary: "bg-primary text-white",
    secondary: "bg-secondary text-white",
    accent: "bg-accent text-white",
    success: "bg-success text-white",
  };

  const content = (
    <Card className={`h-full group rounded-[2.5rem] p-4 transition-all duration-500 overflow-hidden relative ${!comingSoon ? 'hover:shadow-elevated hover:-translate-y-2 cursor-pointer border-border/50' : 'opacity-60 bg-muted/30 border-dashed grayscale select-none'}`}>
      {!comingSoon && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
      )}
      <CardHeader className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className={`w-16 h-16 rounded-2xl ${colorClasses[color]} flex items-center justify-center shadow-glow transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
            <Icon className="w-8 h-8" />
          </div>
          {comingSoon && (
             <div className="px-3 py-1 rounded-full bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground border border-border/50">Roadmap</div>
          )}
        </div>
        <CardTitle className="text-2xl font-black tracking-tight mb-3 group-hover:text-primary transition-colors">{title}</CardTitle>
        <CardDescription className="text-sm font-medium leading-relaxed text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      {!comingSoon && href && (
        <CardContent className="px-6 pb-6 mt-auto">
          <div className="flex items-center text-xs font-black uppercase tracking-[0.2em] text-primary group-hover:gap-2 transition-all">
            Access Service <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </CardContent>
      )}
    </Card>
  );

  if (comingSoon || !href) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Link to={href}>{content}</Link>
    </motion.div>
  );
}
