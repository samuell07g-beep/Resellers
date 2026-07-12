import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Package, LogOut, User, Menu, X, MessageCircle } from "lucide-react";
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
        <>
          <Link href="/my-purchases">
            <span
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${location === "/my-purchases" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Package className="w-4 h-4" />
              Compras
            </span>
          </Link>
          <Link href="/support">
            <span
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${location === "/support" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <MessageCircle className="w-4 h-4" />
              Suporte
            </span>
          </Link>
        </>
      )}
      {isAdmin && (
        <Link href="/admin">
          <span
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${location === "/admin" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Admin
          </span>
        </Link>
      )}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 7V5a4 4 0 0 0-8 0v2"/>
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">
              PROXY <span className="text-primary">REVEND</span>
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
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary h-9 px-2 sm:px-3"
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
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-medium">
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
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg">
          <div className="container py-4 flex flex-col gap-4">
            <NavLinks />
            {!isAuthenticated && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="w-full text-xs border-border" onClick={() => setMobileMenuOpen(false)}>
                    Entrar
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="w-full bg-primary text-primary-foreground text-xs font-medium" onClick={() => setMobileMenuOpen(false)}>
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
