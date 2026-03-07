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
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
  };

  const content = (
    <Card className={`h-full transition-all duration-300 ${!comingSoon ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer' : 'opacity-80'}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className={`w-14 h-14 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-4`}>
            <Icon className="w-7 h-7" />
          </div>
          {comingSoon && <ComingSoonBadge />}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      {!comingSoon && href && (
        <CardContent>
          <div className="flex items-center text-primary font-medium">
            Learn more <ArrowRight className="w-4 h-4 ml-2" />
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
