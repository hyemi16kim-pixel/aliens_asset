"use client";

import { useEffect, useState } from "react";
import BottomNav from "@/components/navigation/BottomNav";
import { theme } from "@/components/lib/theme";
import {
  ChevronLeft,
  Settings,
  Bell,
  Palette,
  Shield,
  Users,
  CreditCard,
  Landmark,
  PiggyBank,
  Wallet,
  ChartCandlestick,
  ChevronRight,
  X,
  CalendarDays,
  Copy,
} from "lucide-react";

type ProfileData = {
  familyCode: string;
  familyName: string;
  users: { id: number; name: string }[];
  totalAsset: number;
  monthlySaving: number;
  goalPercent: number;
};

type MenuKey = "family" | "month" | "account" | "alert" | "security" | "app";

const menuItems: { key: MenuKey; icon: React.ReactNode; label: string }[] = [
  { key: "family", icon: <Users size={18} />, label: "가족 관리" },
  { key: "month", icon: <CalendarDays size={18} />, label: "월 설정" },
  { key: "alert", icon: <Bell size={18} />, label: "알림 설정" },
  { key: "security", icon: <Shield size={18} />, label: "보안 설정" },
  { key: "app", icon: <Settings size={18} />, label: "앱 설정" },
];

const colorOptions = [
  "#ff9e9e", // 빨강
  "#ffcd9d", // 주황
  "#ffeb9d", // 노랑
  "#9ac7a0d6", // 초록
  "#90beffd1", // 파랑
  "#6565e2", // 남색
  "#B980F0", // 보라
  "#ffafef", // 핑크
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activeMenu, setActiveMenu] = useState<MenuKey | null>(null);
  const [familyNameSetting, setFamilyNameSetting] = useState("Alien Family");
  const [myNameSetting, setMyNameSetting] = useState("민준");
  const [partnerNameSetting, setPartnerNameSetting] = useState("지영");
  const [myColor, setMyColor] = useState("#BFEFE0");
  const [partnerColor, setPartnerColor] = useState("#FFD6E8");
  
