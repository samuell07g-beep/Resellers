import { useEffect, useState, useCallback } from "react";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Link, useParams, useLocation } from "wouter";
import { CheckCircle, Copy, Clock, Loader2, Key, RefreshCw, ShoppingBag, ShieldCheck, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function Checkout() {
  const { orderId } = useParams<{ orderId: string }>();
  const { isAuthenticated } = useLocalAuth();
  const [, navigate] = useLocation();
  const [polling, setPolling] = useState(true);

  const orderIdNum = parseInt(orderId || "0", 10);

  const { data, refetch, isLoading } = trpc.orders.checkPayment.useQuery(
    { orderId: orderIdNum },
    { enabled: !!orderIdNum && isAuthenticated, refetchInterval: false }
  );

  const sessionPixData = typeof window !== "undefined"
    ? (() => { try { const d = sessionStorage.getItem(`pix_${orderIdNum}`); return d ? JSON.parse(d) : null; } catch { return null; } })()
    : null;

  const backendPixData = data && data.status !== "paid" ? (data as any) : null;
  const pixData = sessionPixData ?? (backendPixData ? {
    qrCodeBase64: backendPixData.qrCodeBase64,
    copyPaste: backendPixData.copyPaste,
    variantName: backendPixData.variantName,
    quantity: backendPixData.quantity,
    totalAmount: backendPixData.totalAmount,
  } : null);

  const checkStatus = useCallback(async () => {
    const result = await refetch();
    if (result.data?.status === "paid") {
      setPolling(false);
      toast.success("Pagamento confirmado! Suas keys foram liberadas.");
    } else if (result.isError) {
      toast.error("Erro ao verificar pagamento. Tente novamente em instantes.");
    }
  }, [refetch]);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!polling || data?.status === "paid") return;
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [polling, data?.status, checkStatus]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copiado!"));
  };

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark-grid">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // ===== PAID — Keys delivered =====
  if (data?.status === "paid") {
    return (
      <div className="min-h-screen bg-background dark-grid">
        <Navbar />
        <div className="container px-4 md:px-6 py-8 md:py-16 max-w-xl mx-auto">
          {/* Success header */}
          <div className="text-center mb-8 animate-entrance">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2 tracking-tight">Pagamento Confirmado</h1>
            <p className="text-sm text-muted-foreground">Suas keys foram liberadas com sucesso. Guarde-as com segurança.</p>
          </div>

          {/* Keys card */}
          <div className="rounded-2xl border border-primary/20 bg-card overflow-hidden mb-6 animate-entrance">
            <div className="p-4 border-b border-border/50 bg-secondary/30 flex items-center gap-3">
              <Key className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">Suas Keys</span>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] text-primary hover:text-foreground hover:bg-primary/10 border border-primary/30"
                  onClick={() => {
                    const allKeys = (data.keys as any[]).map((k: any) => k.keyValue).join("\n");
                    navigator.clipboard.writeText(allKeys).then(() => toast.success("Todas as keys copiadas!"));
                  }}
                >
                  Copiar Todas
                </Button>
                <span className="text-xs text-muted-foreground">{data.keys.length}</span>
              </div>
            </div>
            <div className="p-4 space-y-2.5">
              {(data.keys as any[]).map((key: any, i: number) => (
                <div key={key.id} className="p-3.5 rounded-xl border border-border bg-background/50 group">
                  <div className="flex items-center justify-between mb-2.5 gap-2">
                    <span className="text-xs text-muted-foreground truncate">Key #{i + 1} — {key.variantName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground border border-border flex-shrink-0 font-semibold">
                      {key.days} dias
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono text-primary bg-background/80 px-3 py-2.5 rounded-lg border border-border break-all">
                      {key.keyValue}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 hover:bg-primary/10 hover:text-primary w-8 h-8 opacity-60 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(key.keyValue)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col md:flex-row gap-3">
            <Link href="/my-purchases" className="flex-1">
              <Button variant="outline" className="w-full border-border text-sm h-10">
                <Key className="w-4 h-4 mr-2" />
                Minhas Compras
                <ChevronRight className="w-3.5 h-3.5 ml-auto" />
              </Button>
            </Link>
            <Link href="/shop" className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm h-10 font-medium primary-glow">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Comprar Mais
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ===== PENDING — Waiting for payment =====
  return (
    <div className="min-h-screen bg-background dark-grid">
      <Navbar />
      <div className="container px-4 md:px-6 py-8 md:py-16 max-w-md mx-auto">
        {/* Status header */}
        <div className="text-center mb-8 animate-entrance">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary border border-border mb-4">
            <Clock className="w-6 h-6 text-primary animate-subtle-pulse" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2 tracking-tight">Aguardando Pagamento</h1>
          <p className="text-sm text-muted-foreground">Escaneie o QR Code ou copie o código PIX</p>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden animate-entrance">
          {/* Status bar */}
          <div className="p-4 border-b border-border/50 bg-secondary/30 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-subtle-pulse flex-shrink-0" />
            <span className="text-sm font-medium text-foreground flex-1">Aguardando confirmação...</span>
            {polling && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground flex-shrink-0" />}
          </div>

          <div className="p-5 md:p-6 space-y-5">
            {/* QR Code */}
            <div className="flex flex-col items-center">
              {pixData?.qrCodeBase64 ? (
                <>
                  <div className="p-4 rounded-xl border border-border bg-white">
                    <img
                      src={pixData.qrCodeBase64}
                      alt="QR Code PIX"
                      className="w-40 h-40 md:w-44 md:h-44 object-contain"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Escaneie com o app do seu banco</p>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center w-44 h-44 rounded-xl border border-border bg-muted/20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                  <p className="text-xs text-muted-foreground">Carregando QR Code...</p>
                </div>
              )}
            </div>

            {/* Order summary */}
            {pixData && (
              <div className="rounded-xl border border-border bg-background/50 p-4 space-y-2.5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold">Resumo do pedido</div>
                <div className="flex justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Produto</span>
                  <span className="text-xs text-foreground font-medium truncate text-right">Proxy iOS — {pixData.variantName}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Quantidade</span>
                  <span className="text-xs text-foreground">{pixData.quantity}x</span>
                </div>
                <div className="border-t border-border/50 pt-2.5 flex justify-between gap-3">
                  <span className="text-sm text-muted-foreground font-medium">Total</span>
                  <span className="text-sm font-extrabold text-primary tabular-nums">
                    R$ {Number(pixData.totalAmount).toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            )}

            {/* Pix copy-paste */}
            {pixData?.copyPaste && (
              <div className="space-y-2">
                <div className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold">Código PIX (Copia e Cola)</div>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 rounded-lg bg-background/50 border border-border text-[11px] font-mono text-muted-foreground break-all leading-relaxed line-clamp-3">
                    {pixData.copyPaste}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0 h-10 w-10 border-border hover:border-primary/50 hover:bg-secondary"
                    onClick={() => copyToClipboard(pixData.copyPaste)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Info notice */}
            <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/50 text-xs text-muted-foreground text-center leading-relaxed">
              Após o pagamento, as keys serão liberadas automaticamente em até 30 segundos.
            </div>

            {/* Verify button */}
            <Button
              variant="outline"
              className="w-full border-border hover:border-primary/50 h-10 text-sm"
              onClick={checkStatus}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Verificar Pagamento Agora
            </Button>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-5 tabular-nums">
          Pedido #{orderId} &bull; Verificação automática a cada 5s
        </p>
      </div>
    </div>
  );
}
