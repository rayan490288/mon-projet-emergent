import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/App";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChartBar,
  BookOpen,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

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

const subjectColors = {
  francais: "bg-rose-500",
  mathematiques: "bg-blue-500",
  histoire_geo: "bg-amber-500",
  emc: "bg-purple-500",
  svt: "bg-green-500",
  physique_chimie: "bg-cyan-500",
  technologie: "bg-orange-500",
  langues: "bg-pink-500",
};

const Progress_Page = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          api.get("/progress/stats"),
          api.get("/progress"),
        ]);
        setStats(statsRes.data);
        setHistory(historyRes.data.progress);
      } catch (error) {
        toast.error("Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const subjects = Object.keys(stats?.by_subject || {});

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8" data-testid="progress-page">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="rounded-full"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Ma progression</h1>
            <p className="text-muted-foreground">Suis tes révisions et identifie tes points à améliorer</p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-base p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total_activities || 0}</p>
                <p className="text-sm text-muted-foreground">Activités totales</p>
              </div>
            </div>
          </div>

          <div className="card-base p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{subjects.length}</p>
                <p className="text-sm text-muted-foreground">Matières travaillées</p>
              </div>
            </div>
          </div>

          <div className="card-base p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {history.length > 0
                    ? Math.round(history.filter((h) => h.score).reduce((acc, h) => acc + (h.score || 0), 0) / history.filter((h) => h.score).length || 0)
                    : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Score moyen</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subject Progress */}
        <section>
          <h2 className="text-xl font-bold mb-4">Progression par matière</h2>
          <div className="space-y-4">
            {subjects.length > 0 ? (
              subjects.map((subjectId) => {
                const subjectStats = stats.by_subject[subjectId];
                const maxActivities = Math.max(...subjects.map((s) => stats.by_subject[s]?.total_activities || 0));
                const percentage = maxActivities > 0 ? (subjectStats.total_activities / maxActivities) * 100 : 0;
                
                return (
                  <motion.div
                    key={subjectId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="card-base p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${subjectColors[subjectId] || "bg-gray-500"}`} />
                        <span className="font-medium">{subjectNames[subjectId] || subjectId}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {subjectStats.total_activities} activités
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune activité enregistrée</p>
                <p className="text-sm">Commence à réviser pour voir ta progression !</p>
              </div>
            )}
          </div>
        </section>

        {/* Recurring Errors */}
        {stats?.recurring_errors?.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Points à améliorer
            </h2>
            <div className="card-base p-6">
              <p className="text-sm text-muted-foreground mb-4">
                Ces erreurs reviennent souvent. Travaille-les en priorité !
              </p>
              <div className="space-y-2">
                {stats.recurring_errors.map((error, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/20"
                  >
                    <span className="text-sm font-medium">{error._id}</span>
                    <span className="text-xs text-muted-foreground">{error.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recent Activity */}
        <section>
          <h2 className="text-xl font-bold mb-4">Activité récente</h2>
          <div className="space-y-3">
            {history.slice(0, 10).map((entry, index) => (
              <motion.div
                key={entry.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card-base p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${subjectColors[entry.subject] || "bg-gray-500"}`} />
                    <div>
                      <p className="font-medium text-sm">
                        {subjectNames[entry.subject] || entry.subject} - {entry.activity_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  {entry.score !== null && entry.score !== undefined && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">{entry.score}%</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {history.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucune activité récente</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Progress_Page;
