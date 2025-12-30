import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  BookOpen,
  Users,
  Lightbulb,
  HelpCircle,
  Loader2,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";

const requestTypes = [
  { id: "summary", label: "Résumé complet", icon: BookOpen, description: "Intrigue et moments clés" },
  { id: "characters", label: "Personnages", icon: Users, description: "Analyse des personnages" },
  { id: "themes", label: "Thèmes", icon: Lightbulb, description: "Thèmes principaux" },
  { id: "questions", label: "Questions Brevet", icon: HelpCircle, description: "QCM et sujets" },
];

const LiteraryModule = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    genre: "",
    year: "",
  });
  const [requestType, setRequestType] = useState("summary");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.author.trim()) {
      toast.error("Le titre et l'auteur sont obligatoires");
      return;
    }

    setLoading(true);
    setResponse("");
    
    try {
      const result = await api.post("/ai/literary", {
        title: formData.title,
        author: formData.author,
        genre: formData.genre || null,
        year: formData.year || null,
        request_type: requestType,
      });
      setResponse(result.data.response);
      toast.success("Analyse générée !");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'analyse");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    toast.success("Copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8" data-testid="literary-module">
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Œuvres littéraires</h1>
            <p className="text-muted-foreground">Analyse de livres et textes pour le brevet</p>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-600 dark:text-amber-400">Information importante</p>
            <p className="text-muted-foreground">
              L'IA analyse uniquement les œuvres qu'elle connaît. Si des informations sont incertaines, 
              elle le signalera. Aucun contenu n'est inventé.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="card-base p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de l'œuvre *</Label>
              <Input
                id="title"
                placeholder="Ex: Le Père Goriot"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="h-12 rounded-xl"
                data-testid="title-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Auteur *</Label>
              <Input
                id="author"
                placeholder="Ex: Honoré de Balzac"
                value={formData.author}
                onChange={(e) => handleChange("author", e.target.value)}
                className="h-12 rounded-xl"
                data-testid="author-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genre">Genre (optionnel)</Label>
              <Input
                id="genre"
                placeholder="Ex: Roman réaliste"
                value={formData.genre}
                onChange={(e) => handleChange("genre", e.target.value)}
                className="h-12 rounded-xl"
                data-testid="genre-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Année (optionnel)</Label>
              <Input
                id="year"
                placeholder="Ex: 1835"
                value={formData.year}
                onChange={(e) => handleChange("year", e.target.value)}
                className="h-12 rounded-xl"
                data-testid="year-input"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Type d'analyse</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.title.trim() || !formData.author.trim()}
            className="w-full btn-primary h-12"
            data-testid="analyze-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5 mr-2" />
                Analyser l'œuvre
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
              <h2 className="font-semibold text-lg">Analyse</h2>
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

export default LiteraryModule;
