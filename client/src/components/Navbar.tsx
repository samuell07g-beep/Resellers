import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, ShoppingBag, Package, LogOut, User, Settings, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, logout, isAdmin, isAuthenticated } = useLocalAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NavLinks = () => (
    <>
      <Link href="/shop">
        <span 
          onClick={() => setMobileMenuOpen(false)}
          className={`text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${location === "/shop" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <ShoppingBag className="w-4 h-4" />
          Loja
        </span>
      </Link>
      {isAuthenticated && (
        <Link href="/my-purchases">
          <span 
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${location === "/my-purchases" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Package className="w-4 h-4" />
            Minhas Compras
          </span>
        </Link>
      )}
      {isAdmin && (
        <Link href="/admin">
          <span 
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${location === "/admin" ? "text-accent neon-text-green" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Settings className="w-4 h-4" />
            Painel Admin
          </span>
        </Link>
      )}
    </>
  );

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

        {/* Desktop Nav links */}
        <div className="hidden md:flex items-center gap-6">
          <NavLinks />
        </div>

        {/* Auth & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground mr-2">
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
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 px-2 sm:px-3"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-1 text-xs sm:text-sm">Sair</span>
              </Button>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs sm:text-sm">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-primary hover:bg-primary/90 neon-purple text-xs sm:text-sm">
                  Cadastrar
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-foreground h-9 w-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/30 bg-background/95 backdrop-blur-lg animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="container py-4 flex flex-col gap-4">
            <NavLinks />
            {!isAuthenticated && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/20">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setMobileMenuOpen(false)}>
                    Entrar
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="w-full bg-primary neon-purple text-xs" onClick={() => setMobileMenuOpen(false)}>
                    Cadastrar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
