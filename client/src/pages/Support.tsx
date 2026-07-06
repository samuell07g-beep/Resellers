import { useState, useEffect, useRef } from "react";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Plus, Clock, CheckCircle2, Loader2, User, Shield } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Support() {
  const { isAuthenticated, user } = useLocalAuth();
  const [, navigate] = useLocation();
  const [subject, setSubject] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: tickets, refetch: refetchTickets, isLoading: loadingTickets } = trpc.support.myTickets.useQuery(undefined, { enabled: isAuthenticated });
  const { data: messages, refetch: refetchMessages } = trpc.support.getMessages.useQuery({ ticketId: selectedTicket! }, { enabled: !!selectedTicket });

  const createTicketMutation = trpc.support.create.useMutation();
  const sendMessageMutation = trpc.support.sendMessage.useMutation();

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    try {
      const ticket = await createTicketMutation.mutateAsync({ subject });
      toast.success("Ticket aberto com sucesso!");
      setSubject("");
      refetchTickets();
      setSelectedTicket(ticket.id);
    } catch (err: any) {
      toast.error(err.message || "Erro ao abrir ticket");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;
    try {
      await sendMessageMutation.mutateAsync({ ticketId: selectedTicket, message: newMessage });
      setNewMessage("");
      refetchMessages();
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar mensagem");
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container flex-1 py-6 md:py-10 flex flex-col md:flex-row gap-6">
        {/* Sidebar: Tickets List */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">Suporte</h1>
            <Button size="sm" variant="ghost" onClick={() => setSelectedTicket(null)} className="md:hidden">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-2">
            <Input 
              placeholder="Assunto do ticket..." 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)}
              className="bg-card border-border/50"
            />
            <Button type="submit" className="w-full bg-primary neon-purple" disabled={createTicketMutation.isPending}>
              <Plus className="w-4 h-4 mr-2" /> Novo Ticket
            </Button>
          </form>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px] md:max-h-none">
            {loadingTickets ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : tickets?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Nenhum ticket aberto.</p>
            ) : (
              tickets?.map((t: any) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicket(t.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${selectedTicket === t.id ? "border-primary bg-primary/10" : "border-border/50 bg-card hover:border-primary/30"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">#{t.id}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${t.status === "open" ? "bg-accent/20 text-accent border-accent/30" : "bg-muted text-muted-foreground border-border/40"}`}>
                      {t.status === "open" ? "Aberto" : "Fechado"}
                    </span>
                  </div>
                  <div className="font-medium text-sm text-foreground truncate">{t.subject}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {new Date(t.updatedAt).toLocaleString("pt-BR")}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden min-h-[500px]">
          {selectedTicket ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border/30 bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground">
                      {tickets?.find((t: any) => t.id === selectedTicket)?.subject}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Status: {tickets?.find((t: any) => t.id === selectedTicket)?.status === "open" ? "Aguardando suporte" : "Resolvido"}</div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/30">
                {messages?.map((m: any) => (
                  <div key={m.id} className={`flex ${m.isAdmin ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.isAdmin ? "bg-accent/10 border border-accent/20 rounded-tl-none" : "bg-primary/10 border border-primary/20 rounded-tr-none"}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {m.isAdmin ? <Shield className="w-3 h-3 text-accent" /> : <User className="w-3 h-3 text-primary" />}
                        <span className={`text-[10px] font-bold ${m.isAdmin ? "text-accent" : "text-primary"}`}>
                          {m.isAdmin ? "Suporte" : "Você"}
                        </span>
                      </div>
                      <p className="text-foreground leading-relaxed break-words">{m.message}</p>
                      <div className="text-[9px] text-muted-foreground mt-1 text-right">
                        {new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              {tickets?.find((t: any) => t.id === selectedTicket)?.status === "open" ? (
                <form onSubmit={handleSendMessage} className="p-4 border-t border-border/30 bg-card flex gap-2">
                  <Input 
                    placeholder="Sua mensagem..." 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-background border-border/50"
                  />
                  <Button type="submit" size="icon" className="bg-primary neon-purple shrink-0" disabled={sendMessageMutation.isPending}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground bg-muted/20 border-t border-border/30">
                  Este ticket foi encerrado.
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Selecione um ticket</h3>
              <p className="text-sm text-muted-foreground max-w-xs">Escolha um ticket ao lado para ver o histórico ou abra um novo para suporte.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
