import { useState } from "react";
import { X, ArrowRight, ArrowLeft, Check, CreditCard, Shield, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CheckoutFlowProps {
  planName: string;
  planPrice: string;
  onClose: () => void;
}

type Step = "plan" | "billing" | "confirm" | "success";

export const CheckoutFlow = ({ planName, planPrice, onClose }: CheckoutFlowProps) => {
  const [step, setStep] = useState<Step>("plan");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  const steps: { key: Step; label: string }[] = [
    { key: "plan", label: "Plan" },
    { key: "billing", label: "Billing" },
    { key: "confirm", label: "Confirm" },
    { key: "success", label: "Done" },
  ];

  const currentIdx = steps.findIndex((s) => s.key === step);

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("success");
    }, 2000);
  };

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canProceedBilling =
    form.name.trim() && form.email.trim() && form.cardNumber.trim() && form.expiry.trim() && form.cvc.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-foreground/60"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="relative w-full max-w-lg bg-background border-2 border-foreground brutal-shadow"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-card border-2 border-foreground flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Progress */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center flex-1">
                <div
                  className={`w-6 h-6 border-2 border-foreground flex items-center justify-center font-mono text-[10px] font-bold ${
                    i <= currentIdx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < currentIdx ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 ${
                      i < currentIdx ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {steps.map((s) => (
              <span key={s.key} className="font-mono text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Plan Summary */}
            {step === "plan" && (
              <motion.div
                key="plan"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
              <h3 className="font-display text-2xl font-bold italic uppercase">Your Plan</h3>
              <div className="brutal-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-display text-lg font-bold italic uppercase">{planName}</span>
                  <span className="font-display text-2xl font-bold italic">{planPrice}<span className="text-xs font-mono text-muted-foreground">/mo</span></span>
                </div>
                <div className="h-0.5 bg-foreground mb-4" />
                <div className="space-y-2 font-mono text-xs text-muted-foreground">
                  <div className="flex justify-between"><span>Subtotal</span><span className="text-foreground font-bold">{planPrice}</span></div>
                  <div className="flex justify-between"><span>Tax</span><span className="text-foreground font-bold">$0.00</span></div>
                  <div className="h-px bg-muted my-2" />
                  <div className="flex justify-between text-foreground font-bold"><span>Total</span><span>{planPrice}/mo</span></div>
                </div>
              </div>
              <button
                onClick={() => setStep("billing")}
                className="brutal-button bg-foreground text-background w-full py-3 text-xs flex items-center justify-center gap-2"
              >
                Continue to Billing <ArrowRight className="h-3 w-3" />
              </button>
              </motion.div>
            )}

            {/* Step 2: Billing */}
            {step === "billing" && (
              <motion.div
                key="billing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
              <h3 className="font-display text-2xl font-bold italic uppercase">Billing Details</h3>

              <div className="space-y-4">
                <div>
                  <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Full Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full border-2 border-foreground bg-background px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Email</label>
                  <input
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="jane@example.com"
                    type="email"
                    className="w-full border-2 border-foreground bg-background px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                    <CreditCard className="inline h-3 w-3 mr-1" />Card Number
                  </label>
                  <input
                    value={form.cardNumber}
                    onChange={(e) => updateField("cardNumber", e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="w-full border-2 border-foreground bg-background px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Expiry</label>
                    <input
                      value={form.expiry}
                      onChange={(e) => updateField("expiry", e.target.value)}
                      placeholder="MM/YY"
                      className="w-full border-2 border-foreground bg-background px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">CVC</label>
                    <input
                      value={form.cvc}
                      onChange={(e) => updateField("cvc", e.target.value)}
                      placeholder="123"
                      className="w-full border-2 border-foreground bg-background px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                <Shield className="h-3 w-3" /> Secured with 256-bit encryption (mock)
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("plan")}
                  className="brutal-button bg-muted text-foreground flex-1 py-3 text-xs flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-3 w-3" /> Back
                </button>
                <button
                  onClick={() => setStep("confirm")}
                  disabled={!canProceedBilling}
                  className="brutal-button bg-foreground text-background flex-[2] py-3 text-xs flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Review Order <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              </motion.div>
            )}

            {/* Step 3: Confirm */}
            {step === "confirm" && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
              <h3 className="font-display text-2xl font-bold italic uppercase">Confirm Order</h3>

              <div className="brutal-card p-6 space-y-4">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-bold uppercase">{planName}</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold">{planPrice}/mo</span>
                </div>
                <div className="h-px bg-muted" />
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-bold">{form.name}</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-bold">{form.email}</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-muted-foreground">Card</span>
                  <span className="font-bold">•••• {form.cardNumber.slice(-4)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("billing")}
                  className="brutal-button bg-muted text-foreground flex-1 py-3 text-xs flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-3 w-3" /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="brutal-button bg-primary text-primary-foreground flex-[2] py-3 text-xs flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" /> Processing…
                    </>
                  ) : (
                    <>
                      Confirm & Pay <ArrowRight className="h-3 w-3" />
                    </>
                  )}
                </button>
              </div>
              </motion.div>
            )}

            {/* Step 4: Success */}
            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-6 py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 200 }}
                  className="w-16 h-16 bg-accent-lime border-2 border-foreground flex items-center justify-center mx-auto brutal-shadow"
                >
                  <motion.div
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    <Check className="h-8 w-8 text-foreground" />
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="font-display text-2xl font-bold italic uppercase">You're In!</h3>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="font-mono text-xs text-muted-foreground max-w-xs mx-auto"
                >
                  Welcome to {planName}. Your account has been upgraded. Start building unlimited extensions now.
                </motion.p>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ translateY: -2 }}
                  onClick={onClose}
                  className="brutal-button bg-foreground text-background px-8 py-3 text-xs"
                >
                  Start Building <ArrowRight className="h-3 w-3 inline ml-1" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
