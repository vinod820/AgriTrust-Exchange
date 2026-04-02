"use client";

import { Eye, EyeOff, Lock, Shield, Sparkles, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/branding/BrandMark";
import styles from "./RoleLoginPortal.module.css";

const roles = [
  {
    id: "farmer",
    label: "Farmer",
    title: "Seller website",
    description: "Create crop listings, use voice selling, manage inventory, and prepare wallet-backed payments.",
    href: "/farmer?section=overview"
  },
  {
    id: "buyer",
    label: "Buyer",
    title: "Buyer website",
    description: "Browse produce, compare lots, verify by video, and move toward escrow-backed checkout.",
    href: "/buyer"
  },
  {
    id: "admin",
    label: "Admin",
    title: "Admin website",
    description: "Review fraud alerts, watch escrow state, and explain the trust layer clearly during demos.",
    href: "/admin"
  },
  {
    id: "consumer",
    label: "Consumer",
    title: "Consumer website",
    description: "Scan and verify source, quality, and trust history from a simple public-facing experience.",
    href: "/consumer"
  }
] as const;

const highlights = [
  "Voice-first listing and buying flows across the platform",
  "Video verification before escrow release for fair trade",
  "Transparent blockchain proof for listings and verification",
  "One login surface for farmer, buyer, admin, and consumer roles"
] as const;

const stats = [
  { value: "10,000+", label: "Transactions tracked" },
  { value: "500+", label: "Active farm-market links" },
  { value: "99.9%", label: "Traceability visibility" }
] as const;

const featureChips = [
  { icon: Sparkles, label: "Voice control" },
  { icon: Wallet, label: "Wallet ready" },
  { icon: Shield, label: "Blockchain trust" }
] as const;

type RoleId = (typeof roles)[number]["id"];

export function RoleLoginPortal() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleId>("farmer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const activeRole = roles.find((role) => role.id === selectedRole) ?? roles[0];

  function continueToPortal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(activeRole.href);
  }

  function createDemoAccount() {
    router.push(activeRole.href);
  }

  return (
    <main className={styles.pageShell}>
      <section className={styles.heroPane}>
        <div className={styles.brandRow}>
          <BrandMark className={styles.brandMark} />
          <div>
            <div className={styles.brandTitle}>KrishiVoice Chain</div>
            <div className={styles.brandSubtitle}>Voice-first agriculture trade management</div>
          </div>
        </div>

        <div className={styles.heroContent}>
          <div className={styles.kicker}>Smart access for every role</div>
          <h1 className={styles.heroTitle}>
            Streamline Your
            <br />
            <span>Farm Trade Workflow</span>
          </h1>
          <p className={styles.heroText}>
            Enter through one secure login and continue into the farmer, buyer, admin, or consumer experience without
            changing the rest of the platform.
          </p>

          <div className={styles.featureList}>
            {highlights.map((item) => (
              <div key={item} className={styles.featureItem}>
                <div className={styles.featureCheck}>
                  <Sparkles size={14} />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className={styles.featureChipRow}>
            {featureChips.map(({ icon: Icon, label }) => (
              <div key={label} className={styles.featureChip}>
                <Icon size={15} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.metricRow}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.metricCard}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>

        <div className={styles.heroFooter}>Mahakrishi secure demo access with blockchain-backed transparency.</div>
      </section>

      <section className={styles.formPane}>
        <div className={styles.formWrap}>
          <div className={styles.formHeader}>
            <h2>Welcome back</h2>
            <p>Enter your credentials to continue into the selected Mahakrishi portal.</p>
          </div>

          <form onSubmit={continueToPortal} className={styles.form}>
            <label className={styles.label}>
              <span>Email Address</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@yourfirm.com"
                name="email"
                aria-label="email"
                className={styles.input}
                autoComplete="email"
              />
            </label>

            <label className={styles.label}>
              <span className={styles.passwordLabelRow}>
                <span>Password</span>
                <button type="button" className={styles.inlineAction}>
                  Forgot password?
                </button>
              </span>
              <span className={styles.passwordField}>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  aria-label="password"
                  className={styles.input}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.visibilityToggle}
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            <div className={styles.roleSection}>
              <div className={styles.roleHeader}>
                <div>
                  <div className={styles.roleKicker}>Role Access</div>
                  <h3>{activeRole.title}</h3>
                </div>
                <div className={styles.demoBadge}>Demo access</div>
              </div>

              <div className={styles.roleGrid}>
                {roles.map((role) => {
                  const isActive = role.id === selectedRole;

                  return (
                    <button
                      key={role.id}
                      type="button"
                      className={`${styles.roleCard} ${isActive ? styles.roleCardActive : ""}`}
                      onClick={() => setSelectedRole(role.id)}
                      data-voice={`choose ${role.label.toLowerCase()} select ${role.label.toLowerCase()} continue as ${role.label.toLowerCase()}`}
                    >
                      <strong>{role.label}</strong>
                      <span>{role.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.selectedPanel}>
              <div className={styles.selectedIcon}>
                <Lock size={18} />
              </div>
              <div>
                <div className={styles.selectedTitle}>Selected portal</div>
                <p>{activeRole.description}</p>
              </div>
            </div>

            <button
              className={styles.primaryButton}
              type="submit"
              data-voice={`continue as ${activeRole.label.toLowerCase()} sign in enter ${activeRole.label.toLowerCase()} portal`}
            >
              <span>Sign in</span>
              <span className={styles.buttonArrow}>→</span>
            </button>
          </form>

          <div className={styles.divider}>
            <span>New to KrishiVoice Chain?</span>
          </div>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={createDemoAccount}
            data-voice={`create account open ${activeRole.label.toLowerCase()} portal`}
          >
            Create an account
          </button>

          <div className={styles.footerNoteRow}>
            <div className={styles.footerNote}>
              <Shield size={14} />
              <span>Testnet-secure access</span>
            </div>
            <div className={styles.footerNote}>
              <Wallet size={14} />
              <span>Role-based secure login</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
