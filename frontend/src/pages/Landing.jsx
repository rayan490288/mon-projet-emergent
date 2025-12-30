import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  GraduationCap,
  BookOpen,
  Brain,
  Target,
  FileSearch,
  PenTool,
  ChartBar,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { useEffect } from "react";

const features = [
  {
    icon: BookOpen,
    title: "Révision intelligente",
    description: "Fiches, résumés et exercices adaptés à chaque matière du brevet",
  },
  {
    icon: Brain,
    title: "IA pédagogique",
    description: "Une IA qui explique, guide et s'adapte à ton niveau",
  },
  {
    icon: Target,
    title: "Entraînement ciblé",
    description: "QCM, exercices type brevet et évaluations notées",
  },
  {
    icon: FileSearch,
    title: "Analyse de documents",
    description: "Envoie tes cours (photos, PDF) pour les transformer en fiches",
  },
  {
    icon: PenTool,
    title: "Module dictées",
    description: "Entraîne-toi aux dictées avec correction automatique",
  },
  {
    icon: ChartBar,
    title: "Suivi de progression",
    description: "Visualise tes progrès et identifie tes points à améliorer",
  },
];

const subjects = [
  { name: "Français", color: "bg-rose-500" },
  { name: "Maths", color: "bg-blue-500" },
  { name: "Histoire-Géo", color: "bg-amber-500" },
  { name: "SVT", color: "bg-green-500" },
  { name: "Physique-Chimie", color: "bg-cyan-500" },
  { name: "EMC", color: "bg-purple-500" },
];

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Brevet AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="rounded-full" data-testid="login-btn">
                Connexion
              </Button>
            </Link>
            <Link to="/register">
              <Button className="btn-primary" data-testid="register-btn">
                Commencer
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto max-w-6xl relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Propulsé par l'IA GPT-5.2
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Réussis ton brevet avec{" "}
              <span className="text-gradient">l'intelligence artificielle</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              L'application de révision intelligente qui s'adapte à ton niveau, 
              génère des exercices personnalisés et t'accompagne jusqu'au jour J.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link to="/register">
                <Button size="lg" className="btn-primary text-lg h-14 px-10" data-testid="get-started-btn">
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Pas de carte bancaire requise
              </div>
            </div>

            {/* Subject badges */}
            <div className="flex flex-wrap justify-center gap-2">
              {subjects.map((subject) => (
                <span
                  key={subject.name}
                  className={`px-4 py-2 rounded-full text-white text-sm font-medium ${subject.color}`}
                >
                  {subject.name}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Tout ce qu'il faut pour réussir
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Des outils puissants conçus spécifiquement pour le programme de 3ème
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="card-base p-6 card-interactive group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Prêt à décrocher ton brevet ?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Rejoins des milliers d'élèves qui utilisent Brevet AI pour réviser efficacement.
              </p>
              <Link to="/register">
                <Button size="lg" className="btn-primary text-lg h-14 px-10" data-testid="cta-register-btn">
                  Créer mon compte
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <span className="font-semibold">Brevet AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Brevet AI. Application de révision pour le brevet des collèges.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
