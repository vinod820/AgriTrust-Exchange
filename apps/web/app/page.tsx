"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Mic, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  Leaf, 
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Globe,
  Lock
} from "lucide-react";
import { useVoice } from "@/components/voice/VoiceProvider";

const roles = [
  {
    id: "farmer",
    label: "Farmer",
    icon: Leaf,
    color: "#2D5A3F",
    title: "Seller Portal",
    description: "Voice-powered crop registration, AI quality analysis, and direct buyer connections.",
    href: "/farmer",
    features: ["Voice Commands", "AI Grading", "Fair Pricing"]
  },
  {
    id: "buyer",
    label: "Buyer",
    icon: TrendingUp,
    color: "#CCFF00",
    title: "Buyer Marketplace",
    description: "Smart search, video verification, and escrow-backed secure transactions.",
    href: "/buyer",
    features: ["Live Verification", "Smart Filters", "Secure Escrow"]
  },
  {
    id: "admin",
    label: "Admin",
    icon: ShieldCheck,
    color: "#E25C3D",
    title: "Control Center",
    description: "Fraud detection, trust scoring, and complete marketplace oversight.",
    href: "/admin",
    features: ["Fraud Detection", "Trust Scores", "Analytics"]
  },
  {
    id: "consumer",
    label: "Consumer",
    icon: Users,
    color: "#00C853",
    title: "Trace & Verify",
    description: "QR scan verification, source tracking, and trust transparency.",
    href: "/consumer",
    features: ["QR Scan", "Full Traceability", "Trust Meter"]
  }
];

const stats = [
  { value: "10K+", label: "Farmers Connected" },
  { value: "98%", label: "Trust Score" },
  { value: "50K+", label: "Transactions" },
  { value: "24/7", label: "AI Support" }
];

