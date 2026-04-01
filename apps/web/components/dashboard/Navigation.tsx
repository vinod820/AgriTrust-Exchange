"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, ShoppingBag, Shield, Users, ArrowLeft, Menu, X } from "lucide-react";
import { useState } from "react";

interface NavigationProps {
  portal: "farmer" | "buyer" | "admin" | "consumer";
  title: string;
  subtitle: string;
}

const portalConfig = {
  farmer: {
    icon: Leaf,
    color: "#2D5A3F",
    links: [
      { href: "/farmer", label: "Dashboard" },
      { href: "/buyer", label: "Marketplace" }
    ]
  },
  buyer: {
    icon: ShoppingBag,
    color: "#CCFF00",
    links: [
      { href: "/buyer", label: "Marketplace" },
      { href: "/farmer", label: "Farmer View" }
    ]
  },
  admin: {
    icon: Shield,
    color: "#E25C3D",
    links: [
      { href: "/admin", label: "Dashboard" },
      { href: "/buyer", label: "Marketplace" }
    ]
  },
  consumer: {
    icon: Users,
    color: "#00C853",
    links: [
      { href: "/consumer", label: "Verify" },
      { href: "/buyer", label: "Browse" }
    ]
  }
};

export function Navigation({ portal, title, subtitle }: NavigationProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const config = portalConfig[portal];
  const Icon = config.icon;

  return (
    <header className="nav-header">
      <div className="nav-container">
        {/* Brand */}
        <Link href="/" className="nav-brand" data-testid="nav-brand">
          <div className="nav-logo" style={{ background: config.color, color: portal === "buyer" ? "#111812" : "#FDFBF7" }}>
            KV
          </div>
          <div>
            <div className="nav-title">{title}</div>
            <div className="nav-subtitle">{subtitle}</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="nav-links" data-testid="nav-links">
          {config.links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${pathname.startsWith(link.href.split("?")[0]) ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="nav-actions">
          <Link href="/" className="btn btn-secondary btn-sm" data-testid="switch-role-btn">
            <ArrowLeft size={16} />
            Switch Role
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="btn btn-ghost btn-icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ display: "none" }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
}
