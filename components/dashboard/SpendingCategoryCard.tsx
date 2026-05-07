"use client";


type CategoryItem = {
  category: string;
  amount: number;
};

export default function SpendingCategoryCard({
  items = [],
}: {
  items?: CategoryItem[];
}) {

  const colors = ["#8F7CFF", "#F8C8DC", "#B8F3D9", "#F7E3A1"];
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
        background: "white",
        borderRadius: 22,
        padding: "16px",
        border: "1px solid #E9E3F7",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <strong style={{ fontSize: 14 }}>소비 카테고리 TOP 4</strong>
        <span style={{ fontSize: 11, color: "#9B96AA" }}>이번 달</span>
      </div>

      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div
          style={{
            width: 82,
            height: 82,
            borderRadius: "50%",
            background: gradient,
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "white",
            }}
          />
        </div>

        <div style={{ flex: 1 }}>
          {items.length === 0 ? (
            <div style={{ fontSize: 12, color: "#9B96AA" }}>
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
                  marginBottom: 6,
                }}
              >
                <div style={{ display: "flex", gap: 6 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: colors[i],
                      marginTop: 4,
                    }}
                  />
                  {item.category}
                </div>

                <strong>{getPercent(item.amount)}</strong>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}