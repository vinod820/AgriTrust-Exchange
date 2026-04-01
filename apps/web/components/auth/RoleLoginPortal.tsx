"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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

type RoleId = (typeof roles)[number]["id"];

export function RoleLoginPortal() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleId>("farmer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const activeRole = roles.find((role) => role.id === selectedRole) ?? roles[0];

  function continueToPortal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(activeRole.href);
  }

  return (
    <main className="login-page">
      <section className="login-hero-card">
        <p className="eyebrow">Role-based entry</p>
        <h1>Choose the portal you want to enter.</h1>
        <p>
          This app now starts with a role-selection login flow. Pick `Farmer`, `Buyer`, `Admin`, or `Consumer`, then
          continue into a website experience built for that role.
        </p>
        <div className="login-feature-list">
          <div className="login-feature-item">
            <strong>Farmer</strong>
            <span>Selling flow, voice actions, inventory, and wallet.</span>
          </div>
          <div className="login-feature-item">
            <strong>Buyer</strong>
            <span>Marketplace search, listing detail, video verification, and escrow path.</span>
          </div>
          <div className="login-feature-item">
            <strong>Admin</strong>
            <span>Fraud monitoring, escrow oversight, and judging-friendly trust visibility.</span>
          </div>
          <div className="login-feature-item">
            <strong>Consumer</strong>
            <span>Trace page, QR verification, and simple source proof.</span>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="panel-title-row">
          <div>
            <p className="kicker">Login</p>
            <h2>Select role and continue</h2>
          </div>
          <span className="tag">Demo access</span>
        </div>

        <form onSubmit={continueToPortal} className="login-form-grid">
          <label className="field">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              name="email"
              aria-label="email"
            />
          </label>

          <label className="field">
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              type="password"
              name="password"
              aria-label="password"
            />
          </label>

          <div className="role-choice-section">
            <div className="panel-title-row">
              <div>
                <p className="kicker">Choose role</p>
                <h3>{activeRole.title}</h3>
              </div>
            </div>

            <div className="role-choice-grid">
              {roles.map((role) => {
                const isActive = role.id === selectedRole;

                return (
                  <button
                    key={role.id}
                    type="button"
                    className={`role-choice-card ${isActive ? "role-choice-card-active" : ""}`}
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

          <div className="notice-card">
            <strong>Selected portal</strong>
            <p>{activeRole.description}</p>
          </div>

          <div className="button-row">
            <button className="button" type="submit" data-voice={`continue as ${activeRole.label.toLowerCase()} enter ${activeRole.label.toLowerCase()} portal`}>
              Continue as {activeRole.label}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
