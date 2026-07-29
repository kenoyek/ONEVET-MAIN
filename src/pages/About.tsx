import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ValueCard } from "@/components/about/ValueCard";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import clinicCatExamImage from "@/assets/marketing/clinic-cat-exam.jpg";
import { 
  Heart, 
  Shield, 
  Users, 
  Globe,
  Target,
  Eye,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  Stethoscope,
  Clock,
  Award
} from "lucide-react";

const values = [
  {
    icon: Globe,
    title: "Accessibility",
    description: "Quality vet care should be available to every Nigerian, whether in Lagos or a rural community.",
  },
  {
    icon: Shield,
    title: "Trust & Safety",
    description: "All our veterinarians are licensed and verified. Your pet's health is in safe hands.",
  },
  {
    icon: Heart,
    title: "Nigerian-First",
    description: "Built for Nigeria, by Nigerians. We understand the unique needs of our pet and livestock owners.",
  },
  {
    icon: Award,
    title: "Expert Care",
    description: "Our network includes specialists in companion animals and livestock for comprehensive care.",
  },
];

const stats = [
  { value: "500+", label: "Licensed Vets" },
  { value: "50,000+", label: "Happy Pet Owners" },
  { value: "24/7", label: "Available" },
  { value: "36", label: "States Covered" },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background bg-mesh-gradient">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 lg:py-40 bg-gradient-premium overflow-hidden liquid-bg">
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          </div>

          <div className="container-wide relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <Badge variant="outline" className="mb-6 border-white/30 text-white px-4 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold">
                Our Story
              </Badge>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-primary-foreground mb-8 tracking-tighter heading-safe">
                Bringing premium care to <span className="text-secondary">every home.</span>
              </h1>
              <p className="text-xl md:text-2xl text-primary-foreground/90 font-medium leading-relaxed">
                We're on a mission to make world-class veterinary care accessible, affordable, and available 24/7 across Nigeria.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Our Story */}
        <section className="section-padding">
          <div className="container-wide">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <Badge variant="outline" className="mb-4 border-primary/30 text-primary px-4 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold">The Beginning</Badge>
                <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tight">Our Story</h2>
                <div className="space-y-6 text-muted-foreground text-lg font-medium leading-relaxed">
                  <p>
                    Founded in Port-Harcourt, 1vet was born from a simple observation: getting quality vet care in Nigeria shouldn't be a struggle of logistics and luck.
                  </p>
                  <p>
                    Whether you're managing a commercial poultry farm in Enugu or raising a companion dog in Lagos, your animals deserve expert care. We saw that finding a qualified vet often meant long trips and uncertain wait times.
                  </p>
                  <p className="p-6 rounded-2xl bg-primary/5 border-l-4 border-primary italic text-foreground">
                    "We built 1vet to bridge the gap. By connecting animal owners with licensed veterinarians through technology, we're making quality healthcare just a few taps away."
                  </p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="hidden md:block relative"
              >
                <div className="rounded-[3rem] overflow-hidden shadow-elevated border-8 border-background aspect-[4/3]">
                  <img
                    src={clinicCatExamImage}
                    alt="Veterinarian with animal"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                  />
                </div>
                <div className="absolute -bottom-8 -left-8 p-6 rounded-3xl glass-card shadow-elevated border border-white/20 animate-float">
                  <p className="text-3xl font-black text-primary tracking-tighter">500+</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Licensed Vets</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="section-padding bg-muted/30">
          <div className="container-wide">
            <div className="grid md:grid-cols-2 gap-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card className="h-full glass-card rounded-[3rem] p-10 overflow-hidden group">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 shadow-soft transition-all duration-500 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                    <Target className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-black mb-6 tracking-tight">Our Mission</h3>
                  <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                    To make quality veterinary care accessible to every pet and livestock owner in Nigeria, anytime, anywhere.
                    We believe every animal deserves proper healthcare, and every owner deserves peace of mind.
                  </p>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <Card className="h-full glass-card rounded-[3rem] p-10 overflow-hidden group">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-8 shadow-soft transition-all duration-500 group-hover:scale-110 group-hover:bg-secondary group-hover:text-white">
                    <Eye className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-black mb-6 tracking-tight">Our Vision</h3>
                  <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                    To become Africa's leading digital veterinary platform, empowering animal owners with the tools, knowledge,
                    and professional support they need to keep their animals healthy and thriving.
                  </p>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="section-padding bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="container-wide relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter">1vet by the numbers.</h2>
              <p className="text-primary-foreground/70 text-lg font-medium">
                Growing every day to serve more Nigerian animal owners.
              </p>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-5xl md:text-6xl font-black mb-4 tracking-tighter">{stat.value}</div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-primary-foreground/60">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Placeholder */}
        <section className="section-padding">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary px-4 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold">The Collective</Badge>
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter">Meet our team.</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
                A passionate coalition of veterinarians and technologists working to transform animal care.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {[
                { role: "Leadership", icon: Users, description: "Veterinary and tech professionals who saw a need and built a solution." },
                { role: "Veterinary Council", icon: Stethoscope, description: "500+ licensed experts across Nigeria ready to support your animals." },
                { role: "Operations", icon: Clock, description: "Available 24/7 to ensure seamless platform performance." },
              ].map((team, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full glass-card rounded-[2.5rem] p-8 text-center group hover:-translate-y-2 transition-all duration-500">
                    <div className="w-24 h-24 rounded-[2rem] bg-muted/50 flex items-center justify-center mx-auto mb-8 shadow-soft group-hover:bg-primary group-hover:text-white transition-all duration-500 group-hover:shadow-glow">
                      <team.icon className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black mb-4 tracking-tight">{team.role}</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed">{team.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className="section-padding bg-muted/20 relative overflow-hidden">
          <div className="absolute top-1/2 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -translate-x-1/2" />
          <div className="container-wide relative z-10">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <Badge variant="outline" className="mb-4 border-primary/30 text-primary px-4 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold">Connect</Badge>
                <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tighter">Get in touch.</h2>
                <p className="text-muted-foreground text-lg mb-12 font-medium leading-relaxed">
                  Have inquiries or partnership proposals? Our elite support team is standing by.
                </p>
                <div className="space-y-6">
                  {[
                    { icon: MapPin, label: "Global HQ", value: "Port-Harcourt, Rivers State" },
                    { icon: Mail, label: "Support Email", value: "support@1vet.store" },
                    { icon: Phone, label: "Priority Line", value: "+234 809 800 0355" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-6 group">
                      <div className="w-14 h-14 rounded-2xl bg-card border border-border/50 flex items-center justify-center shadow-soft group-hover:shadow-glow transition-all duration-300">
                        <item.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{item.label}</div>
                        <div className="font-bold text-lg">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <Card className="glass-card rounded-[3rem] p-10 md:p-12 overflow-hidden relative border-primary/10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <CardHeader className="p-0 mb-10">
                    <CardTitle className="text-3xl font-black tracking-tight mb-4">Join the network.</CardTitle>
                    <CardDescription className="text-base font-medium">
                      Whether you're a pet owner, veterinarian, or service provider, there's a place for you at 1vet.
                    </CardDescription>
                  </CardHeader>
                  <div className="flex flex-col gap-4">
                    <Button size="xl" className="w-full rounded-full font-black shadow-glow hover:scale-[1.02] transition-all" asChild>
                      <Link to="/auth">
                        Establish Account <ArrowRight className="ml-2 w-5 h-5" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="xl" className="w-full rounded-full font-black border-2 hover:bg-muted/50 transition-all" asChild>
                      <Link to="/services">Explore Ecosystem</Link>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
