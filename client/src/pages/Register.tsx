import { useState } from "react";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const { register, isAuthenticated } = useLocalAuth();
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate("/shop");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !confirm) return;
    if (password !== confirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      await register(username, password);
      toast.success("Conta criada com sucesso!");
      navigate("/shop");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background cyber-grid flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <div className="w-full max-w-md animate-entrance relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 neon-purple mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            <span className="text-primary neon-text-purple">Proxy</span> Revendedores
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Crie sua conta gratuita</p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-foreground">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Escolha um usuário (letras, números e _)"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="bg-input border-border/60 focus:border-primary/60 h-11"
                autoComplete="username"
              />
              <p className="text-xs text-muted-foreground">Mínimo 3 caracteres, apenas letras, números e _</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="bg-input border-border/60 focus:border-primary/60 h-11 pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-sm font-medium text-foreground">Confirmar Senha</Label>
              <Input
                id="confirm"
                type={showPw ? "text" : "password"}
                placeholder="Repita a senha"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="bg-input border-border/60 focus:border-primary/60 h-11"
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 neon-purple font-semibold"
              disabled={loading || !username || !password || !confirm}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? "Criando conta..." : "Criar Conta"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link href="/login">
                <span className="text-primary hover:text-primary/80 font-medium cursor-pointer transition-colors">
                  Entrar
                </span>
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link href="/">
            <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              ← Voltar ao início
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
