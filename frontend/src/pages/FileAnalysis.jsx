import { useState, useRef } from "react";
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
  Upload,
  FileText,
  Image,
  File,
  Loader2,
  Download,
  Copy,
  Check,
  X,
} from "lucide-react";

const analysisTypes = [
  { id: "summary", label: "Résumé", description: "Vue d'ensemble du contenu" },
  { id: "fiche", label: "Fiche de révision", description: "Points clés et définitions" },
  { id: "qcm", label: "QCM", description: "Questions à choix multiples" },
  { id: "evaluation", label: "Évaluation", description: "Contrôle avec barème" },
];

const FileAnalysis = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [analysisType, setAnalysisType] = useState("summary");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Check file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain"];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error("Format non supporté. Utilisez JPG, PNG, WEBP, PDF ou TXT.");
      return;
    }

    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 10 Mo)");
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    setLoading(true);
    setResponse("");

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(",")[1];
        const fileType = file.type.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : "text";

        const result = await api.post("/ai/analyze-file", {
          content: base64,
          file_type: fileType,
          analysis_type: analysisType,
        });

        setResponse(result.data.response);
        toast.success("Analyse terminée !");
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'analyse");
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    toast.success("Copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    try {
      const formData = new FormData();
      formData.append("title", `Analyse - ${file.name}`);
      formData.append("content", response);
      formData.append("pdf_type", analysisType);

      const result = await api.post("/pdf/generate", formData, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([result.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `brevet_ai_analyse_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF téléchargé !");
    } catch (error) {
      toast.error("Erreur lors de l'export PDF");
    }
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
    setResponse("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = () => {
    if (!file) return File;
    if (file.type.startsWith("image/")) return Image;
    if (file.type === "application/pdf") return FileText;
    return File;
  };

  const FileIcon = getFileIcon();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8" data-testid="file-analysis">
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analyse de fichiers</h1>
            <p className="text-muted-foreground">Envoie tes cours pour les transformer en fiches</p>
          </div>
        </div>

        {/* Upload Area */}
        <div className="card-base p-6 space-y-6">
          <div className="space-y-2">
            <Label>Fichier à analyser</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,text/plain"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="file-input"
            />
            
            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium mb-1">Cliquez pour sélectionner un fichier</p>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG, WEBP, PDF ou TXT (max 10 Mo)
                </p>
              </div>
            ) : (
              <div className="border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <FileIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} Ko
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearFile}
                    className="rounded-full"
                    data-testid="clear-file-btn"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                {filePreview && (
                  <div className="mt-4">
                    <img
                      src={filePreview}
                      alt="Aperçu"
                      className="max-h-64 rounded-lg mx-auto"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label>Type d'analyse</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {analysisTypes.map((type) => {
                const isSelected = analysisType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setAnalysisType(type.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid={`type-${type.id}`}
                  >
                    <p className="font-medium text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !file}
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
                <FileText className="w-5 h-5 mr-2" />
                Analyser le fichier
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
              <h2 className="font-semibold text-lg">Résultat de l'analyse</h2>
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

export default FileAnalysis;
