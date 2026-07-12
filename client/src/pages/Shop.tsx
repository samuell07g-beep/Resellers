import { useState } from "react";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Minus, Plus, Package, Zap, Loader2, AlertCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface Variant {
  id: number;
  name: string;
  days: number;
  price: number;
  availableStock: number;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  variants: Variant[];
}

export default function Shop() {
  const { isAuthenticated } = useLocalAuth();
  const [, navigate] = useLocation();
  const { data: products, isLoading } = trpc.products.list.useQuery();
  const createOrder = trpc.orders.create.useMutation();

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [payerName, setPayerName] = useState("");
  const [payerDoc, setPayerDoc] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const totalPrice = selectedVariant ? (selectedVariant.price * quantity).toFixed(2) : "0.00";

  const handleBuy = (variant: Variant) => {
    if (!isAuthenticated) {
      toast.error("Você precisa estar logado para realizar uma compra.");
      navigate("/login");
      return;
    }
    setSelectedVariant(variant);
    setQuantity(1);
    setShowCheckoutModal(true);
  };

  const handleConfirmOrder = async () => {
    if (!selectedVariant || !payerName || !payerDoc) return;
    const cleanDoc = payerDoc.replace(/\D/g, "");
    if (cleanDoc.length < 11) {
      toast.error("CPF inválido");
      return;
    }
    setCheckoutLoading(true);
    try {
      const result = await createOrder.mutateAsync({
        variantId: selectedVariant.id,
        quantity,
        payerName,
        payerDocument: cleanDoc,
      });
      sessionStorage.setItem(`pix_${result.orderId}`, JSON.stringify({
        qrCodeBase64: result.qrCodeBase64,
        copyPaste: result.copyPaste,
        variantName: result.variantName,
        quantity: result.quantity,
        totalAmount: result.totalAmount,
      }));
      setShowCheckoutModal(false);
      navigate(`/checkout/${result.orderId}`);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar pedido");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatCPF = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
      .replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3")
      .replace(/(\d{3})(\d{3})/, "$1.$2");
  };

  return (
    <div className="min-h-screen bg-background dark-grid">
      <Navbar />

      <div className="container px-4 md:px-6 py-8 md:py-14">
        <div className="mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">
            Loja de <span className="text-primary">Proxies</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Escolha o plano ideal e ative instantaneamente após o pagamento.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 md:space-y-10">
            {(products as Product[] | undefined)?.map(product => (
              <div key={product.id} className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
                {/* Product header */}
                <div className="p-5 md:p-7 border-b border-border/50 bg-secondary/30">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg md:text-xl font-bold text-foreground tracking-tight">{product.name}</h2>
                      {product.description && (
                        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{product.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Variants */}
                <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                  {product.variants.map((variant, i) => {
                    const isPopular = i === 1;
                    const outOfStock = variant.availableStock === 0;
                    return (
                      <div
                        key={variant.id}
                        className={`relative p-5 md:p-6 rounded-xl border transition-all duration-200 ${
                          isPopular
                            ? "border-primary/50 bg-secondary/60"
                            : "border-border bg-background/60 hover:border-primary/30"
                        } ${outOfStock ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        {isPopular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                            Popular
                          </div>
                        )}

                        <div className="text-center mb-4 md:mb-5">
                          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] mb-1.5">Proxy iOS</div>
                          <div className="text-sm md:text-base font-semibold text-foreground">{variant.name}</div>
                          <div className={`text-2xl md:text-3xl font-extrabold mt-2 tracking-tight ${isPopular ? "text-primary" : "text-foreground"}`}>
                            R$ {variant.price.toFixed(2).replace(".", ",")}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">por key</div>
                        </div>

                        {/* Stock */}
                        <div className={`flex items-center justify-center gap-1.5 text-xs mb-4 md:mb-5 ${outOfStock ? "text-destructive" : "text-muted-foreground"}`}>
                          <Package className="w-3.5 h-3.5" />
                          {outOfStock ? "Sem estoque" : `${variant.availableStock} disponíveis`}
                        </div>

                        <Button
                          className={`w-full text-sm h-10 ${isPopular ? "bg-primary hover:bg-primary/90 text-primary-foreground primary-glow" : ""}`}
                          variant={isPopular ? "default" : "outline"}
                          disabled={outOfStock}
                          onClick={() => handleBuy(variant)}
                        >
                          {outOfStock ? "Indisponível" : "Comprar"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isAuthenticated && (
          <div className="mt-6 md:mt-8 p-4 rounded-xl border border-border bg-card/60 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-xs md:text-sm text-foreground">
              <Link href="/login"><span className="text-primary font-medium cursor-pointer hover:underline">Faça login</span></Link>
              {" "}ou{" "}
              <Link href="/register"><span className="text-primary font-medium cursor-pointer hover:underline">crie uma conta</span></Link>
              {" "}para realizar uma compra.
            </p>
          </div>
        )}
      </div>

      {/* Checkout Modal — Premium centered design */}
      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="bg-card border-border max-w-[420px] w-full mx-4 p-0 overflow-hidden rounded-2xl" showCloseButton={true}>
          {/* Modal header */}
          <div className="px-6 pt-6 pb-4 border-b border-border/50 bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground tracking-tight">Finalizar Compra</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Preencha os dados para gerar o pagamento PIX</p>
              </div>
            </div>
          </div>

          {selectedVariant && (
            <div className="px-6 py-5 space-y-5">
              {/* Order summary card */}
              <div className="rounded-xl border border-border bg-background/60 p-4 space-y-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold">Resumo do pedido</div>
                
                <div className="flex justify-between items-center gap-3">
                  <span className="text-sm text-foreground font-medium truncate">Proxy iOS — {selectedVariant.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">R$ {selectedVariant.price.toFixed(2).replace(".", ",")}/un</span>
                </div>

                {/* Quantity selector */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Quantidade</span>
                  <div className="flex items-center gap-0 border border-border rounded-lg overflow-hidden">
                    <button
                      className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 h-9 flex items-center justify-center text-sm font-bold text-foreground border-x border-border bg-background/40 tabular-nums">
                      {quantity}
                    </span>
                    <button
                      className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                      onClick={() => setQuantity(q => Math.min(Math.min(selectedVariant.availableStock, 50), q + 1))}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-3 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground font-medium">Total</span>
                  <span className="text-xl font-extrabold text-primary tracking-tight">
                    R$ {Number(totalPrice).toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>

              {/* Payer info */}
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">Nome completo</Label>
                  <Input
                    placeholder="Seu nome completo"
                    value={payerName}
                    onChange={e => setPayerName(e.target.value)}
                    className="bg-input border-border focus:border-primary/60 h-10 text-sm rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">CPF</Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={payerDoc}
                    onChange={e => setPayerDoc(formatCPF(e.target.value))}
                    className="bg-input border-border focus:border-primary/60 h-10 text-sm rounded-lg"
                    maxLength={14}
                  />
                  <p className="text-[11px] text-muted-foreground">Necessário para geração do PIX</p>
                </div>
              </div>

              {/* CTA */}
              <Button
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm primary-glow transition-all"
                onClick={handleConfirmOrder}
                disabled={checkoutLoading || !payerName.trim() || payerDoc.replace(/\D/g, "").length < 11}
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Gerando PIX...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Gerar PIX
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
