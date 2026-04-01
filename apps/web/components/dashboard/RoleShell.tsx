import Link from "next/link";

const roleSignals: Record<string, string[]> = {
  Farmer: ["Voice-based selling", "Fast crop registration", "Buyer calls in one place"],
  Buyer: ["Clear product cards", "AI quality confidence", "Escrow-ready checkout"],
  Consumer: ["Scan and verify", "Origin and farmer proof", "Trust history in seconds"],
  Admin: ["Fraud visibility", "Escrow oversight", "Judging-friendly trust view"]
};

const roleLinks: Record<string, { primary: string; primaryHref: string; secondary: string; secondaryHref: string }> = {
  Farmer: {
    primary: "Open buyer market",
    primaryHref: "/buyer",
    secondary: "View public trace",
    secondaryHref: "/consumer"
  },
  Buyer: {
    primary: "Browse listings",
    primaryHref: "/buyer",
    secondary: "Open admin view",
    secondaryHref: "/admin"
  },
  Consumer: {
    primary: "Scan trust page",
    primaryHref: "/consumer",
    secondary: "Browse marketplace",
    secondaryHref: "/buyer"
  },
  Admin: {
    primary: "Review flagged lots",
    primaryHref: "/admin",
    secondary: "Open marketplace",
    secondaryHref: "/buyer"
  }
};

export function RoleShell({
  title,
  description,
  role,
  children
}: {
  title: string;
  description: string;
  role: string;
  children: React.ReactNode;
}) {
  const actions = roleLinks[role] ?? roleLinks.Farmer;

  return (
    <div className="page-stack">
      <section className="card role-banner">
        <div className="role-banner-copy">
          <p className="eyebrow">{role} workspace</p>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="hero-actions">
            <Link className="button" href={actions.primaryHref}>
              {actions.primary}
            </Link>
            <Link className="ghost-button" href={actions.secondaryHref}>
              {actions.secondary}
            </Link>
          </div>
        </div>
        <div className="role-checklist">
          {(roleSignals[role] ?? roleSignals.Farmer).map((signal) => (
            <div key={signal} className="checklist-item">
              <span className="checklist-dot" />
              <div>
                <strong>{signal}</strong>
                <p>Built into the current demo flow.</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      {children}
    </div>
  );
}
