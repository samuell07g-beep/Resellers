import { useState } from "react";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Minus, Plus, Package, Zap, Loader2, AlertCircle } from "lucide-react";
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
      toast.error("Faça login para comprar");
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
      // Save PIX data to sessionStorage for checkout page
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
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container px-4 md:px-6 py-6 md:py-12">
        <div className="mb-8 md:mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            <span className="text-primary neon-text-purple">Loja</span> de Proxies
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
              <div key={product.id} className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                {/* Product header */}
                <div className="p-4 md:p-6 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg md:text-xl font-bold text-foreground">{product.name}</h2>
                      {product.description && (
                        <p className="text-xs md:text-sm text-muted-foreground truncate">{product.description}</p>
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
                        className={`relative p-4 md:p-5 rounded-xl border transition-all ${
                          isPopular
                            ? "border-primary/60 bg-primary/5"
                            : "border-border/50 bg-background/50 hover:border-primary/30"
                        } ${outOfStock ? "opacity-60" : ""}`}
                      >
                        {isPopular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                            POPULAR
                          </div>
                        )}

                        <div className="text-center mb-3 md:mb-4">
                          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Proxy iOS</div>
                          <div className="text-base md:text-lg font-bold text-foreground">{variant.name}</div>
                          <div className={`text-2xl md:text-3xl font-extrabold mt-2 ${isPopular ? "text-primary neon-text-purple" : "text-foreground"}`}>
                            R$ {variant.price.toFixed(2).replace(".", ",")}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">por key</div>
                        </div>

                        {/* Stock */}
                        <div className={`flex items-center justify-center gap-1.5 text-xs mb-3 md:mb-4 ${outOfStock ? "text-destructive" : "text-accent"}`}>
                          <Package className="w-3.5 h-3.5" />
                          {outOfStock ? "Sem estoque" : `${variant.availableStock} disponíveis`}
                        </div>

                        <Button
                          className={`w-full text-sm md:text-base ${isPopular ? "bg-primary hover:bg-primary/90 neon-purple" : ""}`}
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
          <div className="mt-6 md:mt-8 p-3 md:p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-3">
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

      {/* Checkout Modal */}
      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="bg-card border-border/60 max-w-md w-full mx-4">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Finalizar Compra
            </DialogTitle>
          </DialogHeader>

          {selectedVariant && (
            <div className="space-y-4 md:space-y-5">
              {/* Order summary */}
              <div className="p-3 md:p-4 rounded-xl bg-background/50 border border-border/40">
                <div className="text-xs md:text-sm text-muted-foreground mb-3 font-medium">Resumo do pedido</div>
                <div className="flex justify-between items-center mb-2 gap-2">
                  <span className="text-xs md:text-sm text-foreground truncate">Proxy iOS - {selectedVariant.name}</span>
                  <span className="text-xs md:text-sm text-muted-foreground flex-shrink-0">R$ {selectedVariant.price.toFixed(2).replace(".", ",")}/un</span>
                </div>

                {/* Quantity selector */}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs md:text-sm text-foreground">Quantidade</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8 border-border/60"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-bold text-foreground">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8 border-border/60"
                      onClick={() => setQuantity(q => Math.min(selectedVariant.availableStock, q + 1))}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border/30 mt-3 pt-3 flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-xl font-extrabold text-primary neon-text-purple">
                    R$ {Number(totalPrice).toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>

              {/* Payer info */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs md:text-sm font-medium text-foreground">Nome completo</Label>
                  <Input
                    placeholder="Seu nome completo"
                    value={payerName}
                    onChange={e => setPayerName(e.target.value)}
                    className="bg-input border-border/60 focus:border-primary/60 h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-foreground">CPF</Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={payerDoc}
                    onChange={e => setPayerDoc(formatCPF(e.target.value))}
                    className="bg-input border-border/60 focus:border-primary/60 h-10"
                    maxLength={14}
                  />
                  <p className="text-xs text-muted-foreground">Necessário para geração do PIX</p>
                </div>
              </div>

              <Button
                className="w-full h-11 bg-primary hover:bg-primary/90 neon-purple font-semibold"
                onClick={handleConfirmOrder}
                disabled={checkoutLoading || !payerName || payerDoc.replace(/\D/g, "").length < 11}
              >
                {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {checkoutLoading ? "Gerando PIX..." : "Gerar PIX"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
