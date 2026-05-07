import BottomNav from "@/components/navigation/BottomNav";

export default function ProfilePage() {
  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <h1 style={titleStyle}>프로필 👽</h1>

        <div style={cardStyle}>
          <div style={{ fontSize: "54px", marginBottom: "12px" }}>👽💕👽</div>
          <strong>Alien Couple</strong>
          <p style={{ color: "#777", marginTop: "8px" }}>
            familyCode: ALIEN-001
          </p>
        </div>
        <BottomNav />
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#f8f6ff",
  padding: "20px",
  display: "flex",
  justifyContent: "center",
} as const;

const containerStyle = {
  width: "100%",
  maxWidth: "430px",
  display: "flex",
  flexDirection: "column",
  gap: "20px",
} as const;

const titleStyle = {
  fontSize: "28px",
  fontWeight: "bold",
} as const;

const cardStyle = {
  background: "white",
  borderRadius: "24px",
  padding: "22px",
  textAlign: "center",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
} as const;