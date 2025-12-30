import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/App";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  RefreshCw,
  Target,
  ListChecks,
  HelpCircle,
  FileText,
  GraduationCap,
} from "lucide-react";

const subjectNames = {
  francais: "Français",
  mathematiques: "Mathématiques",
  histoire_geo: "Histoire-Géographie",
  emc: "EMC",
  svt: "SVT",
  physique_chimie: "Physique-Chimie",
  technologie: "Technologie",
  langues: "Langues Vivantes",
};

const exerciseTypes = [
  { id: "qcm", label: "QCM", icon: CheckCircle, description: "Questions à choix multiples" },
  { id: "open_questions", label: "Questions ouvertes", icon: HelpCircle, description: "Réponses rédigées" },
  { id: "true_false", label: "Vrai / Faux", icon: ListChecks, description: "Affirmations à valider" },
  { id: "brevet_type", label: "Type Brevet", icon: GraduationCap, description: "Exercice complet" },
  { id: "evaluation", label: "Évaluation /20", icon: FileText, description: "Contrôle noté" },
];

const TrainingModule = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  
  const [chapter, setChapter] = useState("");
  const [exerciseType, setExerciseType] = useState("qcm");
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(5);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const subjectName = subjectNames[subjectId] || subjectId;

  const handleSubmit = async () => {
    setLoading(true);
    setResponse("");
    
    try {
      const result = await api.post("/ai/training", {
        subject: subjectId,
        chapter: chapter || null,
        exercise_type: exerciseType,
        difficulty: difficulty,
        count: count,
      });
      setResponse(result.data.response);
      toast.success("Exercices générés !");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const formData = new FormData();
      formData.append("title", `Entraînement ${subjectName}${chapter ? ` - ${chapter}` : ""}`);
      formData.append("content", response);
      formData.append("pdf_type", "evaluation");

      const result = await api.post("/pdf/generate", formData, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([result.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `brevet_ai_training_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF téléchargé !");
    } catch (error) {
      toast.error("Erreur lors de l'export PDF");
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8" data-testid="training-module">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/subject/${subjectId}`)}
            className="rounded-full"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Entraînement - {subjectName}</h1>
            <p className="text-muted-foreground">Génère des exercices et évaluations</p>
          </div>
        </div>

        {/* Form */}
        <div className="card-base p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="chapter">Chapitre (optionnel)</Label>
            <Input
              id="chapter"
              placeholder="Laisse vide pour un exercice général"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              className="h-12 rounded-xl"
              data-testid="chapter-input"
            />
          </div>

          <div className="space-y-3">
            <Label>Type d'exercice</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {exerciseTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = exerciseType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setExerciseType(type.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid={`type-${type.id}`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-medium text-sm">{type.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Difficulté</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="h-12 rounded-xl" data-testid="difficulty-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Facile</SelectItem>
                  <SelectItem value="medium">Intermédiaire</SelectItem>
                  <SelectItem value="hard">Difficile (Brevet)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(exerciseType === "qcm" || exerciseType === "open_questions" || exerciseType === "true_false") && (
              <div className="space-y-3">
                <Label>Nombre de questions: {count}</Label>
                <Slider
                  value={[count]}
                  onValueChange={(value) => setCount(value[0])}
                  min={3}
                  max={15}
                  step={1}
                  className="py-4"
                  data-testid="count-slider"
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full btn-primary h-12"
            data-testid="generate-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Target className="w-5 h-5 mr-2" />
                Générer les exercices
              </>
            )}
          </Button>
        </div>

        {/* Response */}
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-base p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Exercices</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSubmit}
                  className="rounded-full"
                  data-testid="regenerate-btn"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Régénérer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  className="rounded-full"
                  data-testid="export-pdf-btn"
                >
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </Button>
              </div>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none markdown-content">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{response}</pre>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default TrainingModule;
