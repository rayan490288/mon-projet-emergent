import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, api } from "@/App";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  User,
  Save,
  Loader2,
  Plus,
  X,
  Brain,
  Target,
  BookOpen,
} from "lucide-react";

const subjects = [
  { value: "francais", label: "Français" },
  { value: "mathematiques", label: "Mathématiques" },
  { value: "histoire_geo", label: "Histoire-Géo" },
  { value: "emc", label: "EMC" },
  { value: "svt", label: "SVT" },
  { value: "physique_chimie", label: "Physique-Chimie" },
  { value: "technologie", label: "Technologie" },
  { value: "langues", label: "Langues" },
];

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    difficulty_level: "medium",
    weak_subjects: [],
    objectives: [],
  });
  const [memory, setMemory] = useState({});
  const [newMemoryKey, setNewMemoryKey] = useState("");
  const [newMemoryValue, setNewMemoryValue] = useState("");

  useEffect(() => {
    if (user?.preferences) {
      setPreferences((prev) => ({ ...prev, ...user.preferences }));
    }
    if (user?.memory) {
      setMemory(user.memory);
    }
  }, [user]);

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      await api.put("/auth/preferences", preferences);
      toast.success("Préférences enregistrées !");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemory = async () => {
    if (!newMemoryKey.trim() || !newMemoryValue.trim()) {
      toast.error("Remplis les deux champs");
      return;
    }

    try {
      await api.put("/auth/memory", {
        key: newMemoryKey,
        value: newMemoryValue,
      });
      setMemory((prev) => ({ ...prev, [newMemoryKey]: newMemoryValue }));
      setNewMemoryKey("");
      setNewMemoryValue("");
      toast.success("Information mémorisée !");
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDeleteMemory = async (key) => {
    try {
      await api.delete(`/auth/memory/${key}`);
      setMemory((prev) => {
        const newMemory = { ...prev };
        delete newMemory[key];
        return newMemory;
      });
      toast.success("Information supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const toggleWeakSubject = (subject) => {
    setPreferences((prev) => ({
      ...prev,
      weak_subjects: prev.weak_subjects?.includes(subject)
        ? prev.weak_subjects.filter((s) => s !== subject)
        : [...(prev.weak_subjects || []), subject],
    }));
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8" data-testid="profile-page">
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mon profil</h1>
            <p className="text-muted-foreground">Personnalise ton expérience</p>
          </div>
        </div>

        {/* User Info */}
        <div className="card-base p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {user?.school_type?.replace("_", " ")} {user?.academy && `- ${user.academy}`}
              </p>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="card-base p-6 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Préférences de révision</h2>
          </div>

          <div className="space-y-2">
            <Label>Niveau de difficulté préféré</Label>
            <Select
              value={preferences.difficulty_level || "medium"}
              onValueChange={(value) =>
                setPreferences((prev) => ({ ...prev, difficulty_level: value }))
              }
            >
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

          <div className="space-y-3">
            <Label>Matières à améliorer</Label>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => {
                const isSelected = preferences.weak_subjects?.includes(subject.value);
                return (
                  <button
                    key={subject.value}
                    onClick={() => toggleWeakSubject(subject.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                    data-testid={`subject-${subject.value}`}
                  >
                    {subject.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={handleSavePreferences}
            disabled={loading}
            className="btn-primary"
            data-testid="save-preferences-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>

        {/* Memory */}
        <div className="card-base p-6 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Mémoire personnalisée</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Ajoute des informations que l'IA doit retenir pour personnaliser tes révisions.
          </p>

          {/* Existing memories */}
          {Object.keys(memory).length > 0 && (
            <div className="space-y-2">
              {Object.entries(memory).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-sm">{key}</p>
                    <p className="text-sm text-muted-foreground">{String(value)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteMemory(key)}
                    className="rounded-full text-destructive hover:bg-destructive/10"
                    data-testid={`delete-memory-${key}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add new memory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Clé (ex: Objectif)"
              value={newMemoryKey}
              onChange={(e) => setNewMemoryKey(e.target.value)}
              className="h-12 rounded-xl"
              data-testid="memory-key-input"
            />
            <Input
              placeholder="Valeur (ex: Avoir 16 au brevet)"
              value={newMemoryValue}
              onChange={(e) => setNewMemoryValue(e.target.value)}
              className="h-12 rounded-xl"
              data-testid="memory-value-input"
            />
          </div>
          <Button
            onClick={handleAddMemory}
            variant="outline"
            className="rounded-full"
            data-testid="add-memory-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
