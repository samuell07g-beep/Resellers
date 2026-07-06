import { useEffect, useState, useCallback } from "react";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Link, useParams, useLocation } from "wouter";
import { CheckCircle, Copy, Clock, Loader2, Key, RefreshCw, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

// Store PIX data in session so it persists across polling
const pixCache: Record<number, { qrCodeBase64?: string; copyPaste?: string; variantName?: string; quantity?: number; totalAmount?: string }> = {};

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

  // Retrieve PIX data from sessionStorage (or fallback to backend data)
  const sessionPixData = typeof window !== "undefined"
    ? (() => { try { const d = sessionStorage.getItem(`pix_${orderIdNum}`); return d ? JSON.parse(d) : null; } catch { return null; } })()
    : null;

  // Merge: prefer sessionStorage, fallback to backend data
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Paid - show keys
  if (data?.status === "paid") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-4 md:px-6 py-6 md:py-12 max-w-2xl mx-auto">
          <div className="text-center mb-6 md:mb-8 animate-entrance">
            <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-accent/20 border border-accent/40 neon-green mb-3 md:mb-4">
              <CheckCircle className="w-7 h-7 md:w-8 md:h-8 text-accent" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2">Pagamento Confirmado!</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Suas keys foram liberadas com sucesso.</p>
          </div>

          <div className="rounded-2xl border border-accent/30 bg-card overflow-hidden">
            <div className="p-3 md:p-4 border-b border-border/30 bg-accent/5 flex items-center gap-2">
              <Key className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="font-semibold text-sm md:text-base text-foreground">Suas Keys</span>
              <span className="ml-auto text-xs text-muted-foreground">{data.keys.length}</span>
            </div>
            <div className="p-3 md:p-4 space-y-2 md:space-y-3">
              {(data.keys as any[]).map((key: any, i: number) => (
                <div key={key.id} className="p-3 rounded-lg border border-border/40 bg-background/50">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span className="text-xs text-muted-foreground truncate">Key #{i + 1} — {key.variantName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 flex-shrink-0">
                      {key.days}d
                    </span>
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
                    >
                      <Copy className="w-3 h-3 md:w-4 md:h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 md:mt-6 flex flex-col md:flex-row gap-2 md:gap-3">
            <Link href="/my-purchases" className="flex-1">
              <Button variant="outline" className="w-full border-border/60 text-sm md:text-base">
                <Key className="w-4 h-4 mr-2" />
                Minhas Compras
              </Button>
            </Link>
            <Link href="/shop" className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary/90 neon-purple text-sm md:text-base">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Comprar Mais
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pending - show QR Code
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 md:px-6 py-6 md:py-12 max-w-lg mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2">Aguardando Pagamento</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Escaneie o QR Code ou copie o código PIX para pagar</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          {/* Status bar */}
          <div className="p-3 md:p-4 border-b border-border/30 bg-primary/5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary animate-pulse-glow flex-shrink-0" />
            <span className="text-xs md:text-sm font-medium text-foreground">Aguardando confirmação...</span>
            {polling && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto flex-shrink-0" />}
          </div>

          <div className="p-4 md:p-6 space-y-4 md:space-y-5">
            {/* QR Code */}
            {pixData?.qrCodeBase64 ? (
              <div className="text-center">
                <div className="inline-block p-3 rounded-xl border border-border/40 bg-white">
                  <img
                    src={pixData.qrCodeBase64}
                    alt="QR Code PIX"
                    className="w-40 h-40 md:w-48 md:h-48 object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Escaneie com o app do seu banco</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-40 h-40 md:w-48 md:h-48 rounded-xl border border-border/40 bg-muted/20">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Carregando QR Code...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Order summary */}
            {pixData && (
              <div className="p-3 rounded-lg bg-background/50 border border-border/40 text-xs md:text-sm">
                <div className="flex justify-between mb-1 gap-2">
                  <span className="text-muted-foreground">Produto</span>
                  <span className="text-foreground font-medium truncate">Proxy iOS — {pixData.variantName}</span>
                </div>
                <div className="flex justify-between mb-1 gap-2">
                  <span className="text-muted-foreground">Quantidade</span>
                  <span className="text-foreground">{pixData.quantity}x</span>
                </div>
                <div className="flex justify-between font-bold gap-2">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary neon-text-purple">R$ {Number(pixData.totalAmount).toFixed(2).replace(".", ",")}</span>
                </div>
              </div>
            )}

            {/* Pix copy-paste */}
            {pixData?.copyPaste && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Código PIX (Copia e Cola)</div>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 rounded-lg bg-background/50 border border-border/40 text-xs font-mono text-muted-foreground break-all line-clamp-3">
                    {pixData.copyPaste}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0 h-auto border-border/60 hover:border-primary/50 hover:bg-primary/5 px-3"
                    onClick={() => copyToClipboard(pixData.copyPaste)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20 text-xs text-accent text-center">
              Após o pagamento, as keys serão liberadas automaticamente em até 30 segundos.
            </div>

            <Button
              variant="outline"
              className="w-full border-border/60 hover:border-primary/50"
              onClick={checkStatus}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Verificar Pagamento Agora
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Pedido #{orderId} • Verificação automática a cada 5 segundos
        </p>
      </div>
    </div>
  );
}
