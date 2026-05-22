"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Wallet, Plus, BarChart3, Target } from "lucide-react";
import { theme } from "@/components/lib/theme";
import { useState } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const Item = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const active = pathname === href;

    return (
      <Link
        href={href}
        style={{
          color: active ? theme.colors.primary : theme.colors.subtext,
          display: "grid",
          placeItems: "center",
          width: 44,
          height: 44,
          textDecoration: "none",
          borderRadius: 14,
          transition: "all 0.2s ease",
          background: active ? theme.colors.primarySoft : "transparent",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          setHoveredItem(label);
          if (!active) {
            e.currentTarget.style.background = theme.colors.bgLight;
            e.currentTarget.style.color = theme.colors.primary;
          }
        }}
        onMouseLeave={(e) => {
          setHoveredItem(null);
          if (!active) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = theme.colors.subtext;
          }
        }}
      >
        <Icon size={22} strokeWidth={active ? 2.5 : 2} />
      </Link>
    );
  };

  return (
    <div style={navWrapStyle}>
      <nav style={navStyle}>
        <Item href="/" icon={House} label="home" />
        <Item href="/transactions" icon={Wallet} label="transactions" />

        <Link
          href="/add"
          style={addButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.boxShadow = theme.shadow.xl;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = theme.shadow.lg;
          }}
        >
          <Plus size={28} strokeWidth={2.5} />
        </Link>

        <Item href="/analysis" icon={BarChart3} label="analysis" />
        <Item href="/goals" icon={Target} label="goals" />
      </nav>
    </div>
  );
}

const navWrapStyle = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: "max(12px, calc(env(safe-area-inset-bottom) + 4px))",
  zIndex: 999,
  display: "flex",
  justifyContent: "center",
  pointerEvents: "none",
  padding: "0 12px",
} as const;

const navStyle = {
  width: "100%",
  maxWidth: 390,
  background: theme.colors.card,
  borderRadius: 28,
  padding: "14px 18px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  border: `1.5px solid ${theme.colors.border}`,
  backdropFilter: "blur(12px)",
  boxShadow: theme.shadow.lg,
  pointerEvents: "auto",
  zIndex: 100,
  transition: "all 0.3s ease",
} as const;

const addButtonStyle = {
  width: 56,
  height: 56,
  borderRadius: "50%",
  background: theme.gradient.primary,
  color: "white",
  display: "grid",
  placeItems: "center",
  marginTop: -28,
  textDecoration: "none",
  boxShadow: theme.shadow.xl,
  transition: "all 0.2s ease",
  border: "2px solid rgba(255, 255, 255, 0.3)",
} as const;