useEffect(() => {
  fetch("/api/profile")
    .then((res) => res.json())
    .then((data) => {
      const savedFamilyName = localStorage.getItem("alien_family_name");
      const savedMyName = localStorage.getItem("alien_my_name");
      const savedPartnerName = localStorage.getItem("alien_partner_name");
      const savedMyColor = localStorage.getItem("alien_my_color");
      const savedPartnerColor = localStorage.getItem("alien_partner_color");

      if (savedMyColor) setMyColor(savedMyColor);
      if (savedPartnerColor) setPartnerColor(savedPartnerColor);

      setProfile(data);
      setFamilyNameSetting(savedFamilyName || data?.familyName || "Alien Family");
      setMyNameSetting(savedMyName || "민준");
      setPartnerNameSetting(savedPartnerName || "지영");
    })
    .catch(console.error);
}, []);

  const moneyShort = (v: number) => `₩${Number(v || 0).toLocaleString()}`;

  const copyFamilyCode = async () => {
    await navigator.clipboard.writeText(profile?.familyCode || "ALIEN-001");
    alert("가족 코드가 복사되었습니다.");
  };
  const openFamilyMenu = () => {
    setFamilyNameSetting(
      localStorage.getItem("alien_family_name") ||
        profile?.familyName ||
        "Alien Family"
    );

    setMyNameSetting(localStorage.getItem("alien_my_name") || "민준");
    setPartnerNameSetting(localStorage.getItem("alien_partner_name") || "지영");
    setMyColor(localStorage.getItem("alien_my_color") || "#BFEFE0");
    setPartnerColor(localStorage.getItem("alien_partner_color") || "#FFD6E8");

    setActiveMenu("family");
  };

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <button onClick={() => history.back()} style={iconButtonStyle}>
            <ChevronLeft size={22} />
          </button>
          <strong style={{ fontSize: 18 }}>프로필</strong>
          <button onClick={() => setActiveMenu("app")} style={iconButtonStyle}>
            <Settings size={20} color={theme.colors.primary} />
          </button>
        </header>

        <section style={profileCardStyle}>
          <div style={avatarRowStyle}>
            {(profile?.users?.length ? profile.users : [{ id: 1, name: "나" }])
              .slice(0, 2)
              .map((user) => (
                <div key={user.id} style={avatarStyle}>
                  👽
                </div>
              ))}
          </div>

          <strong style={{ display: "block", fontSize: 18, marginTop: 12 }}>
            {familyNameSetting}
          </strong>

          <button onClick={copyFamilyCode} style={familyCodeButtonStyle}>
            
            familyCode: {profile?.familyCode || "ALIEN-001"}
            <Copy size={12} />
          </button>

          <div style={statsGridStyle}>
            <StatBox label="총 자산" value={moneyShort(profile?.totalAsset || 0)} />
            <StatBox label="월 저축" value={moneyShort(profile?.monthlySaving || 0)} />
            <StatBox label="목표" value={`${profile?.goalPercent || 0}%`} />
          </div>
        </section>

        <section style={menuSectionStyle}>
          {menuItems.map((item, i) => (
            <button
              key={item.key}
              onClick={() =>
                item.key === "family" ? openFamilyMenu() : setActiveMenu(item.key)
              }
              style={{
                ...menuItemStyle,
                borderBottom:
                  i !== menuItems.length - 1
                    ? `1px solid ${theme.colors.border}`
                    : "none",
              }}
            >
              <div style={menuLeftStyle}>
                <div style={menuIconStyle}>{item.icon}</div>
                {item.label}
              </div>
              <ChevronRight size={18} color={theme.colors.subtext} />
            </button>
          ))}
        </section>

        <BottomNav />
      </div>

      {activeMenu && (
        <div style={overlayStyle} onClick={() => setActiveMenu(null)}>
          <section style={sheetStyle} onClick={(e) => e.stopPropagation()}>
            <div style={sheetHeaderStyle}>
              <strong>{getMenuTitle(activeMenu)}</strong>
              <button onClick={() => setActiveMenu(null)} style={iconButtonStyle}>
                <X size={18} />
              </button>
            </div>

            <SheetContent
              myColor={myColor}
              partnerColor={partnerColor}
              setMyColor={setMyColor}
              setPartnerColor={setPartnerColor}
              menu={activeMenu}
              profile={profile}
              familyNameSetting={familyNameSetting}

              myNameSetting={myNameSetting}
              partnerNameSetting={partnerNameSetting}
              onSaveNames={(familyName, myName, partnerName) => {
                localStorage.setItem("alien_family_name", familyName);
                localStorage.setItem("alien_my_name", myName);
                localStorage.setItem("alien_partner_name", partnerName);
                setFamilyNameSetting(familyName);
                setMyNameSetting(myName);
                setPartnerNameSetting(partnerName);
                alert("저장되었습니다.");
                setActiveMenu(null);
                
              }}
            />

          </section>
        </div>
      )}
    </main>
  );
}

function SheetContent({
  myColor,
  partnerColor,
  setMyColor,
  setPartnerColor,
  menu,
  profile,
  familyNameSetting,
  myNameSetting,
  partnerNameSetting,
  onSaveNames,
}: {
  myColor: string;
  partnerColor: string;
  setMyColor: (color: string) => void;
  setPartnerColor: (color: string) => void;
  menu: MenuKey;
  profile: ProfileData | null;
  familyNameSetting: string;
  myNameSetting: string;
  partnerNameSetting: string;
  onSaveNames: (
    familyName: string,
    myName: string,
    partnerName: string
  ) => void;
}) {
if (menu === "family") {
  return (
    <FamilySheet
      profile={profile}
      familyNameSetting={familyNameSetting}
      myNameSetting={myNameSetting}
      partnerNameSetting={partnerNameSetting}
      myColor={myColor}
      partnerColor={partnerColor}
      setMyColor={setMyColor}
      setPartnerColor={setPartnerColor}
      onSaveNames={onSaveNames}
    />
  );
}

              if (menu === "month") {
                return <MonthSheet />;
              }

if (menu === "account") {
  return <AccountSheet />;
}

  if (menu === "alert") {
    return (
      <div style={sheetBodyStyle}>
        <ToggleRow label="월 예산 초과 알림" />
        <ToggleRow label="목표 달성 알림" />
        <ToggleRow label="반복 거래 알림" />
      </div>
    );
  }

  if (menu === "security") {
    return (
      <div style={sheetBodyStyle}>
        <ToggleRow label="앱 잠금" />
        <ToggleRow label="가족 코드 숨기기" />
      </div>
    );
  }

  return (
    <div style={sheetBodyStyle}>
      <div style={infoRowStyle}>
        <span>테마</span>
        <strong>Alien Pastel</strong>
      </div>
      <div style={infoRowStyle}>
        <span>버전</span>
        <strong>0.1.0</strong>
      </div>
    </div>
  );
}

