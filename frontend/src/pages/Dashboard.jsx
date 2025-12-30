import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, api } from "@/App";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  ArrowRight,
  Brain,
  Target,
  Sparkles,
  Zap,
  Clock,
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
  histoire_geo: "Histoire-Géo",
  emc: "EMC",
  svt: "SVT",
  physique_chimie: "Physique-Chimie",
  technologie: "Technologie",
  langues: "Langues",
};

const quickActions = [
  { label: "Mode Brevet", icon: Target, path: "/brevet-method", color: "from-indigo-500 to-purple-500" },
  { label: "Dictée", icon: Brain, path: "/dictation", color: "from-emerald-500 to-teal-500" },
  { label: "Aide IA", icon: Sparkles, path: "/help", color: "from-amber-500 to-orange-500" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/progress/stats");
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const subjects = Object.keys(subjectNames);

  return (
    <Layout>
      <div className="space-y-8" data-testid="dashboard">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Welcome Card */}
          <div className="lg:col-span-2 card-base p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Clock className="w-4 h-4" />
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                Salut {user?.name} ! 👋
              </h1>
              <p className="text-muted-foreground mb-6">
                Prêt à réviser pour le brevet ? Choisis une matière ou utilise nos outils IA.
              </p>
              <div className="flex flex-wrap gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.label}
                      onClick={() => navigate(action.path)}
                      className={`rounded-full bg-gradient-to-r ${action.color} text-white hover:opacity-90 shadow-lg`}
                      data-testid={`quick-action-${action.path.slice(1)}`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="card-base p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Ta progression</h3>
              <p className="text-3xl font-bold">{stats?.total_activities || 0}</p>
              <p className="text-sm text-muted-foreground">activités réalisées</p>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Objectif hebdo</span>
                <span className="font-medium">{Math.min(stats?.total_activities || 0, 20)}/20</span>
              </div>
              <Progress value={Math.min((stats?.total_activities || 0) * 5, 100)} className="h-2" />
            </div>
            <Button
              variant="ghost"
              className="mt-4 w-full justify-between"
              onClick={() => navigate("/progress")}
              data-testid="view-progress-btn"
            >
              Voir ma progression
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Subjects Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Matières</h2>
            <span className="text-sm text-muted-foreground">{subjects.length} matières disponibles</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {subjects.map((subjectId, index) => {
              const Icon = subjectIcons[subjectId];
              const subjectStats = stats?.by_subject?.[subjectId];
              
              return (
                <motion.div
                  key={subjectId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/subject/${subjectId}`}>
                    <div className="card-base card-interactive p-5 h-full group" data-testid={`subject-card-${subjectId}`}>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${subjectColors[subjectId]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold mb-1">{subjectNames[subjectId]}</h3>
                      <p className="text-sm text-muted-foreground">
                        {subjectStats?.total_activities || 0} activités
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Features Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/literary" className="card-base card-interactive p-6 group" data-testid="literary-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Œuvres littéraires</h3>
                <p className="text-sm text-muted-foreground">Analyse de livres et textes pour le brevet de français</p>
              </div>
            </div>
          </Link>

          <Link to="/file-analysis" className="card-base card-interactive p-6 group" data-testid="file-analysis-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Analyse de fichiers</h3>
                <p className="text-sm text-muted-foreground">Envoie tes cours pour les transformer en fiches</p>
              </div>
            </div>
          </Link>

          <Link to="/help" className="card-base card-interactive p-6 group" data-testid="help-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Aide scolaire IA</h3>
                <p className="text-sm text-muted-foreground">Pose tes questions à l'IA pédagogique</p>
              </div>
            </div>
          </Link>
        </section>
      </div>
    </Layout>
  );
};

export default Dashboard;
