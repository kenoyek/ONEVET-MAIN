import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/services/ServiceCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Stethoscope, 
  Scissors, 
  Home, 
  MapPin, 
  GraduationCap, 
  Truck,
  ArrowRight,
  Users,
  Shield,
  Clock
} from "lucide-react";

const services = [
  {
    icon: Stethoscope,
    title: "24/7 Vet Consultations",
    description: "Connect with licensed veterinarians anytime, day or night. Get expert advice for your pets and livestock without leaving home.",
    href: "/consultations/new",
    comingSoon: false,
    color: "primary",
  },
  {
    icon: Scissors,
    title: "Pet Grooming",
    description: "Professional grooming services for dogs, cats, and other pets. Keep your furry friends looking and feeling their best.",
    href: "/services/groomers",
    comingSoon: false,
    color: "secondary",
  },
  {
    icon: Home,
    title: "Pet Sitting & Boarding",
    description: "Trusted care for your pets when you're away. Our verified sitters provide love and attention just like you would.",
    href: "/services/pet-sitting",
    comingSoon: false,
    color: "accent",
  },
  {
    icon: MapPin,
    title: "Vet Clinic Finder",
    description: "Find verified veterinary clinics near you. Read reviews, check availability, and book appointments instantly.",
    href: "/services/vet-clinics",
    comingSoon: false,
    color: "success",
  },
  {
    icon: GraduationCap,
    title: "Pet Training",
    description: "Professional trainers for obedience, behavior correction, and specialized training. From puppies to adult dogs.",
    comingSoon: true,
    color: "primary",
  },
  {
    icon: Truck,
    title: "Pet Transportation",
    description: "Safe and comfortable transportation for your pets. Airport pickups, vet visits, and inter-city moves.",
    comingSoon: true,
    color: "secondary",
  },
];

const faqs = [
  {
    question: "How do online vet consultations work?",
    answer: "Simply create an account, add your pet's profile, and start a new consultation. You'll be connected with a licensed veterinarian who can assess your pet's condition through chat. They'll provide advice, treatment recommendations, and refer you to a physical clinic if needed.",
  },
  {
    question: "Are the veterinarians on 1vet licensed?",
    answer: "Yes! All veterinarians on our platform are fully licensed and verified. We check credentials with the Veterinary Council of Nigeria before they can provide consultations.",
  },
  {
    question: "What pets and animals can I get consultations for?",
    answer: "We support a wide range of animals including dogs, cats, birds, rabbits, fish, and livestock such as cattle, goats, sheep, poultry, pigs, and horses.",
  },
  {
    question: "Is the consultation available 24/7?",
    answer: "Yes! Our platform connects you with available veterinarians around the clock. Response times may vary based on vet availability, but we strive to connect you within minutes.",
  },
  {
    question: "How much does a consultation cost?",
    answer: "We offer flexible subscription plans that give you unlimited access to vet consultations. Check our pricing page for current rates and plans.",
  },
];

const Services = () => {
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
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
                Complete Pet Care Services, All in One Place
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 mb-8">
                From 24/7 vet consultations to grooming and boarding, we've got your furry and feathered friends covered.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="xl" variant="hero" asChild>
                  <Link to="/consultations/new">
                    Start Consultation <ArrowRight className="ml-2" />
                  </Link>
                </Button>
                <Button size="xl" variant="outline-light" asChild>
                  <Link to="/auth">Create Account</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Featured Service */}
        <section className="section-padding bg-muted/30">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-8 md:p-12 shadow-lg border"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full text-sm font-medium mb-4">
                    <Clock className="w-4 h-4" />
                    Available Now
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    24/7 Veterinary Consultations
                  </h2>
                  <p className="text-muted-foreground text-lg mb-6">
                    Speak with a licensed veterinarian in minutes. Day or night, we're here for your pets. 
                    Get expert advice, treatment recommendations, and peace of mind from the comfort of your home.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      "Licensed Nigerian veterinarians",
                      "Average response time under 5 minutes",
                      "Support for pets and livestock",
                      "Prescription recommendations when needed",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button size="lg" asChild>
                    <Link to="/consultations/new">
                      Get Expert Help Now <ArrowRight className="ml-2" />
                    </Link>
                  </Button>
                </div>
                <div className="hidden md:block">
                  <img 
                    src="/placeholder.svg" 
                    alt="Vet consultation" 
                    className="rounded-xl shadow-md w-full h-80 object-cover"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="section-padding">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Everything your pets need, all in one platform. We're constantly expanding our services to better serve Nigerian pet owners.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, index) => (
                <ServiceCard key={index} {...service} />
              ))}
            </div>
          </div>
        </section>

        {/* For Service Providers */}
        <section className="section-padding bg-primary text-primary-foreground">
          <div className="container-wide">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Are You a Veterinarian or Service Provider?
                </h2>
                <p className="text-primary-foreground/80 text-lg mb-8">
                  Join Nigeria's fastest-growing pet care platform. Reach thousands of pet owners looking for quality services like yours.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    "Flexible working hours",
                    "Growing customer base",
                    "Easy payment processing",
                    "Professional dashboard",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Users className="w-5 h-5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button size="lg" variant="hero" asChild>
                  <Link to="/auth?mode=signup&role=provider">
                    Join as Provider <ArrowRight className="ml-2" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="hidden md:block"
              >
                <img 
                  src="/placeholder.svg" 
                  alt="Service providers" 
                  className="rounded-xl shadow-lg w-full h-80 object-cover"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="section-padding">
          <div className="container-tight">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground text-lg">
                Got questions? We've got answers.
              </p>
            </motion.div>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Services;
