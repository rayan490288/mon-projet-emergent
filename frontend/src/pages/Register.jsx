import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
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
import { GraduationCap, Eye, EyeOff, Loader2 } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    school_type: "college_public",
    academy: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      toast.success("Compte créé avec succès !");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Decoration */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 p-8">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Prépare ton brevet</h2>
          <p className="text-muted-foreground">
            Rejoins des milliers d'élèves qui utilisent l'IA pour réviser efficacement 
            et réussir leur brevet des collèges.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Brevet AI</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Créer un compte</h1>
            <p className="text-muted-foreground">
              Commence à réviser avec l'IA dès maintenant
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Prénom</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ton prénom"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="h-12 rounded-xl"
                data-testid="name-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ton.email@exemple.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="h-12 rounded-xl"
                data-testid="email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 6 caractères"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="h-12 rounded-xl pr-12"
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="school_type">Type d'établissement</Label>
              <Select
                value={formData.school_type}
                onValueChange={(value) => handleChange("school_type", value)}
              >
                <SelectTrigger className="h-12 rounded-xl" data-testid="school-type-select">
                  <SelectValue placeholder="Sélectionne ton établissement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="college_public">Collège public</SelectItem>
                  <SelectItem value="college_prive">Collège privé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="academy">Académie (optionnel)</Label>
              <Input
                id="academy"
                type="text"
                placeholder="Ex: Paris, Lyon, Bordeaux..."
                value={formData.academy}
                onChange={(e) => handleChange("academy", e.target.value)}
                className="h-12 rounded-xl"
                data-testid="academy-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full btn-primary h-12"
              disabled={loading}
              data-testid="register-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer mon compte"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Déjà un compte ?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
