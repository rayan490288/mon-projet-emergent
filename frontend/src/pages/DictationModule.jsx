import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/App";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  PenTool,
  Loader2,
  Download,
  CheckCircle,
  XCircle,
  RefreshCw,
  Play,
} from "lucide-react";

const dictationTypes = [
  { id: "classic", label: "Dictée classique" },
  { id: "fill_blanks", label: "Dictée à trous" },
  { id: "prepared", label: "Dictée préparée" },
  { id: "assessment", label: "Dictée bilan" },
];

const DictationModule = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("generate");
  
  // Generate state
  const [dictationType, setDictationType] = useState("classic");
  const [length, setLength] = useState("medium");
  const [difficulty, setDifficulty] = useState("medium");
  const [customText, setCustomText] = useState("");
  const [generatedDictation, setGeneratedDictation] = useState("");
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  
  // Check state
  const [originalText, setOriginalText] = useState("");
  const [studentText, setStudentText] = useState("");
  const [correction, setCorrection] = useState("");
  const [loadingCheck, setLoadingCheck] = useState(false);

  const handleGenerate = async () => {
    setLoadingGenerate(true);
    setGeneratedDictation("");
    
    try {
      const result = await api.post("/ai/dictation/generate", {
        dictation_type: dictationType,
        length: length,
        difficulty: difficulty,
        custom_text: customText || null,
      });
      setGeneratedDictation(result.data.response);
      toast.success("Dictée générée !");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la génération");
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleCheck = async () => {
    if (!originalText.trim() || !studentText.trim()) {
      toast.error("Veuillez remplir les deux champs");
      return;
    }

    setLoadingCheck(true);
    setCorrection("");
    
    try {
      const result = await api.post("/ai/dictation/check", {
        original_text: originalText,
        student_text: studentText,
      });
      setCorrection(result.data.response);
      toast.success("Correction terminée !");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la correction");
    } finally {
      setLoadingCheck(false);
    }
  };

  const handleExportPDF = async (content, title) => {
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("pdf_type", "dictation");

      const result = await api.post("/pdf/generate", formData, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([result.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `brevet_ai_dictee_${Date.now()}.pdf`);
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
      <div className="max-w-4xl mx-auto space-y-8" data-testid="dictation-module">
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Module Dictées</h1>
            <p className="text-muted-foreground">Entraîne-toi aux dictées du brevet</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl">
            <TabsTrigger value="generate" className="rounded-lg" data-testid="tab-generate">
              <PenTool className="w-4 h-4 mr-2" />
              Générer une dictée
            </TabsTrigger>
            <TabsTrigger value="check" className="rounded-lg" data-testid="tab-check">
              <CheckCircle className="w-4 h-4 mr-2" />
              Corriger ma dictée
            </TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-6">
            <div className="card-base p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Type de dictée</Label>
                  <Select value={dictationType} onValueChange={setDictationType}>
                    <SelectTrigger className="h-12 rounded-xl" data-testid="type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dictationTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Longueur</Label>
                  <Select value={length} onValueChange={setLength}>
                    <SelectTrigger className="h-12 rounded-xl" data-testid="length-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Courte (50-80 mots)</SelectItem>
                      <SelectItem value="medium">Moyenne (100-150 mots)</SelectItem>
                      <SelectItem value="long">Longue (200-250 mots)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Difficulté</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="h-12 rounded-xl" data-testid="difficulty-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Facile</SelectItem>
                      <SelectItem value="medium">Intermédiaire</SelectItem>
                      <SelectItem value="hard">Brevet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Texte personnalisé (optionnel)</Label>
                <Textarea
                  placeholder="Collez un texte pour créer une dictée à partir de celui-ci..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="min-h-[100px] rounded-xl"
                  data-testid="custom-text-input"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loadingGenerate}
                className="w-full btn-primary h-12"
                data-testid="generate-btn"
              >
                {loadingGenerate ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Générer la dictée
                  </>
                )}
              </Button>
            </div>

            {generatedDictation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-base p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg">Dictée générée</h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate}
                      className="rounded-full"
                      data-testid="regenerate-btn"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Nouvelle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportPDF(generatedDictation, "Dictée")}
                      className="rounded-full"
                      data-testid="export-pdf-btn"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{generatedDictation}</pre>
                </div>
              </motion.div>
            )}
          </TabsContent>

          {/* Check Tab */}
          <TabsContent value="check" className="space-y-6">
            <div className="card-base p-6 space-y-6">
              <div className="space-y-2">
                <Label>Texte original de la dictée</Label>
                <Textarea
                  placeholder="Collez ici le texte original de la dictée..."
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  className="min-h-[120px] rounded-xl"
                  data-testid="original-text-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Ton texte (ce que tu as écrit)</Label>
                <Textarea
                  placeholder="Écris ou colle ta version de la dictée..."
                  value={studentText}
                  onChange={(e) => setStudentText(e.target.value)}
                  className="min-h-[120px] rounded-xl"
                  data-testid="student-text-input"
                />
              </div>

              <Button
                onClick={handleCheck}
                disabled={loadingCheck || !originalText.trim() || !studentText.trim()}
                className="w-full btn-primary h-12"
                data-testid="check-btn"
              >
                {loadingCheck ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Correction...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Corriger ma dictée
                  </>
                )}
              </Button>
            </div>

            {correction && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-base p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg">Correction</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportPDF(correction, "Correction dictée")}
                    className="rounded-full"
                    data-testid="export-correction-pdf-btn"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{correction}</pre>
                </div>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default DictationModule;
