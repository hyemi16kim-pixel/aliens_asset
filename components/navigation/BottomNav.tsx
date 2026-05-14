"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Wallet, Plus, BarChart3, Target } from "lucide-react";
import { theme } from "@/components/lib/theme";

export default function BottomNav() {
  const pathname = usePathname();

  const Item = ({ href, icon: Icon }: { href: string; icon: any }) => {
    const active = pathname === href;

    return (
      <Link
        href={href}
        style={{
          color: active ? theme.colors.primary : theme.colors.subtext,
          display: "grid",
          placeItems: "center",
          width: 38,
          height: 38,
          textDecoration: "none",
        }}
      >
        <Icon size={18} />
      </Link>
    );
  };

  return (
    <div style={navWrapStyle}>
      <nav style={navStyle}>
        <Item href="/" icon={House} />
        <Item href="/transactions" icon={Wallet} />

        <Link href="/add" style={addButtonStyle}>
          <Plus size={24} />
        </Link>

        <Item href="/analysis" icon={BarChart3} />
        <Item href="/goals" icon={Target} />
      </nav>
    </div>
  );
}

const navWrapStyle = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 10,
  zIndex: 999,
  display: "flex",
  justifyContent: "center",
  pointerEvents: "none",
  padding: "0 12px",
} as const;

const navStyle = {
  width: "100%",
  maxWidth: 390,
  background: "#FFFFFF",
  borderRadius: 24,
  padding: "12px 16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  border: `1px solid ${theme.colors.border}`,
  backdropFilter: "none",
  boxShadow: "0 8px 22px rgba(103,91,150,0.08)",
  pointerEvents: "auto",
  zIndex: 100,
} as const;

const addButtonStyle = {
  width: 52,
  height: 52,
  borderRadius: "50%",
  background: theme.colors.primary,
  color: "white",
  display: "grid",
  placeItems: "center",
  marginTop: -26,
  textDecoration: "none",
  boxShadow: "0 10px 22px rgba(143,124,255,0.25)",
} as const;