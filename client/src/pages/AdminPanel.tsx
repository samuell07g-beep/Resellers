import { useState, useEffect } from "react";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import {
  Settings, Package, Users, ShoppingBag, Key, Plus, ChevronDown, ChevronRight,
  Loader2, Copy, RefreshCw, TrendingUp, Menu, X, MessageSquare, Send, Trash2
} from "lucide-react";
import { toast } from "sonner";

type AdminTab = "overview" | "stock" | "users" | "orders" | "tickets";

export default function AdminPanel() {
  const { isAuthenticated, isAdmin } = useLocalAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [expandedTicket, setExpandedTicket] = useState<number | null>(null);
  const [adminReply, setAdminReply] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Stock management
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [keysText, setKeysText] = useState("");
  const [newPrice, setNewPrice] = useState("");

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { data: stock, refetch: refetchStock } = trpc.stock.getAll.useQuery(undefined, { enabled: isAdmin });
  const { data: users, refetch: refetchUsers } = trpc.admin.users.useQuery(undefined, { enabled: isAdmin });
  const { data: allOrders, refetch: refetchOrders } = trpc.admin.allOrders.useQuery(undefined, { enabled: isAdmin });
  const { data: allTickets, refetch: refetchTickets } = trpc.admin.allTickets.useQuery(undefined, { enabled: isAdmin });

  const addKeysMutation = trpc.stock.addKeys.useMutation();
  const updatePriceMutation = trpc.stock.updatePrice.useMutation();
  const clearStockMutation = trpc.stock.clearStock.useMutation();
  const closeTicketMutation = trpc.admin.closeTicket.useMutation();
  const deleteTicketMutation = trpc.admin.deleteTicket.useMutation();
  const sendReplyMutation = trpc.support.sendMessage.useMutation();
  const { data: ticketMessages, refetch: refetchMessages } = trpc.support.getMessages.useQuery({ ticketId: expandedTicket! }, { enabled: !!expandedTicket });

  // User detail queries
  const { data: userKeys } = trpc.admin.userKeys.useQuery(
    { userId: expandedUser! },
    { enabled: !!expandedUser && isAdmin }
  );
  const { data: orderKeys } = trpc.admin.orderKeys.useQuery(
    { orderId: expandedOrder! },
    { enabled: !!expandedOrder && isAdmin }
  );

  if (!isAuthenticated || !isAdmin) {
    navigate("/login");
    return null;
  }

  const handleAddKeys = async () => {
    if (!selectedVariantId || !keysText.trim()) {
      toast.error("Selecione uma variação e adicione keys");
      return;
    }
    try {
      const result = await addKeysMutation.mutateAsync({ variantId: selectedVariantId, keysText });
      toast.success(`${result.added} key(s) adicionada(s) ao estoque!`);
      setKeysText("");
      setSelectedVariantId(null);
      refetchStock();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao adicionar keys");
    }
  };

  const handleUpdatePrice = async (variantId: number) => {
    if (!newPrice) {
      toast.error("Digite um preço válido");
      return;
    }
    try {
      await updatePriceMutation.mutateAsync({ variantId, price: newPrice });
      toast.success("Preço atualizado!");
      setNewPrice("");
      refetchStock();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar preço");
    }
  };

  const handleClearStock = async (variantId: number) => {
    if (!confirm("Tem certeza que deseja limpar TODO o estoque desta variação? Esta ação não pode ser desfeita.")) return;
    try {
      await clearStockMutation.mutateAsync({ variantId });
      toast.success("Estoque limpo com sucesso!");
      refetchStock();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao limpar estoque");
    }
  };

  const handleAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReply.trim() || !expandedTicket) return;
    try {
      await sendReplyMutation.mutateAsync({ ticketId: expandedTicket, message: adminReply });
      setAdminReply("");
      refetchMessages();
    } catch (err: any) {
      toast.error(err.message || "Erro ao responder");
    }
  };

  const handleCloseTicket = async (ticketId: number) => {
    try {
      await closeTicketMutation.mutateAsync({ ticketId });
      toast.success("Ticket fechado!");
      refetchTickets();
    } catch (err: any) {
      toast.error(err.message || "Erro ao fechar");
    }
  };

  const handleDeleteTicket = async (ticketId: number) => {
    if (!confirm("Excluir este ticket permanentemente?")) return;
    try {
      await deleteTicketMutation.mutateAsync({ ticketId });
      toast.success("Ticket excluído!");
      setExpandedTicket(null);
      refetchTickets();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copiado!"));
  };

  const menuItems = [
    { id: "overview" as AdminTab, label: "Visão Geral", icon: TrendingUp },
    { id: "stock" as AdminTab, label: "Estoque", icon: Package },
    { id: "users" as AdminTab, label: "Usuários", icon: Users },
    { id: "orders" as AdminTab, label: "Pedidos", icon: ShoppingBag },
    { id: "tickets" as AdminTab, label: "Suporte", icon: MessageSquare },
  ];

  const totalStock = stock?.reduce((acc: number, v: any) => acc + v.availableCount, 0) ?? 0;
  const totalSold = stock?.reduce((acc: number, v: any) => acc + (v.totalCount - v.availableCount), 0) ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${
            isMobile
              ? sidebarOpen
                ? "fixed inset-0 top-16 z-40 w-full"
                : "hidden"
              : "w-64"
          } border-r border-border/50 bg-card transition-all duration-300 overflow-y-auto flex flex-col`}
        >
          <div className="p-4 border-b border-border/30">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5 text-accent" />
              Admin
            </h2>
          </div>

          <nav className="flex-1 p-3 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (isMobile) setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {isMobile && (
            <div className="p-3 border-t border-border/30">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-3 h-3 mr-1" />
                Fechar
              </Button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Mobile header with menu button */}
          {isMobile && (
            <div className="sticky top-0 z-30 bg-card border-b border-border/50 p-3 flex items-center justify-between">
              <h1 className="text-lg font-bold text-foreground">
                {menuItems.find((m) => m.id === activeTab)?.label}
              </h1>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50"
              >
                <Menu className="w-5 h-5 text-foreground" />
              </button>
            </div>
          )}

          <div className={`${isMobile ? "p-3" : "p-6"} container mx-auto`}>
            {/* Desktop header */}
            {!isMobile && (
              <div className="mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {menuItems.find((m) => m.id === activeTab)?.label}
                  </h1>
                  <p className="text-sm text-muted-foreground">Gerencie seu estoque e operações</p>
                </div>
              </div>
            )}

            {/* Overview */}
            {activeTab === "overview" && (
              <div className="space-y-4 animate-entrance">
                <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-4"} gap-2 md:gap-4`}>
                  {[
                    { label: "Keys Disponíveis", value: totalStock, icon: Package, color: "text-accent" },
                    { label: "Keys Vendidas", value: totalSold, icon: Key, color: "text-primary" },
                    { label: "Usuários", value: users?.length ?? 0, icon: Users, color: "text-primary" },
                    { label: "Pedidos", value: allOrders?.length ?? 0, icon: ShoppingBag, color: "text-accent" },
                  ].map((stat, i) => (
                    <div key={i} className="p-3 md:p-5 rounded-xl border border-border/50 bg-muted/20">
                      <div className="flex items-center gap-2 mb-2">
                        <stat.icon className={`w-3 h-3 md:w-4 md:h-4 ${stat.color}`} />
                        <span className="text-xs md:text-sm text-muted-foreground line-clamp-2">{stat.label}</span>
                      </div>
                      <div className={`text-2xl md:text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Stock summary */}
                <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                  <div className="p-3 md:p-4 border-b border-border/30 flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground text-sm md:text-base">Estoque por Variação</span>
                  </div>
                  <div className={`p-3 md:p-4 grid ${isMobile ? "grid-cols-1" : "grid-cols-3"} gap-3 md:gap-4`}>
                    {stock?.map((v: any) => (
                      <div key={v.id} className="p-3 rounded-xl border border-border/40 bg-background/50">
                        <div className="font-medium text-foreground text-sm md:text-base mb-1">{v.name}</div>
                        <div className="text-xs text-muted-foreground mb-3">R$ {Number(v.price).toFixed(2).replace(".", ",")}</div>
                        <div className="flex justify-between text-xs md:text-sm">
                          <span className="text-muted-foreground">Disponíveis:</span>
                          <span className={`font-bold ${v.availableCount === 0 ? "text-destructive" : "text-accent"}`}>
                            {v.availableCount}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs md:text-sm mt-1">
                          <span className="text-muted-foreground">Total:</span>
                          <span className="font-medium text-foreground">{v.totalCount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Stock Management */}
            {activeTab === "stock" && (
              <div className="space-y-4 animate-entrance">
                {/* Add keys form */}
                <div className="rounded-2xl border border-primary/50 bg-primary/5 p-4 md:p-6">
                  <h3 className="font-bold text-base md:text-lg text-foreground mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    Adicionar Keys
                  </h3>

                  <div className="space-y-4">
                    {/* Variant selector */}
                    <div>
                      <Label className="text-xs md:text-sm font-medium text-foreground mb-2 block">Selecione a Variação</Label>
                      <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-3"} gap-2 md:gap-3`}>
                        {stock?.map((v: any) => (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVariantId(selectedVariantId === v.id ? null : v.id)}
                            className={`p-3 md:p-4 rounded-lg border-2 transition-all text-left text-sm md:text-base ${
                              selectedVariantId === v.id
                                ? "border-primary bg-primary/10"
                                : "border-border/40 bg-background/50 hover:border-primary/30"
                            }`}
                          >
                            <div className="font-semibold text-foreground">{v.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">R$ {Number(v.price).toFixed(2).replace(".", ",")}</div>
                            <div className="text-xs text-accent mt-2 font-medium">
                              {v.availableCount} disponíveis
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Keys textarea */}
                    <div>
                      <Label className="text-xs md:text-sm font-medium text-foreground mb-2 block">
                        Cole as Keys (uma por linha)
                      </Label>
                      <Textarea
                        placeholder={"key1\nkey2\nkey3\n..."}
                        value={keysText}
                        onChange={(e) => setKeysText(e.target.value)}
                        className="bg-input border-border/60 focus:border-primary/60 font-mono text-xs md:text-sm min-h-[150px] md:min-h-[200px]"
                      />
                      <div className="text-xs text-muted-foreground mt-2">
                        {keysText.split("\n").filter((k) => k.trim()).length} key(s) detectada(s)
                      </div>
                    </div>

                    {/* Submit button */}
                    <Button
                      onClick={handleAddKeys}
                      disabled={addKeysMutation.isPending || !selectedVariantId || !keysText.trim()}
                      className="w-full bg-primary hover:bg-primary/90 neon-purple h-10 md:h-12 text-sm md:text-base font-semibold"
                    >
                      {addKeysMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Adicionando...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Keys
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Price management */}
                <div className="rounded-2xl border border-border/50 bg-card p-4 md:p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm md:text-base">
                    <Settings className="w-4 h-4 text-accent" />
                    Gerenciar Preços
                  </h3>
                  <div className="space-y-2 md:space-y-3">
                    {stock?.map((v: any) => (
                      <div key={v.id} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 p-3 rounded-lg border border-border/40 bg-background/50">
                        <span className="flex-1 text-xs md:text-sm font-medium text-foreground">{v.name}</span>
                        <span className="text-xs md:text-sm text-muted-foreground">R$ {Number(v.price).toFixed(2).replace(".", ",")}</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Novo preço"
                          className="w-full md:w-28 h-8 bg-input border-border/60 text-xs md:text-sm"
                          onFocus={() => setNewPrice("")}
                          onChange={(e) => setNewPrice(e.target.value)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-accent/40 text-accent hover:bg-accent/10 w-full md:w-auto text-xs md:text-sm"
                          onClick={() => handleUpdatePrice(v.id)}
                          disabled={updatePriceMutation.isPending}
                        >
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full md:w-auto text-xs md:text-sm"
                          onClick={() => handleClearStock(v.id)}
                          disabled={clearStockMutation.isPending}
                        >
                          Limpar Estoque
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Users */}
            {activeTab === "users" && (
              <div className="space-y-3 animate-entrance">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs md:text-sm text-muted-foreground font-medium">{users?.length ?? 0} usuário(s)</span>
                  <Button variant="ghost" size="sm" onClick={() => refetchUsers()} className="text-muted-foreground text-xs md:text-sm">
                    <RefreshCw className="w-3 h-3 md:w-4 md:h-4 mr-1" /> Atualizar
                  </Button>
                </div>
                {users?.map((user: any) => (
                  <div key={user.id} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                    <button
                      className="w-full p-3 md:p-4 flex items-center gap-3 hover:bg-muted/20 transition-colors text-left"
                      onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {user.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground text-sm md:text-base truncate">{user.username}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${user.role === "admin" ? "bg-accent/20 text-accent border-accent/30" : "bg-muted/30 text-muted-foreground border-border/40"}`}>
                        {user.role}
                      </span>
                      {expandedUser === user.id ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                    </button>

                    {expandedUser === user.id && (
                      <div className="border-t border-border/30 p-3 md:p-4 bg-background/30">
                        <div className="mb-3 flex items-center gap-2">
                          <Key className="w-4 h-4 text-primary" />
                          <span className="text-xs md:text-sm font-medium text-foreground">Keys ({userKeys?.length ?? 0})</span>
                        </div>
                        {!userKeys || userKeys.length === 0 ? (
                          <p className="text-xs md:text-sm text-muted-foreground">Nenhuma key adquirida.</p>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {userKeys.map((key: any) => (
                              <div key={key.id} className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border/40">
                                <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 flex-shrink-0">
                                  {key.variantName}
                                </span>
                                <code className="flex-1 text-xs font-mono text-muted-foreground truncate">{key.keyValue}</code>
                                <Button variant="ghost" size="icon" className="w-6 h-6 flex-shrink-0" onClick={() => copyToClipboard(key.keyValue)}>
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Orders */}
            {activeTab === "orders" && (
              <div className="space-y-3 animate-entrance">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs md:text-sm text-muted-foreground font-medium">{allOrders?.length ?? 0} pedido(s)</span>
                  <Button variant="ghost" size="sm" onClick={() => refetchOrders()} className="text-muted-foreground text-xs md:text-sm">
                    <RefreshCw className="w-3 h-3 md:w-4 md:h-4 mr-1" /> Atualizar
                  </Button>
                </div>
                {allOrders?.map((order: any) => (
                  <div key={order.id} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                    <button
                      className="w-full p-3 md:p-4 flex items-center gap-3 hover:bg-muted/20 transition-colors text-left"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${order.status === "paid" ? "bg-accent" : order.status === "pending" ? "bg-yellow-500" : "bg-destructive"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground text-sm md:text-base">Pedido #{order.id}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-foreground text-sm md:text-base">R$ {Number(order.totalAmount).toFixed(2).replace(".", ",")}</div>
                        <div className={`text-xs ${order.status === "paid" ? "text-accent" : order.status === "pending" ? "text-yellow-500" : "text-destructive"}`}>
                          {order.status === "paid" ? "Pago" : order.status === "pending" ? "Pendente" : "Falhou"}
                        </div>
                      </div>
                      {expandedOrder === order.id ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                    </button>

                    {expandedOrder === order.id && (
                      <div className="border-t border-border/30 p-3 md:p-4 bg-background/30">
                        <div className="mb-3 flex items-center gap-2">
                          <Key className="w-4 h-4 text-primary" />
                          <span className="text-xs md:text-sm font-medium text-foreground">Keys ({orderKeys?.length ?? 0})</span>
                        </div>
                        {!orderKeys || orderKeys.length === 0 ? (
                          <p className="text-xs md:text-sm text-muted-foreground">{order.status === "pending" ? "Aguardando pagamento." : "Nenhuma key liberada."}</p>
                        ) : (
                          <div className="space-y-2">
                            {orderKeys.map((key: any) => (
                              <div key={key.id} className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border/40">
                                <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 flex-shrink-0">
                                  {key.variantName}
                                </span>
                                <code className="flex-1 text-xs font-mono text-muted-foreground truncate">{key.keyValue}</code>
                                <Button variant="ghost" size="icon" className="w-6 h-6 flex-shrink-0" onClick={() => copyToClipboard(key.keyValue)}>
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Support Tickets */}
            {activeTab === "tickets" && (
              <div className="space-y-3 animate-entrance">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs md:text-sm text-muted-foreground font-medium">{allTickets?.length ?? 0} ticket(s)</span>
                  <Button variant="ghost" size="sm" onClick={() => refetchTickets()} className="text-muted-foreground text-xs md:text-sm">
                    <RefreshCw className="w-3 h-3 md:w-4 md:h-4 mr-1" /> Atualizar
                  </Button>
                </div>
                {allTickets?.map((ticket: any) => (
                  <div key={ticket.id} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                    <div
                      className="w-full p-3 md:p-4 flex items-center gap-3 hover:bg-muted/20 transition-colors text-left cursor-pointer"
                      onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ticket.status === "open" ? "bg-accent" : "bg-muted"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground text-sm md:text-base truncate">{ticket.subject}</div>
                        <div className="text-xs text-muted-foreground">
                          De: <span className="font-bold text-primary">{ticket.username}</span> • {new Date(ticket.updatedAt).toLocaleString("pt-BR")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={(e) => { e.stopPropagation(); handleDeleteTicket(ticket.id); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {expandedTicket === ticket.id ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                      </div>
                    </div>

                    {expandedTicket === ticket.id && (
                      <div className="border-t border-border/30 p-3 md:p-4 bg-background/30 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground uppercase tracking-wider">Histórico do Chat</span>
                          {ticket.status === "open" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleCloseTicket(ticket.id)}>
                              Fechar Ticket
                            </Button>
                          )}
                        </div>
                        
                        <div className="space-y-3 max-h-60 overflow-y-auto p-2 bg-background/50 rounded-lg border border-border/40">
                          {ticketMessages?.map((m: any) => (
                            <div key={m.id} className={`flex ${m.isAdmin ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[85%] p-2 rounded-lg text-xs ${m.isAdmin ? "bg-accent/20 border border-accent/30" : "bg-primary/10 border border-primary/20"}`}>
                                <div className="font-bold mb-1">{m.isAdmin ? "Você (Suporte)" : ticket.username}</div>
                                <p className="text-foreground break-words">{m.message}</p>
                                <div className="text-[9px] text-muted-foreground mt-1 text-right">
                                  {new Date(m.createdAt).toLocaleTimeString("pt-BR")}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {ticket.status === "open" && (
                          <form onSubmit={handleAdminReply} className="flex gap-2">
                            <Input 
                              placeholder="Responder cliente..." 
                              value={adminReply} 
                              onChange={(e) => setAdminReply(e.target.value)}
                              className="h-9 text-sm bg-background"
                            />
                            <Button type="submit" size="sm" className="bg-primary neon-purple" disabled={sendReplyMutation.isPending}>
                              <Send className="w-4 h-4" />
                            </Button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