function FamilySheet({
  profile,
  familyNameSetting,
  myNameSetting,
  partnerNameSetting,
  myColor,
  partnerColor,
  setMyColor,
  setPartnerColor,
  onSaveNames,
}: {
  profile: ProfileData | null;
  familyNameSetting: string;
  myNameSetting: string;
  partnerNameSetting: string;
  myColor: string;
  partnerColor: string;
  setMyColor: (color: string) => void;
  setPartnerColor: (color: string) => void;
  onSaveNames: (
    familyName: string,
    myName: string,
    partnerName: string
  ) => void;
}) {
  const [familyName, setFamilyName] = useState(familyNameSetting);
  const [myName, setMyName] = useState(myNameSetting);
  const [partnerName, setPartnerName] = useState(partnerNameSetting);
  const [colorPickerOpen, setColorPickerOpen] = useState<
    "me" | "partner" | null
  >(null);

  return (
    <div style={sheetBodyStyle}>
      <label style={sheetLabelStyle}>가족 이름</label>
      <input
        value={familyName}
        onChange={(e) => setFamilyName(e.target.value)}
        placeholder="가족 이름 입력"
        style={sheetInputStyle}
      />

      <label style={sheetLabelStyle}>내 이름</label>
      <div style={nameColorRowStyle}>
        <input
          value={myName}
          onChange={(e) => setMyName(e.target.value)}
          placeholder="내 이름 입력"
          style={sheetInputStyle}
        />

        <button
          onClick={() => setColorPickerOpen(colorPickerOpen === "me" ? null : "me")}
          style={{ ...paletteButtonStyle, color: myColor }}
        >
          <Palette size={18} />
        </button>
      </div>

      {colorPickerOpen === "me" && (
        <ColorPicker
          selectedColor={myColor}
          onSelect={(color) => {
            setMyColor(color);
            setColorPickerOpen(null);
          }}
        />
      )}

      <label style={sheetLabelStyle}>파트너 이름</label>
      <div style={nameColorRowStyle}>
        <input
          value={partnerName}
          onChange={(e) => setPartnerName(e.target.value)}
          placeholder="파트너 이름 입력"
          style={sheetInputStyle}
        />

        <button
          onClick={() =>
            setColorPickerOpen(colorPickerOpen === "partner" ? null : "partner")
          }
          style={{ ...paletteButtonStyle, color: partnerColor }}
        >
          <Palette size={18} />
        </button>
      </div>

      {colorPickerOpen === "partner" && (
        <ColorPicker
          selectedColor={partnerColor}
          onSelect={(color) => {
            setPartnerColor(color);
            setColorPickerOpen(null);
          }}
        />
      )}

      <div style={infoRowStyle}>
        <span>가족 코드</span>
        <strong>{profile?.familyCode || "ALIEN-001"}</strong>
      </div>

      <div style={memberInlineRowStyle}>
        <span style={{ ...memberPillStyle, background: myColor }}>
          👽 {myName} · 나
        </span>
        <span style={{ ...memberPillStyle, background: partnerColor }}>
          👽 {partnerName} · 파트너
        </span>
      </div>

      <button
        style={primaryButtonStyle}
        onClick={() => {
          localStorage.setItem("alien_my_color", myColor);
          localStorage.setItem("alien_partner_color", partnerColor);
          onSaveNames(familyName, myName, partnerName);
        }}
      >
        저장하기
      </button>

      <button style={secondaryButtonStyle}>가족 초대하기</button>
    </div>
  );
}

