import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/App";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Send,
  Loader2,
  Sparkles,
  Lightbulb,
  MessageCircle,
  Copy,
  Check,
} from "lucide-react";

const subjectOptions = [
  { value: "", label: "Toutes matières" },
  { value: "francais", label: "Français" },
  { value: "mathematiques", label: "Mathématiques" },
  { value: "histoire_geo", label: "Histoire-Géo" },
  { value: "emc", label: "EMC" },
  { value: "svt", label: "SVT" },
  { value: "physique_chimie", label: "Physique-Chimie" },
  { value: "technologie", label: "Technologie" },
  { value: "langues", label: "Langues" },
];

const HelpModule = () => {
  const navigate = useNavigate();
  
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState("");
  const [detailLevel, setDetailLevel] = useState("simple");
  const [guidedMode, setGuidedMode] = useState(false);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);

  const handleSubmit = async () => {
    if (!question.trim()) {
      toast.error("Pose une question pour commencer");
      return;
    }

    setLoading(true);
    
    try {
      const result = await api.post("/ai/help", {
        question: question,
        subject: subject || null,
        detail_level: detailLevel,
        guided_mode: guidedMode,
      });
      
      const newEntry = {
        question: question,
        response: result.data.response,
        guided: guidedMode,
        timestamp: new Date().toISOString(),
      };
      
      setHistory((prev) => [newEntry, ...prev]);
      setResponse(result.data.response);
      setQuestion("");
      toast.success("Réponse générée !");
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
      <div className="max-w-4xl mx-auto space-y-8" data-testid="help-module">
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Aide scolaire IA</h1>
            <p className="text-muted-foreground">Pose tes questions à l'assistant pédagogique</p>
          </div>
        </div>

        {/* Form */}
        <div className="card-base p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="question">Ta question</Label>
            <Textarea
              id="question"
              placeholder="Ex: Comment calculer l'aire d'un triangle ? Qu'est-ce que la photosynthèse ?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[120px] rounded-xl resize-none"
              data-testid="question-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Matière</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="h-12 rounded-xl" data-testid="subject-select">
                  <SelectValue placeholder="Toutes matières" />
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

            <div className="space-y-2">
              <Label>Niveau de détail</Label>
              <Select value={detailLevel} onValueChange={setDetailLevel}>
                <SelectTrigger className="h-12 rounded-xl" data-testid="detail-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="detailed">Détaillé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mode guidé</Label>
              <div className="flex items-center gap-3 h-12 px-4 rounded-xl border bg-background">
                <Switch
                  checked={guidedMode}
                  onCheckedChange={setGuidedMode}
                  data-testid="guided-mode-switch"
                />
                <span className="text-sm text-muted-foreground">
                  {guidedMode ? "Actif" : "Inactif"}
                </span>
              </div>
            </div>
          </div>

          {guidedMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20"
            >
              <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-primary">Mode guidé activé</p>
                <p className="text-muted-foreground">
                  L'IA ne donnera pas la réponse directement. Elle te guidera avec des indices et des questions pour t'aider à trouver toi-même.
                </p>
              </div>
            </motion.div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={loading || !question.trim()}
            className="w-full btn-primary h-12"
            data-testid="submit-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Réflexion en cours...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Poser ma question
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
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-lg">Réponse de l'IA</h2>
              </div>
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

        {/* History */}
        {history.length > 1 && (
          <section>
            <h2 className="font-semibold text-lg mb-4">Historique</h2>
            <div className="space-y-4">
              {history.slice(1).map((entry, index) => (
                <div key={index} className="card-base p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground mt-1" />
                    <p className="font-medium text-sm">{entry.question}</p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{entry.response}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default HelpModule;
