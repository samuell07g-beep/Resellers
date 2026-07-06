import { useState } from "react";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Key, Copy, Package, Calendar, ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function MyPurchases() {
  const { isAuthenticated } = useLocalAuth();
  const [, navigate] = useLocation();
  const { data: keys, isLoading } = trpc.orders.myKeys.useQuery(undefined, { enabled: isAuthenticated });

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Key copiada!"));
  };

  // Group by variant
  const grouped = keys?.reduce((acc: Record<string, any[]>, k: any) => {
    const label = k.variantName || "Outros";
    if (!acc[label]) acc[label] = [];
    acc[label].push(k);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 md:px-6 py-6 md:py-12">
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
              <span className="text-primary neon-text-purple">Minhas</span> Compras
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">Todas as suas keys adquiridas</p>
          </div>
          <Link href="/shop" className="w-full md:w-auto">
            <Button className="w-full md:w-auto bg-primary hover:bg-primary/90 neon-purple text-sm md:text-base">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Comprar Mais
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !keys || keys.length === 0 ? (
          <div className="text-center py-12 md:py-20">
            <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-muted/30 border border-border/40 mb-3 md:mb-4">
              <Package className="w-7 h-7 md:w-8 md:h-8 text-muted-foreground" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">Nenhuma compra ainda</h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">Você ainda não realizou nenhuma compra.</p>
            <Link href="/shop" className="inline-block">
              <Button className="bg-primary hover:bg-primary/90 neon-purple text-sm md:text-base">
                Ver Produtos
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              {[
                { label: "Total", value: keys.length, icon: Key, color: "text-primary" },
                { label: "1 Dia", value: keys.filter((k: any) => k.days === 1).length, icon: Calendar, color: "text-accent" },
                { label: "7 Dias", value: keys.filter((k: any) => k.days === 7).length, icon: Calendar, color: "text-primary" },
                { label: "30 Dias", value: keys.filter((k: any) => k.days === 30).length, icon: Calendar, color: "text-accent" },
              ].map((stat, i) => (
                <div key={i} className="p-3 md:p-4 rounded-xl border border-border/50 bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className={`w-3 h-3 md:w-4 md:h-4 ${stat.color} flex-shrink-0`} />
                    <span className="text-xs text-muted-foreground truncate">{stat.label}</span>
                  </div>
                  <div className={`text-xl md:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Keys list */}
            {grouped && Object.entries(grouped).map(([variantName, variantKeys]) => (
              <div key={variantName} className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                <div className="p-3 md:p-4 border-b border-border/30 bg-primary/5 flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-semibold text-xs md:text-base text-foreground truncate">Proxy iOS — {variantName}</span>
                  <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">{(variantKeys as any[]).length}</span>
                </div>
                <div className="p-3 md:p-4 space-y-2 md:space-y-3">
                  {(variantKeys as any[]).map((key: any, i: number) => (
                    <div key={key.id} className="p-3 rounded-lg border border-border/40 bg-background/50 hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <span className="text-xs text-muted-foreground">Key #{i + 1}</span>
                        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
                            {key.days}d
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(key.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs md:text-sm font-mono text-accent bg-accent/5 px-2 md:px-3 py-2 rounded border border-accent/20 break-all">
                          {key.keyValue}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0 hover:bg-accent/10 hover:text-accent w-8 h-8"
                          onClick={() => copyToClipboard(key.keyValue)}
                          title="Copiar key"
                        >
                          <Copy className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