function ColorPicker({
  selectedColor,
  onSelect,
}: {
  selectedColor: string;
  onSelect: (color: string) => void;
}) {
  return (
    <div style={colorPickerRowStyle}>
      {colorOptions.map((color) => (
        <button
          key={color}
          onClick={() => onSelect(color)}
          style={{
            ...colorCircleStyle,
            background: color,
            border:
              selectedColor === color
                ? `3px solid ${theme.colors.text}`
                : "2px solid white",
          }}
        />
      ))}
    </div>
  );
}

function getAccountIcon(type: string) {
  if (type === "BANK") return <Landmark size={18} />;
  if (type === "STOCK") return <ChartCandlestick size={18} />;
  if (type === "CARD") return <CreditCard size={18} />;
  if (type === "SAVING") return <PiggyBank size={18} />;
  if (type === "CASH") return <Wallet size={18} />;
  return <Wallet size={18} />;
}

function MonthSheet() {
  const [monthStartDay, setMonthStartDay] = useState(
    localStorage.getItem("alien_month_start_day") || "1"
  );

  const [budgets, setBudgets] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("alien_category_budgets");
    return saved ? JSON.parse(saved) : {};
  });

  const iconEmojiMap: Record<string, string> = {
    식비: "🍽️",
    카페: "☕",
    쇼핑: "🛒",
    교통: "🚌",
    생활: "🏠",
    데이트: "💗",
    게임: "🎮",
    영화: "🎬",
    선물: "🎁",
    병원: "🏥",
    공부: "📚",
    운동: "🏋️",
    여행: "✈️",
    의류: "👕",
    통신: "📱",
    반려: "🐾",
    육아: "👶",
    음악: "🎵",
  };

  const getCategories = () => {
    const saved = localStorage.getItem("alien_custom_categories_EXPENSE");
    const list = saved ? JSON.parse(saved) : [];

  return list
    .map((item: any) => ({
      name: item.name,
      icon: iconEmojiMap[item.iconKey] || "👽",
    }))
   .sort((a: any, b: any) => a.name.localeCompare(b.name, "ko-KR"));
  };

  const categories = getCategories();
  const totalBudget = Object.values(budgets).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );
  const saveMonthSetting = () => {
    localStorage.setItem("alien_month_start_day", monthStartDay);
    localStorage.setItem("alien_category_budgets", JSON.stringify(budgets));
    alert("월 설정이 저장되었습니다.");
  };

  return (
    <div style={sheetBodyStyle}>
      <label style={sheetLabelStyle}>월 시작일</label>
      <select
        value={monthStartDay}
        onChange={(e) => setMonthStartDay(e.target.value)}
        style={sheetInputStyle}
      >
        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
          <option key={day} value={day}>
            매월 {day}일
          </option>
        ))}
      </select>

      <label style={sheetLabelStyle}>카테고리별 월 예산</label>
<div style={budgetTotalBoxStyle}>
  <span>총 예산</span>
  <strong>{totalBudget.toLocaleString()}원</strong>
</div>

      {categories.length === 0 ? (
        <div style={emptyBudgetStyle}>
          먼저 거래 추가 화면에서 지출 카테고리를 추가해주세요.
        </div>
      ) : (
        <div style={budgetListStyle}>
          {categories.map((category: any) => (
            <div key={category.name} style={budgetRowStyle}>
              <div style={budgetCategoryStyle}>
                <span>{category.icon}</span>
                <strong>{category.name}</strong>
              </div>

              <input
                value={
                  budgets[category.name]
                    ? Number(budgets[category.name]).toLocaleString()
                    : ""
                }
                onChange={(e) =>
                  setBudgets((prev) => ({
                    ...prev,
                    [category.name]: e.target.value.replace(/[^0-9]/g, ""),
                  }))
                }
                placeholder="0"
                style={budgetInputStyle}
              />
            </div>
          ))}
        </div>
      )}

      <button onClick={saveMonthSetting} style={primaryButtonStyle}>
        저장하기
      </button>
    </div>
  );
}

