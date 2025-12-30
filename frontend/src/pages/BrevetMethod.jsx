import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/App";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
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
  Target,
  Loader2,
  Copy,
  Check,
  BookOpen,
  PenTool,
  Scale,
  Clock,
} from "lucide-react";

const subjectOptions = [
  { value: "francais", label: "Français" },
  { value: "mathematiques", label: "Mathématiques" },
  { value: "histoire_geo", label: "Histoire-Géo" },
  { value: "svt", label: "SVT" },
  { value: "physique_chimie", label: "Physique-Chimie" },
];

const topicTypes = [
  { id: "general", label: "Consignes officielles", icon: Target, description: "Attendus de l'épreuve" },
  { id: "writing", label: "Rédaction structurée", icon: PenTool, description: "Comment rédiger" },
  { id: "justification", label: "Justifier ses réponses", icon: Scale, description: "Argumenter efficacement" },
  { id: "time_management", label: "Gestion du temps", icon: Clock, description: "Optimiser l'épreuve" },
];

const BrevetMethod = () => {
  const navigate = useNavigate();
  
  const [subject, setSubject] = useState("francais");
  const [topic, setTopic] = useState("general");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setResponse("");
    
    try {
      const result = await api.post("/ai/brevet-method", {
        subject: subject,
        topic: topic,
      });
      setResponse(result.data.response);
      toast.success("Méthode générée !");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la génération");
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
      <div className="max-w-4xl mx-auto space-y-8" data-testid="brevet-method">
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Méthode Brevet</h1>
            <p className="text-muted-foreground">Maîtrise les attendus officiels du brevet</p>
          </div>
        </div>

        {/* Glass Card Info */}
        <div className="glass-card rounded-2xl p-6 border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Mode spécial Brevet</h3>
              <p className="text-sm text-muted-foreground">
                Ce module t'explique exactement ce que les correcteurs attendent. 
                Consignes officielles, méthodes de rédaction, critères de notation.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card-base p-6 space-y-6">
          <div className="space-y-2">
            <Label>Matière</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="h-12 rounded-xl" data-testid="subject-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Thème</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {topicTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = topic === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setTopic(type.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid={`topic-${type.id}`}
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
            disabled={loading}
            className="w-full btn-primary h-12"
            data-testid="generate-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5 mr-2" />
                Obtenir les conseils
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
              <h2 className="font-semibold text-lg">Méthode et conseils</h2>
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

export default BrevetMethod;
