import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ValueCard } from "@/components/about/ValueCard";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative py-20 lg:py-28 bg-gradient-hero overflow-hidden">
          <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
          <div className="container-wide relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
                Bringing Quality Pet & Livestock Care to Every Nigerian Home
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80">
                We're on a mission to make veterinary care accessible, affordable, and available 24/7 across Nigeria.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Our Story */}
        <section className="section-padding">
          <div className="container-wide">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Story</h2>
                <div className="space-y-4 text-muted-foreground text-lg">
                <p>
                    Founded in Port-Harcourt, 1vet was born from a simple observation: getting quality vet care in Nigeria shouldn't be difficult. 
                  </p>
                  <p>
                    Whether you're in Port-Harcourt, Lagos, or a rural community, your animals deserve expert care. But for too many Nigerians, 
                    finding a qualified vet meant long trips, uncertain wait times, and often, arriving too late.
                  </p>
                  <p>
                    We built 1vet to change that. By connecting pet owners and farmers with licensed veterinarians through technology, 
                    we're making quality animal healthcare just a few taps away.
                  </p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="hidden md:block"
              >
                <img 
                  src="/placeholder.svg" 
                  alt="Our story" 
                  className="rounded-xl shadow-lg w-full h-96 object-cover"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="section-padding bg-muted/30">
          <div className="container-wide">
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Our Mission</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-lg">
                      To make quality veterinary care accessible to every pet and livestock owner in Nigeria, anytime, anywhere. 
                      We believe every animal deserves proper healthcare, and every owner deserves peace of mind.
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <Card className="h-full border-l-4 border-l-secondary">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                      <Eye className="w-6 h-6 text-secondary" />
                    </div>
                    <CardTitle className="text-2xl">Our Vision</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-lg">
                      To become Africa's leading digital veterinary platform, empowering animal owners with the tools, knowledge, 
                      and professional support they need to keep their animals healthy and thriving.
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="section-padding">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Core Values</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                These principles guide everything we do at 1vet.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <ValueCard key={index} {...value} delay={index * 0.1} />
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="section-padding bg-primary text-primary-foreground">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">1vet by the Numbers</h2>
              <p className="text-primary-foreground/80 text-lg">
                Growing every day to serve more Nigerian pet and livestock owners.
              </p>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                  <div className="text-primary-foreground/80">{stat.label}</div>
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
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Our Team</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                A passionate team of veterinarians, technologists, and animal lovers working to transform pet care in Nigeria.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { role: "Founders", icon: Users, description: "Veterinary and tech professionals who saw a need and built a solution." },
                { role: "Veterinary Team", icon: Stethoscope, description: "500+ licensed vets across Nigeria ready to help your pets." },
                { role: "Support Team", icon: Clock, description: "Available 24/7 to ensure you get the help you need." },
              ].map((team, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full text-center">
                    <CardHeader>
                      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <team.icon className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <CardTitle>{team.role}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">{team.description}</CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className="section-padding bg-muted/30">
          <div className="container-wide">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Get in Touch</h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Have questions or want to learn more? We'd love to hear from you.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Location</div>
                      <div className="text-muted-foreground">Port-Harcourt, Rivers State</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Email</div>
                      <div className="text-muted-foreground">support@1vet.store</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Phone</div>
                      <div className="text-muted-foreground">+234 809 800 0355</div>
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Join Us</CardTitle>
                    <CardDescription>
                      Whether you're a pet owner, veterinarian, or service provider, there's a place for you at 1vet.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full" size="lg" asChild>
                      <Link to="/auth">
                        Create Account <ArrowRight className="ml-2" />
                      </Link>
                    </Button>
                    <Button className="w-full" size="lg" variant="outline" asChild>
                      <Link to="/services">View Our Services</Link>
                    </Button>
                  </CardContent>
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
