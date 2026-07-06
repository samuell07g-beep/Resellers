import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, ShoppingBag, Package, LogOut, User, Settings } from "lucide-react";

export default function Navbar() {
  const { user, logout, isAdmin, isAuthenticated } = useLocalAuth();
  const [location] = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center neon-purple group-hover:bg-primary/30 transition-all">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              <span className="text-primary neon-text-purple">Proxy</span>
              <span className="text-foreground"> Revendedores</span>
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/shop">
            <span className={`text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${location === "/shop" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <ShoppingBag className="w-4 h-4" />
              Loja
            </span>
          </Link>
          {isAuthenticated && !isAdmin && (
            <Link href="/my-purchases">
              <span className={`text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${location === "/my-purchases" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <Package className="w-4 h-4" />
                Minhas Compras
              </span>
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin">
              <span className={`text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${location === "/admin" ? "text-accent neon-text-green" : "text-muted-foreground hover:text-foreground"}`}>
                <Settings className="w-4 h-4" />
                Painel Admin
              </span>
            </Link>
          )}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span className="font-medium text-foreground">{user?.username}</span>
                {isAdmin && (
                  <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-accent/20 text-accent border border-accent/30">
                    ADMIN
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Sair</span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-primary hover:bg-primary/90 neon-purple">
                  Cadastrar
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
