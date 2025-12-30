import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calculator,
  Globe,
  Scale,
  Leaf,
  FlaskConical,
  Cpu,
  Languages,
  FileText,
  Brain,
  Target,
  ArrowLeft,
  Lightbulb,
  ListChecks,
  AlertCircle,
  BookMarked,
  GraduationCap,
} from "lucide-react";

const subjectIcons = {
  francais: BookOpen,
  mathematiques: Calculator,
  histoire_geo: Globe,
  emc: Scale,
  svt: Leaf,
  physique_chimie: FlaskConical,
  technologie: Cpu,
  langues: Languages,
};

const subjectColors = {
  francais: "from-rose-500 to-rose-600",
  mathematiques: "from-blue-500 to-blue-600",
  histoire_geo: "from-amber-500 to-amber-600",
  emc: "from-purple-500 to-purple-600",
  svt: "from-green-500 to-green-600",
  physique_chimie: "from-cyan-500 to-cyan-600",
  technologie: "from-orange-500 to-orange-600",
  langues: "from-pink-500 to-pink-600",
};

const subjectNames = {
  francais: "Français",
  mathematiques: "Mathématiques",
  histoire_geo: "Histoire-Géographie",
  emc: "Enseignement Moral et Civique",
  svt: "Sciences de la Vie et de la Terre",
  physique_chimie: "Physique-Chimie",
  technologie: "Technologie",
  langues: "Langues Vivantes",
};

const subjectChapters = {
  francais: ["Grammaire", "Conjugaison", "Orthographe", "Rédaction", "Compréhension de texte", "Figures de style"],
  mathematiques: ["Calcul numérique", "Algèbre", "Géométrie", "Fonctions", "Statistiques", "Probabilités", "Trigonométrie"],
  histoire_geo: ["La Première Guerre mondiale", "La Seconde Guerre mondiale", "La Ve République", "L'Union européenne", "Les espaces productifs", "La France et l'Europe dans le monde"],
  emc: ["La République française", "Les libertés", "La citoyenneté", "La justice", "La défense nationale"],
  svt: ["Le corps humain", "La reproduction", "L'évolution", "La planète Terre", "L'environnement"],
  physique_chimie: ["L'électricité", "La chimie", "L'optique", "La mécanique", "L'énergie"],
  technologie: ["Les objets techniques", "L'informatique", "La programmation", "Les réseaux"],
  langues: ["Grammaire", "Vocabulaire", "Compréhension orale", "Compréhension écrite", "Expression écrite", "Expression orale"],
};

const modules = [
  { id: "revision", label: "Révision", icon: BookMarked, description: "Fiches, résumés et points clés", path: "revision" },
  { id: "training", label: "Entraînement", icon: Target, description: "QCM, exercices et évaluations", path: "training" },
];

const SubjectView = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  
  const Icon = subjectIcons[subjectId] || BookOpen;
  const subjectName = subjectNames[subjectId] || subjectId;
  const chapters = subjectChapters[subjectId] || [];
  const colorClass = subjectColors[subjectId] || "from-gray-500 to-gray-600";

  return (
    <Layout>
      <div className="space-y-8" data-testid={`subject-view-${subjectId}`}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="rounded-full"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{subjectName}</h1>
            <p className="text-muted-foreground">{chapters.length} chapitres disponibles</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map((module, index) => {
            const ModuleIcon = module.icon;
            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/${module.path}/${subjectId}`}>
                  <div className="card-base card-interactive p-6 h-full group" data-testid={`module-${module.id}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg`}>
                        <ModuleIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{module.label}</h3>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Chapters List */}
        <section>
          <h2 className="text-xl font-bold mb-4">Chapitres du programme</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {chapters.map((chapter, index) => (
              <motion.div
                key={chapter}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/revision/${subjectId}?chapter=${encodeURIComponent(chapter)}`}>
                  <div className="card-base card-interactive p-4 group" data-testid={`chapter-${index}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${colorClass}`} />
                      <span className="font-medium group-hover:text-primary transition-colors">{chapter}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Tips Section */}
        <section className="card-base p-6 glass-card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Conseil de révision</h3>
              <p className="text-sm text-muted-foreground">
                Pour bien réviser {subjectName.toLowerCase()}, commence par revoir les définitions et concepts clés de chaque chapitre, 
                puis entraîne-toi avec des exercices progressifs. N'hésite pas à utiliser le mode "Aide guidée" pour apprendre à réfléchir par toi-même.
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default SubjectView;
