"use client";

import { theme } from "@/components/lib/theme";

type CategoryItem = {
  category: string;
  amount: number;
};

export default function SpendingCategoryCard({
  items = [],
}: {
  items?: CategoryItem[];
}) {

  const colors = [theme.colors.primary, theme.colors.pinkDark, theme.colors.mintDark, theme.colors.yellowDark];
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  const getPercent = (amount: number) => {
    if (!total) return "0%";
    return `${Math.round((amount / total) * 100)}%`;
  };

  const gradient =
    items.length === 0
      ? "#F3F0FA"
      : `conic-gradient(${items
          .map((item, index) => {
            const start =
              items
                .slice(0, index)
                .reduce((sum, cur) => sum + (cur.amount / total) * 100, 0) || 0;
            const end = start + (item.amount / total) * 100;
            return `${colors[index]} ${start}% ${end}%`;
          })
          .join(", ")})`;

  return (
    <section
      style={{
        background: theme.colors.card,
        borderRadius: 24,
        padding: "20px",
        border: `1px solid ${theme.colors.border}`,
        boxShadow: theme.shadow.sm,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <strong style={{ fontSize: 15, fontWeight: 800, color: theme.colors.text }}>소비 카테고리 TOP 4</strong>
        <span style={{ fontSize: 11, color: theme.colors.subtext, fontWeight: 600 }}>이번 달</span>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: gradient,
            display: "grid",
            placeItems: "center",
            boxShadow: `0 8px 20px ${items.length === 0 ? "rgba(156, 140, 255, 0.15)" : "rgba(156, 140, 255, 0.25)"}`,
            position: "relative",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: theme.colors.card,
              boxShadow: `inset 0 2px 4px rgba(0, 0, 0, 0.05)`,
            }}
          />
        </div>

        <div style={{ flex: 1 }}>
          {items.length === 0 ? (
            <div style={{ fontSize: 12, color: theme.colors.subtext, padding: "8px" }}>
              소비 데이터가 없습니다.
            </div>
          ) : (
            items.map((item, i) => (
              <div
                key={item.category}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  marginBottom: i < items.length - 1 ? 8 : 0,
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: colors[i],
                      flexShrink: 0,
                      boxShadow: `0 2px 4px ${colors[i]}40`,
                    }}
                  />
                  <span style={{ color: theme.colors.text, fontWeight: 600 }}>
                    {item.category}
                  </span>
                </div>

                <strong style={{ color: theme.colors.primary }}>{getPercent(item.amount)}</strong>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}