export default function HomePage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("farmer");
  const { startListening } = useVoice();

  const activeRole = roles.find((role) => role.id === selectedRole) || roles[0];

  const handleContinue = () => {
    router.push(activeRole.href);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)" }}>
      {/* Hero Section */}
      <section className="hero" style={{ minHeight: "90vh" }}>
        <div className="hero-background">
          <img 
            src="https://static.prod-images.emergentagent.com/jobs/1d7c1506-eeb9-4090-8d04-3e29c3d1b8da/images/79bc217c2fb9a685686909cb927f2d223d384b404feea2946f802a4000136b8c.png"
            alt="Agricultural field with digital overlay"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div className="hero-overlay" />
        </div>
        
        <div className="app-container" style={{ position: "relative", zIndex: 1 }}>
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="badge badge-blockchain" style={{ marginBottom: "var(--space-lg)" }}>
              <Lock size={14} />
              Blockchain Secured
            </div>
            
            <h1 style={{ marginBottom: "var(--space-lg)" }}>
              Farm Meets Future.<br />
              <span style={{ color: "var(--brand-secondary)" }}>Trust Meets Technology.</span>
            </h1>
            
            <p style={{ maxWidth: "560px", marginBottom: "var(--space-xl)" }}>
              KrishiVoice Chain transforms agriculture with voice-first interactions, 
              AI-powered quality analysis, and blockchain-backed trust. Connect farmers 
              directly with buyers through verified, transparent transactions.
            </p>

            <div className="hero-actions">
              <button 
                className="btn btn-accent btn-lg"
                onClick={handleContinue}
                data-testid="hero-get-started"
                data-voice={`get started continue open ${activeRole.label.toLowerCase()} page continue as ${activeRole.label.toLowerCase()}`}
              >
                Get Started
                <ArrowRight size={20} />
              </button>
              <button
                className="btn btn-secondary btn-lg"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)", color: "white" }}
                onClick={startListening}
                data-voice="try voice demo start voice command start listening"
              >
                <Mic size={20} />
                Try Voice Demo
              </button>
            </div>

            {/* Stats Row */}
            <div style={{ 
              display: "flex", 
              gap: "var(--space-2xl)", 
              marginTop: "var(--space-3xl)",
              paddingTop: "var(--space-xl)",
              borderTop: "1px solid rgba(255,255,255,0.1)"
            }}>
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div style={{ 
                    fontFamily: "Outfit, sans-serif", 
                    fontSize: "2rem", 
                    fontWeight: 700,
                    color: "var(--brand-secondary)"
                  }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: "0.875rem", opacity: 0.7 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Role Selection Section */}
      <section style={{ padding: "var(--space-3xl) 0", background: "var(--bg-main)" }}>
        <div className="app-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: "var(--space-2xl)" }}
          >
            <span className="label label-brand" style={{ marginBottom: "var(--space-md)", display: "inline-block" }}>
              Choose Your Portal
            </span>
            <h2>One Platform, Four Powerful Experiences</h2>
            <p style={{ maxWidth: "600px", margin: "var(--space-md) auto 0" }}>
              Whether you're selling crops, sourcing produce, managing operations, or verifying authenticity 
              — we've built the perfect experience for you.
            </p>
          </motion.div>

          {/* Role Cards Grid */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(4, 1fr)", 
            gap: "var(--space-lg)",
            marginBottom: "var(--space-2xl)"
          }}>
            {roles.map((role, index) => {
              const Icon = role.icon;
              const isActive = role.id === selectedRole;
              
              return (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedRole(role.id)}
                  data-testid={`role-card-${role.id}`}
                  data-voice={`choose ${role.label.toLowerCase()} select ${role.label.toLowerCase()} continue as ${role.label.toLowerCase()} open ${role.label.toLowerCase()} page`}
                  className="card card-interactive"
                  style={{
                    cursor: "pointer",
                    borderColor: isActive ? "var(--brand-primary)" : undefined,
                    background: isActive ? "var(--bg-surface)" : undefined,
                    boxShadow: isActive ? "0 8px 32px rgba(45, 90, 63, 0.15)" : undefined
                  }}
                >
                  <div style={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: "var(--radius-md)",
                    background: isActive ? role.color : "var(--bg-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "var(--space-md)",
                    transition: "all 0.2s ease"
                  }}>
                    <Icon size={24} color={isActive ? (role.id === "buyer" ? "#111812" : "#fff") : "var(--text-secondary)"} />
                  </div>
                  
                  <h3 style={{ marginBottom: "var(--space-xs)" }}>{role.label}</h3>
                  <p style={{ fontSize: "0.875rem", marginBottom: "var(--space-md)" }}>
                    {role.description}
                  </p>
                  
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-xs)" }}>
                    {role.features.map(feature => (
                      <span key={feature} className="badge" style={{ fontSize: "0.75rem" }}>
                        {feature}
                      </span>
                    ))}
                  </div>

                  {isActive && (
                    <motion.div 
                      layoutId="activeIndicator"
                      style={{
                        position: "absolute",
                        top: "var(--space-md)",
                        right: "var(--space-md)",
                      }}
                    >
                      <CheckCircle2 size={24} color="var(--brand-primary)" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Continue Button */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button 
              className="btn btn-primary btn-lg"
              onClick={handleContinue}
              data-testid="continue-btn"
              data-voice={`continue as ${activeRole.label.toLowerCase()} open ${activeRole.label.toLowerCase()} page`}
            >
              Continue as {activeRole.label}
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: "var(--space-3xl) 0", background: "var(--bg-secondary)" }}>
        <div className="app-container">
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: "var(--space-3xl)",
            alignItems: "center"
          }}>
            {/* Left - Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              style={{ position: "relative" }}
            >
              <div style={{ 
                borderRadius: "var(--radius-xl)", 
                overflow: "hidden",
                boxShadow: "0 24px 64px rgba(26, 46, 32, 0.15)"
              }}>
                <img 
                  src="https://images.pexels.com/photos/7457040/pexels-photo-7457040.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                  alt="Farmer using technology"
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
              
              {/* Trust Badge Overlay */}
              <div style={{
                position: "absolute",
                bottom: "-24px",
                right: "-24px",
                background: "var(--bg-surface)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-lg)",
                boxShadow: "0 12px 40px rgba(26, 46, 32, 0.12)",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-md)"
              }}>
                <img 
                  src="https://static.prod-images.emergentagent.com/jobs/1d7c1506-eeb9-4090-8d04-3e29c3d1b8da/images/e46cdab6b24bebc0f4ca2cfbd63f891b3cf4d29bb1231e418521bf0c9120e164.png"
                  alt="Trust Badge"
                  style={{ width: 48, height: 48 }}
                />
                <div>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>98% Trust Score</div>
                  <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Verified & Secured</div>
                </div>
              </div>
            </motion.div>

            {/* Right - Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="label label-brand" style={{ marginBottom: "var(--space-md)", display: "inline-block" }}>
                Why KrishiVoice Chain
              </span>
              <h2 style={{ marginBottom: "var(--space-lg)" }}>
                Beyond Tracking.<br />
                Complete Trust Ecosystem.
              </h2>
              <p style={{ marginBottom: "var(--space-xl)" }}>
                Other solutions track products. We verify quality, enforce fair pricing, 
                enable real-time interaction, and create trust across the entire ecosystem.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                {[
                  { icon: Mic, title: "Voice-First Design", desc: "Speak to register crops, check prices, navigate — works in local languages" },
                  { icon: Sparkles, title: "AI Quality Analysis", desc: "Instant disease detection, freshness scoring, and fair price suggestions" },
                  { icon: Lock, title: "Blockchain Security", desc: "Every transaction recorded immutably, from farm to table" },
                  { icon: Globe, title: "Live Verification", desc: "Video calls between farmers and buyers for real-time crop inspection" }
                ].map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    style={{ 
                      display: "flex", 
                      gap: "var(--space-md)",
                      padding: "var(--space-md)",
                      background: "var(--bg-surface)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid rgba(26, 46, 32, 0.06)"
                    }}
                  >
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: "var(--radius-sm)",
                      background: "var(--brand-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <feature.icon size={22} color="var(--brand-secondary)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>{feature.title}</div>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{feature.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ 
        padding: "var(--space-3xl) 0", 
        background: "var(--bg-inverse)",
        color: "var(--text-inverse)"
      }}>
        <div className="app-container" style={{ textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 style={{ color: "var(--text-inverse)", marginBottom: "var(--space-md)" }}>
              Ready to Transform Agriculture?
            </h2>
            <p style={{ 
              color: "rgba(253, 251, 247, 0.7)", 
              maxWidth: "500px", 
              margin: "0 auto var(--space-xl)"
            }}>
              Join thousands of farmers and buyers already using KrishiVoice Chain 
              for transparent, trustworthy agricultural commerce.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-md)" }}>
              <button 
                className="btn btn-accent btn-lg"
                onClick={handleContinue}
                data-testid="cta-get-started"
                data-voice={`start now continue continue as ${activeRole.label.toLowerCase()} open ${activeRole.label.toLowerCase()} page`}
              >
                Start Now — It's Free
                <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        padding: "var(--space-xl) 0",
        background: "var(--bg-inverse)",
        borderTop: "1px solid rgba(253, 251, 247, 0.1)"
      }}>
        <div className="app-container">
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            color: "rgba(253, 251, 247, 0.5)",
            fontSize: "0.875rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-sm)",
                background: "var(--brand-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--brand-secondary)",
                fontWeight: 900,
                fontSize: "0.875rem"
              }}>
                KV
              </div>
              <span>KrishiVoice Chain</span>
            </div>
            <div>© 2026 KrishiVoice Chain. Built for the future of farming.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
