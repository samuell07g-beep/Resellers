import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Zap, Lock, Globe, ArrowRight, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden dark-grid">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background pointer-events-none" />
        <div className="container py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center animate-entrance">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-secondary text-muted-foreground text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5 text-foreground" />
              Proxy de Alta Performance para iOS
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight text-foreground">
              PROXY iOS
              <br />
              <span className="text-primary">SITE OFICIAL</span>
              <br />
              <span className="text-muted-foreground font-bold text-3xl md:text-5xl">PARA REVEND</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
              A melhor tecnologia de Proxy iOS para Free Fire Normal e Free Fire MAX. Funções exclusivas: HS Alto, HS Peito e HS Pescoço. Ativação instantânea.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/shop">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold px-8 primary-glow">
                  Ver Planos
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="border-border text-base font-semibold px-8 hover:border-primary/50 hover:bg-secondary">
                  Criar Conta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-border/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Por que escolher nossos proxies?</h2>
            <p className="text-muted-foreground">Tecnologia de ponta para sua privacidade e segurança</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Alta Velocidade", desc: "Conexões ultra-rápidas com baixa latência para uma experiência fluída." },
              { icon: Lock, title: "Total Privacidade", desc: "Seus dados protegidos com criptografia de ponta a ponta." },
              { icon: Globe, title: "Ativação Instantânea", desc: "Após o pagamento confirmado, suas keys são liberadas automaticamente." },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-all group">
                <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans preview */}
      <section className="py-20 border-t border-border/50 bg-card/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Planos disponíveis</h2>
            <p className="text-muted-foreground">Escolha o plano ideal para você</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { name: "1 Dia", price: "R$ 5,00", popular: false },
              { name: "7 Dias", price: "R$ 10,00", popular: true },
              { name: "30 Dias", price: "R$ 15,00", popular: false },
            ].map((plan, i) => (
              <div key={i} className={`relative p-6 rounded-xl border transition-all ${plan.popular ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/30"}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
                    Popular
                  </div>
                )}
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Proxy iOS</div>
                  <div className="text-xl font-bold text-foreground mb-1">{plan.name}</div>
                  <div className={`text-2xl font-extrabold mb-4 ${plan.popular ? "text-primary" : "text-foreground"}`}>{plan.price}</div>
                  <div className="space-y-2 mb-6 text-left">
                    {["Key exclusiva", "Ativação imediata", "Suporte técnico"].map((feat, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                        {feat}
                      </div>
                    ))}
                  </div>
                  <Link href="/shop">
                    <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                      Comprar
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 7V5a4 4 0 0 0-8 0v2"/>
              </svg>
              <span className="text-sm font-medium text-foreground">Proxy Revendedores</span>
            </div>
            <span className="text-xs text-muted-foreground">Dev: @ruanwq</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Proxy Revendedores. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