function AccountSheet() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState("BANK");
  const [newBalance, setNewBalance] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("BANK");
  const [editBalance, setEditBalance] = useState("");
  const loadAccounts = async () => {
    fetch("/api/accounts")
      .then((res) => res.json())
      .then(setAccounts)
      .catch(console.error);
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const getTypeLabel = (type: string) => {
    if (type === "BANK") return "은행";
    if (type === "STOCK") return "증권";
    if (type === "CARD") return "카드";
    if (type === "CASH") return "현금";
    if (type === "SAVING") return "저축";
    return "기타";
  };

  const openEdit = (account: any) => {
    setSelectedAccount(account);
    setEditName(account.name);
    setEditType(account.type);
    setEditBalance(String(account.balance || 0));
  };

  const updateAccount = async () => {
    if (!selectedAccount) return;

    const res = await fetch("/api/accounts", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: selectedAccount.id,
        name: editName,
        type: editType,
        balance: Number(editBalance || 0),
      }),
    });

    if (!res.ok) {
      alert("계좌 수정 실패");
      return;
    }

    setSelectedAccount(null);
    await loadAccounts();
  };

  const deleteAccount = async () => {
    if (!selectedAccount) return;
    if (!confirm("계좌를 삭제할까요?")) return;

    const res = await fetch(`/api/accounts?id=${selectedAccount.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("계좌 삭제 실패");
      return;
    }

    setSelectedAccount(null);
    await loadAccounts();
  };

  const addAccount = async () => {
    if (!newAccountName) {
      alert("계좌명을 입력하세요.");
      return;
    }

    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newAccountName,
        type: newAccountType,
        balance: Number(newBalance || 0),
      }),
    });

    if (!res.ok) {
      alert("계좌 추가 실패");
      return;
    }

    setNewAccountName("");
    setNewAccountType("BANK");
    setNewBalance("");
    await loadAccounts();
  };

  return (
    <div style={sheetBodyStyle}>
      {accounts.map((account) => (
        <button
          key={account.id}
          onClick={() => openEdit(account)}
          style={accountRowStyle}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={accountIconStyle}>
              {getAccountIcon(account.type)}
            </div>

            <div>
            <div style={{ fontWeight: 900 }}>{account.name}</div>
            <div style={{ fontSize: 11, color: theme.colors.subtext, marginTop: 2 }}>
              {getTypeLabel(account.type)}
            </div></div>
          </div>

          <strong>{Number(account.balance || 0).toLocaleString()}원</strong>
        </button>
      ))}
{!selectedAccount && (
  <>
    <label style={sheetLabelStyle}>계좌명</label>
    <input
      value={newAccountName}
      onChange={(e) => setNewAccountName(e.target.value)}
      placeholder="예: 신한은행"
      style={sheetInputStyle}
    />

    <label style={sheetLabelStyle}>계좌 유형</label>
    <select
      value={newAccountType}
      onChange={(e) => setNewAccountType(e.target.value)}
      style={sheetInputStyle}
    >
      <option value="BANK">은행</option>
      <option value="STOCK">증권</option>
      <option value="CARD">카드</option>
      <option value="CASH">현금</option>
      <option value="SAVING">저축</option>
    </select>

    <label style={sheetLabelStyle}>초기 잔액</label>
    <input
      value={newBalance ? Number(newBalance).toLocaleString() : ""}
      onChange={(e) => setNewBalance(e.target.value.replace(/[^0-9]/g, ""))}
      placeholder="0"
      style={sheetInputStyle}
    />

    <button style={primaryButtonStyle} onClick={addAccount}>
      + 계좌 추가하기
    </button>
  </>
)}

{selectedAccount && (
  <div style={editBoxStyle}>
<div style={editHeaderRowStyle}>
  <strong style={{ fontSize: 14 }}>계좌 수정</strong>

  <button
    onClick={() => setSelectedAccount(null)}
    style={backTextButtonStyle}
  >
    ← 계좌 추가로 돌아가기
  </button>
</div>

    <label style={sheetLabelStyle}>계좌명</label>
    <input
      value={editName}
      onChange={(e) => setEditName(e.target.value)}
      style={sheetInputStyle}
    />

    <label style={sheetLabelStyle}>유형</label>
    <select
      value={editType}
      onChange={(e) => setEditType(e.target.value)}
      style={sheetInputStyle}
    >
      <option value="BANK">은행</option>
      <option value="STOCK">증권</option>
      <option value="CARD">카드</option>
      <option value="CASH">현금</option>
      <option value="SAVING">저축</option>
    </select>

    <label style={sheetLabelStyle}>잔액</label>
    <input
      value={Number(editBalance || 0).toLocaleString()}
      onChange={(e) => setEditBalance(e.target.value.replace(/[^0-9]/g, ""))}
      style={sheetInputStyle}
    />

    <div style={editActionGridStyle}>
      <button onClick={deleteAccount} style={deleteButtonStyle}>
        삭제
      </button>

      <button onClick={updateAccount} style={primaryButtonStyle}>
        저장
      </button>
    </div>
  </div>
)}
    </div>
  );
}

function ToggleRow({ label }: { label: string }) {
  const [on, setOn] = useState(true);

  return (
    <button onClick={() => setOn(!on)} style={toggleRowStyle}>
      <span>{label}</span>
      <span style={{ ...toggleStyle, background: on ? theme.colors.primary : "#DDD" }}>
        <span
          style={{
            ...toggleDotStyle,
            transform: on ? "translateX(18px)" : "translateX(0)",
          }}
        />
      </span>
    </button>
  );
}

function getMenuTitle(menu: MenuKey) {
  if (menu === "family") return "가족 관리";
  if (menu === "alert") return "알림 설정";
  if (menu === "security") return "보안 설정";
  if (menu === "month") return "월 설정";
  return "앱 설정";
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={statBoxStyle}>
      <div style={{ fontSize: 11, opacity: 0.85 }}>{label}</div>
      <strong style={{ display: "block", marginTop: 4, fontSize: 14 }}>{value}</strong>
    </div>
  );
}

const pageStyle = { minHeight: "100vh", background: "#FFFFFF", padding: "14px 12px 82px", display: "flex", justifyContent: "center" } as const;
const containerStyle = { width: "100%", maxWidth: 390, display: "flex", flexDirection: "column", gap: 14 } as const;
const headerStyle = { display: "flex", alignItems: "center", justifyContent: "space-between" } as const;
const iconButtonStyle = { border: "none", background: "transparent", padding: 4, cursor: "pointer" } as const;
const profileCardStyle = { background: `linear-gradient(135deg, ${theme.colors.primary} 0%, #B6AAFF 100%)`, color: "white", borderRadius: 24, padding: 20, textAlign: "center" } as const;
const avatarRowStyle = { display: "flex", justifyContent: "center", gap: 10 } as const;
const avatarStyle = { width: 54, height: 54, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "grid", placeItems: "center", fontSize: 28 } as const;
const familyCodeButtonStyle = { marginTop: 4, border: "none", background: "transparent", color: "rgba(255,255,255,0.9)", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5 } as const;
const statsGridStyle = { marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 } as const;
const statBoxStyle = { background: "rgba(255,255,255,0.18)", borderRadius: 16, padding: "10px", textAlign: "center" } as const;
const menuSectionStyle = { background: "white", borderRadius: 22, padding: "0 16px", border: `1px solid ${theme.colors.border}` } as const;
const menuItemStyle = { width: "100%", border: "none", background: "white", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", cursor: "pointer" } as const;
const menuLeftStyle = { display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 800 } as const;
const menuIconStyle = { width: 36, height: 36, borderRadius: 14, background: theme.colors.primarySoft, display: "grid", placeItems: "center", color: theme.colors.primary } as const;
const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(24,17,27,0.28)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
  padding: 18,
} as const;

const sheetStyle = {
  width: "100%",
  maxWidth: 360,
  background: "white",
  borderRadius: 26,
  padding: "18px 18px 24px",
  boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
} as const;
const sheetLabelStyle = {
  fontSize: 13,
  fontWeight: 900,
  color: theme.colors.subtext,
  marginBottom: -2,
} as const;

const sheetInputStyle = {
  width: "100%",
  height: 48,
  borderRadius: 16,
  border: `1px solid ${theme.colors.border}`,
  padding: "0 14px",
  fontSize: 15,
  fontWeight: 800,
  outline: "none",
  background: "#FFFFFF",
} as const;

const secondaryButtonStyle = {
  height: 52,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: 18,
  background: "#FFFFFF",
  color: theme.colors.text,
  fontWeight: 900,
} as const;

const sheetHeaderStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 } as const;
const sheetBodyStyle = { display: "flex", flexDirection: "column", gap: 10 } as const;
const infoRowStyle = { minHeight: 48, borderRadius: 16, border: `1px solid ${theme.colors.border}`, padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14 } as const;
const primaryButtonStyle = { height: 52, border: "none", borderRadius: 18, background: theme.colors.primary, color: "white", fontWeight: 900 } as const;
const toggleRowStyle = { height: 52, borderRadius: 16, border: `1px solid ${theme.colors.border}`, background: "white", padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 800 } as const;
const toggleStyle = { width: 42, height: 24, borderRadius: 999, padding: 3, display: "flex", alignItems: "center", transition: "0.2s" } as const;
const toggleDotStyle = { width: 18, height: 18, borderRadius: 999, background: "white", transition: "0.2s" } as const;
const colorPickerRowStyle = {
  display: "flex",
  gap: 10,
  marginBottom: 8,
  flexWrap: "wrap",
} as const;

const colorCircleStyle = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  cursor: "pointer",
} as const;

const nameColorRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 44px",
  gap: 8,
} as const;

