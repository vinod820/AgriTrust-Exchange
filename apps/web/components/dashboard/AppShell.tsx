"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  match: (pathname: string, searchParams: URLSearchParams) => boolean;
};

type PortalConfig = {
  name: string;
  subtitle: string;
  title: string;
  homeHref: string;
  nav: NavItem[];
  primaryAction: {
    href: string;
    label: string;
  };
};

function isAuthRoute(pathname: string) {
  return pathname === "/" || pathname.startsWith("/login");
}

function getPortalConfig(pathname: string): PortalConfig | null {
  if (pathname.startsWith("/farmer")) {
    return {
      name: "Farmer Portal",
      subtitle: "Seller website",
      title: "Farmer selling experience",
      homeHref: "/farmer?section=overview",
      nav: [
        {
          href: "/farmer?section=overview",
          label: "Overview",
          match: (_, searchParams) => (searchParams.get("section") ?? "overview") === "overview"
        },
        {
          href: "/farmer?section=sell",
          label: "Sell Crop",
          match: (_, searchParams) => searchParams.get("section") === "sell"
        },
        {
          href: "/farmer?section=voice",
          label: "Voice",
          match: (_, searchParams) => searchParams.get("section") === "voice"
        },
        {
          href: "/farmer?section=inventory",
          label: "Inventory",
          match: (_, searchParams) => searchParams.get("section") === "inventory"
        },
        {
          href: "/farmer?section=wallet",
          label: "Wallet",
          match: (_, searchParams) => searchParams.get("section") === "wallet"
        }
      ],
      primaryAction: {
        href: "/buyer",
        label: "Open buyer market"
      }
    };
  }

  if (pathname.startsWith("/buyer") || pathname.startsWith("/listing") || pathname.startsWith("/call")) {
    return {
      name: "Buyer Portal",
      subtitle: "Buyer website",
      title: "Buyer sourcing experience",
      homeHref: "/buyer",
      nav: [
        {
          href: "/buyer",
          label: "Marketplace",
          match: (currentPathname) => currentPathname.startsWith("/buyer")
        },
        {
          href: "/listing/listing-tomato-001",
          label: "Listing Details",
          match: (currentPathname) => currentPathname.startsWith("/listing")
        },
        {
          href: "/call/room-tomato-001",
          label: "Live Verify",
          match: (currentPathname) => currentPathname.startsWith("/call")
        },
        {
          href: "/consumer",
          label: "Public Trace",
          match: (currentPathname) => currentPathname.startsWith("/consumer") || currentPathname.startsWith("/trace")
        }
      ],
      primaryAction: {
        href: "/",
        label: "Switch role"
      }
    };
  }

  if (pathname.startsWith("/admin")) {
    return {
      name: "Admin Portal",
      subtitle: "Admin website",
      title: "Operations and trust oversight",
      homeHref: "/admin",
      nav: [
        {
          href: "/admin",
          label: "Admin Home",
          match: (currentPathname) => currentPathname.startsWith("/admin")
        },
        {
          href: "/buyer",
          label: "Marketplace View",
          match: (currentPathname) => currentPathname.startsWith("/buyer") || currentPathname.startsWith("/listing")
        },
        {
          href: "/trace/BATCH-TOM-2401",
          label: "Trace Demo",
          match: (currentPathname) => currentPathname.startsWith("/trace")
        }
      ],
      primaryAction: {
        href: "/",
        label: "Switch role"
      }
    };
  }

  if (pathname.startsWith("/consumer") || pathname.startsWith("/trace")) {
    return {
      name: "Consumer Portal",
      subtitle: "Consumer website",
      title: "Consumer trust experience",
      homeHref: "/consumer",
      nav: [
        {
          href: "/consumer",
          label: "Trust Home",
          match: (currentPathname) => currentPathname.startsWith("/consumer")
        },
        {
          href: "/trace/BATCH-TOM-2401",
          label: "Scan Result",
          match: (currentPathname) => currentPathname.startsWith("/trace")
        },
        {
          href: "/buyer",
          label: "Browse Products",
          match: (currentPathname) => currentPathname.startsWith("/buyer") || currentPathname.startsWith("/listing")
        }
      ],
      primaryAction: {
        href: "/",
        label: "Switch role"
      }
    };
  }

  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (isAuthRoute(pathname)) {
    return (
      <div className="auth-app-shell">
        <div className="auth-page-wrap">{children}</div>
      </div>
    );
  }

  const portal = getPortalConfig(pathname);

  if (!portal) {
    return <div className="auth-page-wrap">{children}</div>;
  }

  return (
    <div className="role-site-shell">
      <header className="role-site-header">
        <div className="role-site-topbar">
          <Link href={portal.homeHref} className="role-site-brand" aria-label={portal.name}>
            <span className="role-site-brand-mark">{portal.name.slice(0, 2).toUpperCase()}</span>
            <span className="role-site-brand-copy">
              <strong>{portal.name}</strong>
              <small>{portal.subtitle}</small>
            </span>
          </Link>

          <div className="role-site-actions">
            <span className="topbar-badge topbar-badge-blue">{portal.title}</span>
            <Link href={portal.primaryAction.href} className="ghost-button">
              {portal.primaryAction.label}
            </Link>
          </div>
        </div>

        <nav className="role-site-nav" aria-label={`${portal.name} navigation`}>
          {portal.nav.map((item) => {
            const isActive = item.match(pathname, searchParams);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`role-site-nav-link ${isActive ? "role-site-nav-link-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="role-site-main">{children}</main>
    </div>
  );
}
