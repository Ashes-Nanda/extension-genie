import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Check, ArrowRight, Zap, Crown, Building2 } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Zap,
    color: "bg-card",
    features: [
      "3 extensions per month",
      "Basic templates",
      "Community support",
      "Standard generation speed",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    icon: Crown,
    color: "bg-accent-lime",
    features: [
      "Unlimited extensions",
      "All premium templates",
      "Priority generation",
      "Icon generation",
      "Version history",
      "Email support",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    icon: Building2,
    color: "bg-accent-pink",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "Custom branding",
      "API access",
      "Dedicated support",
      "SLA guarantee",
    ],
    cta: "Contact Us",
    popular: false,
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);

  const handleSelectPlan = (planName: string) => {
    if (planName === "Free") {
      navigate("/auth");
    } else if (planName === "Enterprise") {
      // Mock: just show a toast-like behavior
      setCheckoutPlan(planName);
    } else {
      setCheckoutPlan(planName);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b-2 border-foreground">
        <button onClick={() => navigate("/")} className="flex items-center gap-3">
          <div className="w-8 h-8 bg-foreground flex items-center justify-center">
            <Layers className="h-5 w-5 text-background" />
          </div>
          <span className="font-display text-lg font-bold italic tracking-tight">EXTENSIO</span>
        </button>
        <button
          onClick={() => navigate("/")}
          className="font-mono text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors"
        >
          ← Back
        </button>
      </nav>

      {/* Header */}
      <section className="px-6 pt-20 pb-16 text-center">
        <ScrollReveal animation="slide-up">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest bg-foreground text-background px-3 py-1.5 inline-block mb-6">
            Pricing
          </span>
          <h1 className="font-display text-5xl md:text-7xl font-bold italic leading-[0.9] mb-4 tracking-tight">
            SIMPLE<br /><span className="text-primary">PRICING</span>.
          </h1>
          <p className="text-muted-foreground font-mono text-sm max-w-md mx-auto">
            Start free. Scale when you're ready. No hidden fees.
          </p>
        </ScrollReveal>
      </section>

      {/* Plans */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <ScrollReveal key={plan.name} animation="fade-in" delay={i * 120}>
              <div
                className={`${plan.color} border-2 border-foreground p-8 brutal-shadow relative group cursor-default transition-all duration-200 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[1px_1px_0px_0px_hsl(0_0%_0%)] flex flex-col h-full`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-6 bg-primary text-primary-foreground px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-foreground">
                    Most Popular
                  </div>
                )}

                <div className="w-10 h-10 bg-foreground flex items-center justify-center mb-4">
                  <plan.icon className="h-5 w-5 text-background" />
                </div>

                <h3 className="font-display text-2xl font-bold italic uppercase mb-2">{plan.name}</h3>

                <div className="mb-6">
                  <span className="font-display text-4xl font-bold italic">{plan.price}</span>
                  {plan.period && (
                    <span className="font-mono text-xs text-muted-foreground ml-1">{plan.period}</span>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 font-mono text-xs">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.name)}
                  className="brutal-button bg-foreground text-background w-full py-3 text-xs flex items-center justify-center gap-2"
                >
                  {plan.cta} <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t-2 border-foreground py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <ScrollReveal animation="slide-up">
            <h2 className="font-display text-3xl font-bold italic text-center mb-10 tracking-tight">
              FAQ.
            </h2>
          </ScrollReveal>
          {[
            { q: "Can I cancel anytime?", a: "Yes. Cancel your subscription anytime from your account settings. No lock-in contracts." },
            { q: "What payment methods do you accept?", a: "We accept all major credit cards, debit cards, and PayPal." },
            { q: "Is there a refund policy?", a: "We offer a 14-day money-back guarantee on all paid plans." },
          ].map((faq, i) => (
            <ScrollReveal key={faq.q} animation="fade-in" delay={i * 80}>
              <div className="brutal-card p-6 mb-4">
                <h4 className="font-display text-sm font-bold italic uppercase mb-2">{faq.q}</h4>
                <p className="font-mono text-xs text-muted-foreground">{faq.a}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-foreground py-6 px-6 bg-background">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-display text-xs font-bold italic">EXTENSIO</span>
          <div className="flex gap-6 font-mono text-[10px] uppercase tracking-widest font-bold">
            <a href="#" className="hover:text-primary transition-colors">Docs</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
          </div>
        </div>
      </footer>

      {/* Checkout Modal */}
      {checkoutPlan && (
        <CheckoutFlow
          planName={checkoutPlan}
          planPrice={plans.find((p) => p.name === checkoutPlan)?.price || ""}
          onClose={() => setCheckoutPlan(null)}
        />
      )}
    </div>
  );
};

export default Pricing;