const paletteButtonStyle = {
  height: 48,
  borderRadius: 16,
  border: `1px solid ${theme.colors.border}`,
  background: "#FFFFFF",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
} as const;

const editBoxStyle = {
  marginTop: 14,
  paddingTop: 14,
  borderTop: `1px solid ${theme.colors.border}`,
  display: "flex",
  flexDirection: "column",
  gap: 8,
} as const;

const editActionGridStyle = {
  display: "grid",
  gridTemplateColumns: "96px 1fr",
  gap: 10,
  marginTop: 8,
} as const;

const deleteButtonStyle = {
  height: 52,
  border: "none",
  borderRadius: 18,
  background: "#FFF3F6",
  color: theme.colors.expense,
  fontWeight: 900,
  cursor: "pointer",
} as const;

const memberInlineRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
} as const;

const memberPillStyle = {
  minHeight: 42,
  borderRadius: 16,
  color: "#FFFFFF",
  display: "grid",
  placeItems: "center",
  fontSize: 13,
  fontWeight: 900,
} as const;

const accountRowStyle = {
  minHeight: 56,
  borderRadius: 16,
  border: `1px solid ${theme.colors.border}`,
  padding: "0 14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: 14,
} as const;

const accountIconStyle = {
  width: 38,
  height: 38,
  borderRadius: 14,
  background: theme.colors.primarySoft,
  display: "grid",
  placeItems: "center",
  color: theme.colors.primary,
  flexShrink: 0,
} as const;

const editHeaderRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 4,
} as const;

const backTextButtonStyle = {
  border: "none",
  background: "transparent",
  color: theme.colors.primary,
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
  padding: 0,
} as const;

const budgetListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
} as const;

const budgetRowStyle = {
  minHeight: 52,
  borderRadius: 16,
  border: `1px solid ${theme.colors.border}`,
  padding: "8px 10px",
  display: "grid",
  gridTemplateColumns: "1fr 120px",
  alignItems: "center",
  gap: 8,
} as const;

const budgetCategoryStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
} as const;

const budgetInputStyle = {
  height: 38,
  borderRadius: 12,
  border: `1px solid ${theme.colors.border}`,
  padding: "0 10px",
  textAlign: "right",
  fontWeight: 900,
  outline: "none",
} as const;

const emptyBudgetStyle = {
  borderRadius: 16,
  border: `1px solid ${theme.colors.border}`,
  padding: 14,
  fontSize: 12,
  color: theme.colors.subtext,
} as const;

const budgetTotalBoxStyle = {
  minHeight: 46,
  borderRadius: 16,
  background: theme.colors.primarySoft,
  color: theme.colors.primary,
  padding: "0 14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: 13,
  fontWeight: 900,
} as const;