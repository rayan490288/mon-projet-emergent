import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
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
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  BookOpen,
  Lightbulb,
  AlertTriangle,
  ListChecks,
  Target,
  Loader2,
  Download,
  Copy,
  Check,
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

const requestTypes = [
  { id: "summary", label: "Résumé", icon: FileText, description: "Vue d'ensemble du chapitre" },
  { id: "definitions", label: "Définitions", icon: BookOpen, description: "Termes essentiels" },
  { id: "methods", label: "Méthodes", icon: Lightbulb, description: "Techniques et étapes" },
  { id: "errors", label: "Erreurs fréquentes", icon: AlertTriangle, description: "Pièges à éviter" },
  { id: "exercises", label: "Exercices", icon: ListChecks, description: "Exercices corrigés" },
  { id: "key_points", label: "Points clés Brevet", icon: Target, description: "À retenir absolument" },
];

const RevisionModule = () => {
  const { subjectId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [chapter, setChapter] = useState(searchParams.get("chapter") || "");
  const [requestType, setRequestType] = useState("summary");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const subjectName = subjectNames[subjectId] || subjectId;

  const handleSubmit = async () => {
    if (!chapter.trim()) {
      toast.error("Veuillez indiquer un chapitre");
      return;
    }

    setLoading(true);
    setResponse("");
    
    try {
      const result = await api.post("/ai/revision", {
        subject: subjectId,
        chapter: chapter,
        request_type: requestType,
      });
      setResponse(result.data.response);
      toast.success("Révision générée !");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    toast.success("Copié dans le presse-papiers !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    try {
      const formData = new FormData();
      formData.append("title", `${subjectName} - ${chapter}`);
      formData.append("content", response);
      formData.append("pdf_type", "fiche");

      const result = await api.post("/pdf/generate", formData, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([result.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `brevet_ai_${subjectId}_${Date.now()}.pdf`);
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
      <div className="max-w-4xl mx-auto space-y-8" data-testid="revision-module">
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Révision - {subjectName}</h1>
            <p className="text-muted-foreground">Génère des fiches et contenus de révision</p>
          </div>
        </div>

        {/* Form */}
        <div className="card-base p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="chapter">Chapitre ou thème</Label>
            <Input
              id="chapter"
              placeholder="Ex: Théorème de Pythagore, La Première Guerre mondiale..."
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              className="h-12 rounded-xl"
              data-testid="chapter-input"
            />
          </div>

          <div className="space-y-3">
            <Label>Type de contenu</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {requestTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = requestType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setRequestType(type.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid={`type-${type.id}`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-medium text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !chapter.trim()}
            className="w-full btn-primary h-12"
            data-testid="generate-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              "Générer le contenu"
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
              <h2 className="font-semibold text-lg">Résultat</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="rounded-full"
                  data-testid="copy-btn"
                >
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? "Copié" : "Copier"}
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

export default RevisionModule;
