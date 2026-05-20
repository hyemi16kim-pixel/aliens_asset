"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { theme } from "@/components/lib/theme";
import BottomNav from "@/components/navigation/BottomNav";
import { cacheProfileSettings } from "@/components/lib/profileSettings";
import {
  getCurrentFamilyCode,
  getCurrentFamilyId,
  getCurrentUserId,
  setCurrentUserId,
  getAllFamilyCodes,
  setCurrentFamily,
  hasFamilyCode,
  type FamilyEntry,
} from "@/components/lib/familyCode";
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
  Home,
  Utensils,
  Coffee,
  ShoppingCart,
  Bus,
  Heart,
  Gamepad2,
  Film,
  Gift,
  Hospital,
  BookOpen,
  Dumbbell,
  Plane,
  Shirt,
  Smartphone,
  PawPrint,
  Baby,
  Music,
  Briefcase,
  Building,
  TrendingUp,
  RefreshCw,
  Zap,
  Coins,
  Pencil,
  HandCoins,
  Trophy,
  Banknote,
  Store,
} from "lucide-react";

type ProfileData = {
  familyCode: string;
  familyName: string;
  users: { id: number; name: string }[];
  totalAsset: number;
  monthlySaving: number;
  goalPercent: number;
};

type MenuKey = "family" | "category" | "month" | "account" | "alert" | "security" | "app" | "familycode";

const menuItems: { key: MenuKey; icon: React.ReactNode; label: string }[] = [
  { key: "familycode", icon: <Shield size={18} />, label: "가족코드 관리" },
  { key: "family", icon: <Users size={18} />, label: "가족 관리" },
  { key: "category", icon: <Wallet size={18} />, label: "카테고리 관리" },
  { key: "month", icon: <CalendarDays size={18} />, label: "월 예산 설정" },
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
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activeMenu, setActiveMenu] = useState<MenuKey | null>(null);
  const [familyNameSetting, setFamilyNameSetting] = useState("Alien Family");
  const [myNameSetting, setMyNameSetting] = useState("");
  const [partnerNameSetting, setPartnerNameSetting] = useState("");
  const [myColor, setMyColor] = useState("#BFEFE0");
  const [partnerColor, setPartnerColor] = useState("#FFD6E8");
  const [currentCode, setCurrentCode] = useState("");
  const [familyCodes, setFamilyCodes] = useState<FamilyEntry[]>([]);
  // 나는 누구? 상태
  const [myUserId, setMyUserId] = useState<number>(0);
  const [ownerUser, setOwnerUser] = useState<{ id: number; name: string; color?: string } | null>(null);
  const [partnerUser, setPartnerUser] = useState<{ id: number; name: string; color?: string } | null>(null);
  const [switchingUser, setSwitchingUser] = useState(false);

  function refreshFamilyCodeState() {
    setCurrentCode(getCurrentFamilyCode());
    setFamilyCodes(getAllFamilyCodes());
  }

  useEffect(() => {
    if (!hasFamilyCode()) {
      router.replace("/setup");
      return;
    }
    refreshFamilyCodeState();

    const familyId = getCurrentFamilyId();
    const code = getCurrentFamilyCode();

    // 프로필(통계) 로드
    fetch(`/api/profile?code=${encodeURIComponent(code)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.familyId) {
          setCurrentFamily(code, data.familyId, data.familyName || code);
          refreshFamilyCodeState();
        }
        setProfile(data);
      })
      .catch(console.error);

    // 공유 설정 로드 (DB) - 현재 기기 userId 기준으로 나/파트너 구분
    const currentId = getCurrentUserId();
    setMyUserId(currentId);

    fetch(`/api/family-settings?familyId=${familyId}`)
      .then((res) => {
        if (res.status === 404) {
          router.replace("/setup");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data || data.error) return;
        setFamilyNameSetting(data.familyName || "Alien Family");

        // owner/partner 원본 저장 (나는 누구? UI용)
        setOwnerUser(data.owner || null);
        setPartnerUser(data.partner || null);

        // 내 userId와 일치하는 쪽이 "나", 나머지가 "파트너"
        const meIsOwner = !currentId || data.owner?.id === currentId;
        const me = meIsOwner ? data.owner : data.partner;
        const other = meIsOwner ? data.partner : data.owner;
        const meName = me?.name || "나";
        const meColor = me?.color || "#BFEFE0";
        const otherName = other?.name || "파트너";
        const otherColor = other?.color || "#FFD6E8";
        setMyNameSetting(meName);
        setMyColor(meColor);
        setPartnerNameSetting(otherName);
        setPartnerColor(otherColor);
        cacheProfileSettings(meName, otherName, meColor, otherColor);
      })
      .catch(console.error);
  }, [router]);

  // 나는 누구? 전환 함수
  const handleSwitchUser = (newMe: { id: number; name: string; color?: string }) => {
    const other = newMe.id === ownerUser?.id ? partnerUser : ownerUser;
    setSwitchingUser(true);
    setCurrentUserId(newMe.id);
    setMyUserId(newMe.id);
    const meName = newMe.name || "나";
    const otherName = other?.name || "파트너";
    const meColor = newMe.color || "#BFEFE0";
    const otherColor = other?.color || "#FFD6E8";
    setMyNameSetting(meName);
    setPartnerNameSetting(otherName);
    setMyColor(meColor);
    setPartnerColor(otherColor);
    cacheProfileSettings(meName, otherName, meColor, otherColor);
    setSwitchingUser(false);
  };

  const moneyShort = (v: number) => `₩${Number(v || 0).toLocaleString()}`;

  const copyFamilyCode = async () => {
    await navigator.clipboard.writeText(currentCode || profile?.familyCode || "ALIEN-001");
    alert("가족 코드가 복사되었습니다.");
  };
  const openFamilyMenu = () => {
    // state는 이미 API 로드 시 설정됨 - 바로 열기
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
            {currentCode || profile?.familyCode || "ALIEN-001"}
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
              currentCode={currentCode}
              familyCodes={familyCodes}
              onSaveNames={async (familyName, myName, partnerName, myColorVal, partnerColorVal) => {
                try {
                  const familyId = getCurrentFamilyId();
                  const myUserId = getCurrentUserId();

                  // DB에서 실제 owner/partner id 조회
                  const settingsRes = await fetch(`/api/family-settings?familyId=${familyId}`);
                  if (!settingsRes.ok) {
                    const err = await settingsRes.json().catch(() => ({}));
                    alert(`설정 조회 실패: ${err.error || settingsRes.status}`);
                    return;
                  }
                  const settings = await settingsRes.json();

                  const meIsOwner = !myUserId || settings.owner?.id === myUserId;

                  const patchRes = await fetch("/api/family-settings", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      familyId,
                      familyName,
                      ownerId:     meIsOwner ? settings.owner?.id    : settings.partner?.id,
                      ownerName:   meIsOwner ? myName                : partnerName,
                      ownerColor:  meIsOwner ? myColorVal            : partnerColorVal,
                      partnerId:   meIsOwner ? settings.partner?.id  : settings.owner?.id,
                      partnerName: meIsOwner ? partnerName           : myName,
                      partnerColor:meIsOwner ? partnerColorVal       : myColorVal,
                    }),
                  });

                  if (!patchRes.ok) {
                    const err = await patchRes.json().catch(() => ({}));
                    alert(`저장 실패: ${err.error || patchRes.status}\n상세: ${err.detail || "-"}`);
                    return;
                  }

                  // 로컬 상태 업데이트
                  setFamilyNameSetting(familyName);
                  setMyNameSetting(myName);
                  setPartnerNameSetting(partnerName);
                  setMyColor(myColorVal);
                  setPartnerColor(partnerColorVal);
                  // localStorage 캐시도 동기화
                  cacheProfileSettings(myName, partnerName, myColorVal, partnerColorVal);

                  alert("저장되었습니다.");
                  setActiveMenu(null);
                } catch (e: any) {
                  alert(`저장 중 오류: ${e.message}`);
                }
              }}
              onFamilyCodeSwitch={(entry) => {
                setCurrentFamily(entry.code, entry.id, entry.name);
                refreshFamilyCodeState();
                setActiveMenu(null);
                // 코드 전환 후 이 기기의 사용자(나/파트너)를 다시 선택
                router.replace("/setup?step=user");
              }}
              onFamilyCodeAdd={async (newCode) => {
                const trimmed = newCode.trim().toUpperCase();
                if (!trimmed) return;
                const res = await fetch(`/api/init?code=${encodeURIComponent(trimmed)}`);
                const data = await res.json();
                if (!data.family?.id) { alert("코드 연결 실패"); return; }
                setCurrentFamily(trimmed, data.family.id, data.family.code);
                refreshFamilyCodeState();
                setActiveMenu(null);
                // 새 코드 연결 후 이 기기의 사용자(나/파트너)를 선택
                router.replace("/setup?step=user");
              }}
              ownerUser={ownerUser}
              partnerUser={partnerUser}
              myUserId={myUserId}
              onSwitchUser={handleSwitchUser}
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
  currentCode,
  familyCodes,
  onSaveNames,
  onFamilyCodeSwitch,
  onFamilyCodeAdd,
  ownerUser,
  partnerUser,
  myUserId,
  onSwitchUser,
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
  currentCode: string;
  familyCodes: FamilyEntry[];
  onSaveNames: (familyName: string, myName: string, partnerName: string, ownerColor: string, partnerColor: string) => Promise<void>;
  onFamilyCodeSwitch: (entry: FamilyEntry) => void;
  onFamilyCodeAdd: (code: string) => Promise<void>;
  ownerUser?: { id: number; name: string; color?: string } | null;
  partnerUser?: { id: number; name: string; color?: string } | null;
  myUserId?: number | null;
  onSwitchUser?: (user: { id: number; name: string; color?: string }) => void;
}) {
if (menu === "familycode") {
  return (
    <FamilyCodeSheet
      currentCode={currentCode}
      familyCodes={familyCodes}
      onSwitch={onFamilyCodeSwitch}
      onAdd={onFamilyCodeAdd}
    />
  );
}

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
      ownerUser={ownerUser}
      partnerUser={partnerUser}
      myUserId={myUserId}
      onSwitchUser={onSwitchUser}
    />
  );
}

              if (menu === "category") {
                return <CategorySheet />;
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
  ownerUser,
  partnerUser,
  myUserId,
  onSwitchUser,
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
    partnerName: string,
    ownerColor: string,
    partnerColor: string,
  ) => Promise<void>;
  ownerUser?: { id: number; name: string; color?: string } | null;
  partnerUser?: { id: number; name: string; color?: string } | null;
  myUserId?: number | null;
  onSwitchUser?: (user: { id: number; name: string; color?: string }) => void;
}) {
  const [familyName, setFamilyName] = useState(familyNameSetting);
  const [myName, setMyName] = useState(myNameSetting);
  const [partnerName, setPartnerName] = useState(partnerNameSetting);
  const [colorPickerOpen, setColorPickerOpen] = useState<
    "me" | "partner" | null
  >(null);

  // API 로드 후 props가 바뀌면 내부 state 동기화
  useEffect(() => { setFamilyName(familyNameSetting); }, [familyNameSetting]);
  useEffect(() => { setMyName(myNameSetting); }, [myNameSetting]);
  useEffect(() => { setPartnerName(partnerNameSetting); }, [partnerNameSetting]);

  const users = [ownerUser, partnerUser].filter(Boolean) as { id: number; name: string; color?: string }[];

  return (
    <div style={sheetBodyStyle}>
      {/* 이 기기의 사용자 */}
      {users.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#A78BFA", marginBottom: 10, letterSpacing: 0.3 }}>
            📱 이 기기의 사용자
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {users.map((user) => {
              const isMe = myUserId ? user.id === myUserId : user.id === ownerUser?.id;
              const bgColor = user.color || (user.id === ownerUser?.id ? "#BFEFE0" : "#FFD6E8");
              return (
                <button
                  key={user.id}
                  onClick={() => !isMe && onSwitchUser?.(user)}
                  disabled={isMe}
                  style={{
                    flex: 1, borderRadius: 16,
                    border: isMe ? "2px solid #7C5CFF" : "1.5px solid #EDE6F9",
                    background: isMe ? "linear-gradient(135deg, #F4EFFE 0%, #EDE6FC 100%)" : "#FAFAFF",
                    padding: "12px 10px", cursor: isMe ? "default" : "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    transition: "all 0.18s", position: "relative",
                  }}
                >
                  {isMe && (
                    <div style={{
                      position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
                      background: "linear-gradient(135deg, #7C5CFF, #A78BFA)",
                      color: "white", fontSize: 10, fontWeight: 900,
                      borderRadius: 999, padding: "2px 10px", whiteSpace: "nowrap",
                    }}>나</div>
                  )}
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%", background: bgColor,
                    display: "grid", placeItems: "center", fontSize: 24,
                    border: isMe ? "2.5px solid #A78BFA" : "2px solid rgba(0,0,0,0.04)",
                    boxShadow: isMe ? "0 4px 12px rgba(124,92,255,0.20)" : "none",
                  }}>👽</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: isMe ? "#7C5CFF" : "#2D2545" }}>
                    {user.name || (user.id === ownerUser?.id ? "대표" : "파트너")}
                  </div>
                  <div style={{ fontSize: 10, color: "#B0A8C8", fontWeight: 600 }}>
                    {user.id === ownerUser?.id ? "가족 대표" : "파트너"}
                  </div>
                  {!isMe && (
                    <div style={{
                      fontSize: 10, color: "#A78BFA", fontWeight: 700,
                      background: "#F4EFFE", borderRadius: 8, padding: "2px 8px",
                    }}>탭하여 변경</div>
                  )}
                </button>
              );
            })}
          </div>
          <div style={{ height: 1, background: "#EDE6F9", margin: "16px 0" }} />
        </div>
      )}

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
        onClick={() => onSaveNames(familyName, myName, partnerName, myColor, partnerColor)}
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

function CategorySheet() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState("EXPENSE");
  const [selectedIcon, setSelectedIcon] = useState("home");
  const [isLoading, setIsLoading] = useState(true);

  const iconOptions = [
    { name: "home", icon: Home, label: "생활" },
    { name: "utensils", icon: Utensils, label: "식비" },
    { name: "coffee", icon: Coffee, label: "카페" },
    { name: "shopping", icon: ShoppingCart, label: "쇼핑" },
    { name: "bus", icon: Bus, label: "교통" },
    { name: "heart", icon: Heart, label: "데이트" },
    { name: "gamepad", icon: Gamepad2, label: "게임" },
    { name: "film", icon: Film, label: "영화" },
    { name: "gift", icon: Gift, label: "선물" },
    { name: "hospital", icon: Hospital, label: "병원" },
    { name: "book", icon: BookOpen, label: "공부" },
    { name: "dumbbell", icon: Dumbbell, label: "운동" },
    { name: "plane", icon: Plane, label: "여행" },
    { name: "shirt", icon: Shirt, label: "의류" },
    { name: "phone", icon: Smartphone, label: "통신" },
    { name: "paw", icon: PawPrint, label: "반려" },
    { name: "baby", icon: Baby, label: "육아" },
    { name: "music", icon: Music, label: "음악" },
    { name: "briefcase", icon: Briefcase, label: "급여" },
    { name: "building", icon: Building, label: "은행" },
    { name: "trending", icon: TrendingUp, label: "주식" },
    { name: "card", icon: CreditCard, label: "카드" },
    { name: "refresh", icon: RefreshCw, label: "이체" },
    { name: "zap", icon: Zap, label: "기타" },
    { name: "coins", icon: Coins, label: "코인" },
    { name: "pencil", icon: Pencil, label: "프리랜서" },
    { name: "handcoins", icon: HandCoins, label: "용돈" },
    { name: "trophy", icon: Trophy, label: "상금" },
    { name: "banknote", icon: Banknote, label: "지폐" },
    { name: "store", icon: Store, label: "사업" },
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch(`/api/categories?familyId=${getCurrentFamilyId()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (error) {
      console.error("카테고리 로드 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      alert("카테고리명을 입력하세요.");
      return;
    }

    if (categories.some((c) => c.name === name && c.type === newCategoryType)) {
      alert("이미 존재하는 카테고리입니다.");
      return;
    }

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: getCurrentFamilyId(),
          name,
          type: newCategoryType,
          displayOrder: categories.length,
          icon: selectedIcon,
        }),
      });

      if (!res.ok) throw new Error("추가 실패");

      const newCategory = await res.json();

      // 상태에 직접 추가 (빠른 업데이트)
      setCategories([...categories, newCategory]);

      setNewCategoryName("");
      setSelectedIcon("home");
    } catch (error) {
      console.error("카테고리 추가 오류:", error);
      alert("카테고리 추가에 실패했습니다.");
    }
  };

  const getIconComponent = (iconName: string) => {
    const opt = iconOptions.find((o) => o.name === iconName);
    if (opt) {
      return <opt.icon size={20} strokeWidth={2} />;
    }
    return <span>{iconName}</span>;
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("삭제 실패");

      // 상태에서 직접 제거 (빠른 업데이트)
      setCategories(categories.filter((c) => c.id !== id));
    } catch (error) {
      console.error("카테고리 삭제 오류:", error);
      alert("카테고리 삭제에 실패했습니다.");
    }
  };

  // 선택한 타입의 카테고리만 표시
  const currentCategories = categories.filter((c) => c.type === newCategoryType);

  const typeLabels = {
    EXPENSE: "지출 카테고리",
    INCOME: "수입 카테고리",
    TRANSFER: "이체 카테고리",
  };

  return (
    <div style={sheetBodyStyle}>
      <label style={sheetLabelStyle}>카테고리 타입</label>
      <select
        value={newCategoryType}
        onChange={(e) => setNewCategoryType(e.target.value)}
        style={sheetInputStyle}
      >
        <option value="EXPENSE">지출</option>
        <option value="INCOME">수입</option>
        <option value="TRANSFER">이체</option>
      </select>

      <label style={sheetLabelStyle}>카테고리명</label>
      <input
        value={newCategoryName}
        onChange={(e) => setNewCategoryName(e.target.value)}
        placeholder="카테고리명 입력"
        style={sheetInputStyle}
        onKeyPress={(e) => e.key === "Enter" && addCategory()}
      />

      <label style={sheetLabelStyle}>아이콘 선택</label>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: 6,
        marginBottom: 16,
        padding: 10,
        background: "linear-gradient(135deg, #f1edff 0%, #e5f5f0 100%)",
        borderRadius: 14,
        border: `1px solid ${theme.colors.border}`,
      }}>
        {iconOptions.map((opt) => {
          const pastelColors = [
            "#FFE5F0", // 핑크
            "#E5F5F0", // 민트
            "#FFF4D6", // 노랑
            "#F1EDFF", // 퍼플
            "#E5EDFF", // 블루
            "#FFE8D6", // 피치
          ];
          const colorIndex = iconOptions.indexOf(opt) % pastelColors.length;

          return (
            <button
              key={opt.name}
              onClick={() => setSelectedIcon(opt.name)}
              style={{
                background: selectedIcon === opt.name ? theme.colors.primary : pastelColors[colorIndex],
                color: selectedIcon === opt.name ? "white" : theme.colors.text,
                border: selectedIcon === opt.name ? `2px solid ${theme.colors.primaryDark}` : `1.5px solid ${theme.colors.border}`,
                borderRadius: 12,
                padding: 6,
                cursor: "pointer",
                transition: "all 0.2s ease",
                width: "100%",
                aspectRatio: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                if (selectedIcon !== opt.name) {
                  e.currentTarget.style.transform = "scale(1.08)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
              title={opt.label}
            >
              <opt.icon size={20} strokeWidth={2} />
            </button>
          );
        })}
      </div>

      <button onClick={addCategory} style={primaryButtonStyle}>
        추가하기
      </button>

      {isLoading ? (
        <div style={{ padding: 16, textAlign: "center", color: theme.colors.subtext }}>로딩 중...</div>
      ) : currentCategories.length === 0 ? (
        <div style={{
          padding: 20,
          textAlign: "center",
          color: theme.colors.subtext,
          background: theme.colors.bgLight,
          borderRadius: 12,
          marginTop: 16,
        }}>
          추가된 {typeLabels[newCategoryType as keyof typeof typeLabels]}가 없습니다.
        </div>
      ) : (
        <>
          <label style={sheetLabelStyle}>{typeLabels[newCategoryType as keyof typeof typeLabels]}</label>
          <div style={{
            maxHeight: 200,
            overflowY: "auto",
            paddingRight: 8,
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}>
            {currentCategories.map((cat) => (
              <div
                key={cat.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 14,
                  marginBottom: 10,
                  background: theme.colors.bgLight,
                  borderRadius: 14,
                  border: `1px solid ${theme.colors.border}`,
                  transition: "all 0.2s ease",
                }}
              >
              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: theme.colors.primary }}>
                  {getIconComponent(cat.icon || "zap")}
                </div>
                <strong style={{ color: theme.colors.text }}>{cat.name}</strong>
              </div>
              <button
                onClick={() => deleteCategory(cat.id)}
                style={{
                  background: theme.colors.expenseBg,
                  border: `1px solid ${theme.colors.expense}`,
                  color: theme.colors.expense,
                  padding: "6px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.colors.expense;
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme.colors.expenseBg;
                  e.currentTarget.style.color = theme.colors.expense;
                }}
              >
                삭제
              </button>
            </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MonthSheet() {
  const [monthStartDay, setMonthStartDay] = useState("1");
  const [budgets, setBudgets] = useState<Record<string, string>>({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<any[]>([]);
  const [transferCategories, setTransferCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const familyId = getCurrentFamilyId();
    const loadAll = async () => {
      try {
        const [expense, income, transfer, settings] = await Promise.all([
          fetch(`/api/categories?familyId=${familyId}&type=EXPENSE`).then(r => r.json()),
          fetch(`/api/categories?familyId=${familyId}&type=INCOME`).then(r => r.json()),
          fetch(`/api/categories?familyId=${familyId}&type=TRANSFER`).then(r => r.json()),
          fetch(`/api/family-settings?familyId=${familyId}`).then(r => r.json()),
        ]);

        if (Array.isArray(expense)) setExpenseCategories(expense);
        if (Array.isArray(income)) setIncomeCategories(income);
        if (Array.isArray(transfer)) setTransferCategories(transfer);

        if (settings && !settings.error) {
          setMonthStartDay(String(settings.monthStartDay || 1));
          if (settings.budgets && typeof settings.budgets === "object") {
            const budgetMap: Record<string, string> = {};
            for (const [k, v] of Object.entries(settings.budgets)) {
              budgetMap[k] = String(v);
            }
            setBudgets(budgetMap);
          }
        }
        setSettingsLoaded(true);
      } catch (error) {
        console.error("로드 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAll();
  }, []);

  // DB에 저장된 카테고리만 표시 (지출만 월 예산 설정)
  const categories = expenseCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon || "zap",
  }));

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      home: <Home size={18} strokeWidth={2} />,
      utensils: <Utensils size={18} strokeWidth={2} />,
      coffee: <Coffee size={18} strokeWidth={2} />,
      shopping: <ShoppingCart size={18} strokeWidth={2} />,
      bus: <Bus size={18} strokeWidth={2} />,
      heart: <Heart size={18} strokeWidth={2} />,
      gamepad: <Gamepad2 size={18} strokeWidth={2} />,
      film: <Film size={18} strokeWidth={2} />,
      gift: <Gift size={18} strokeWidth={2} />,
      hospital: <Hospital size={18} strokeWidth={2} />,
      book: <BookOpen size={18} strokeWidth={2} />,
      dumbbell: <Dumbbell size={18} strokeWidth={2} />,
      plane: <Plane size={18} strokeWidth={2} />,
      shirt: <Shirt size={18} strokeWidth={2} />,
      phone: <Smartphone size={18} strokeWidth={2} />,
      paw: <PawPrint size={18} strokeWidth={2} />,
      baby: <Baby size={18} strokeWidth={2} />,
      music: <Music size={18} strokeWidth={2} />,
      briefcase: <Briefcase size={18} strokeWidth={2} />,
      building: <Building size={18} strokeWidth={2} />,
      trending: <TrendingUp size={18} strokeWidth={2} />,
      card: <CreditCard size={18} strokeWidth={2} />,
      refresh: <RefreshCw size={18} strokeWidth={2} />,
      zap: <Zap size={18} strokeWidth={2} />,
      coins: <Coins size={18} strokeWidth={2} />,
      pencil: <Pencil size={18} strokeWidth={2} />,
      handcoins: <HandCoins size={18} strokeWidth={2} />,
      trophy: <Trophy size={18} strokeWidth={2} />,
      banknote: <Banknote size={18} strokeWidth={2} />,
      store: <Store size={18} strokeWidth={2} />,
    };
    return iconMap[iconName] || <Zap size={18} strokeWidth={2} />;
  };

  // 현재 존재하는 카테고리의 예산만 합산 (삭제된 카테고리 제외)
  const totalBudget = categories.reduce(
    (sum, cat) => sum + Number(budgets[cat.name] || 0),
    0
  );
  const saveMonthSetting = async () => {
    const familyId = getCurrentFamilyId();
    const cleanBudgets = categories.reduce((acc, cat) => {
      if (budgets[cat.name]) acc[cat.name] = budgets[cat.name];
      return acc;
    }, {} as Record<string, string>);

    await fetch("/api/family-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ familyId, monthStartDay: Number(monthStartDay), budgets: cleanBudgets }),
    });

    // 홈 화면에서도 쓰는 localStorage 캐시 업데이트
    localStorage.setItem("alien_month_start_day", monthStartDay);
    localStorage.setItem("alien_category_budgets", JSON.stringify(cleanBudgets));
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

      {isLoading ? (
        <div style={emptyBudgetStyle}>로딩 중...</div>
      ) : categories.length === 0 ? (
        <div style={emptyBudgetStyle}>
          프로필 → "카테고리 관리"에서 지출 카테고리를 먼저 추가해주세요.
        </div>
      ) : (
        <div style={budgetListStyle}>
          {categories.map((category: any) => (
            <div key={category.id ?? category.name} style={budgetRowStyle}>
              <div style={budgetCategoryStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: theme.colors.primary }}>
                  {getIconComponent(category.icon)}
                </div>
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
  if (menu === "familycode") return "가족코드 관리";
  if (menu === "family") return "가족 관리";
  if (menu === "alert") return "알림 설정";
  if (menu === "security") return "보안 설정";
  if (menu === "month") return "월 예산 설정";
  return "앱 설정";
}

function FamilyCodeSheet({
  currentCode,
  familyCodes,
  onSwitch,
  onAdd,
}: {
  currentCode: string;
  familyCodes: FamilyEntry[];
  onSwitch: (entry: FamilyEntry) => void;
  onAdd: (code: string) => Promise<void>;
}) {
  const [newCode, setNewCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    const trimmed = newCode.trim().toUpperCase();
    if (!trimmed) { setError("코드를 입력하세요."); return; }
    setLoading(true);
    setError("");
    try {
      await onAdd(trimmed);
    } catch {
      setError("연결에 실패했습니다. 코드를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={sheetBodyStyle}>
      {/* 현재 코드 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: theme.colors.subtext, fontWeight: 700, marginBottom: 6 }}>현재 사용 중</div>
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 14,
            background: theme.colors.primarySoft,
            border: `1.5px solid ${theme.colors.primary}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontWeight: 900, fontSize: 15, color: theme.colors.primary, letterSpacing: 1 }}>
            {currentCode || "—"}
          </span>
          <span style={{ fontSize: 11, color: theme.colors.primary, fontWeight: 700 }}>활성</span>
        </div>
      </div>

      {/* 저장된 코드 목록 */}
      {familyCodes.filter((e) => e.code !== currentCode).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: theme.colors.subtext, fontWeight: 700, marginBottom: 6 }}>저장된 코드</div>
          {familyCodes
            .filter((e) => e.code !== currentCode)
            .map((entry) => (
              <button
                key={entry.code}
                onClick={() => onSwitch(entry)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 14,
                  background: "#FFFFFF",
                  border: `1px solid ${theme.colors.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  marginBottom: 8,
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontWeight: 800, fontSize: 14, color: theme.colors.text, letterSpacing: 0.5 }}>
                  {entry.code}
                </span>
                <span style={{ fontSize: 11, color: theme.colors.primary, fontWeight: 700 }}>전환 →</span>
              </button>
            ))}
        </div>
      )}

      {/* 새 코드 추가 */}
      <div>
        <div style={{ fontSize: 11, color: theme.colors.subtext, fontWeight: 700, marginBottom: 6 }}>새 코드 추가 / 연결</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="예: FAMILY-002"
            style={{
              ...sheetInputStyle,
              flex: 1,
              letterSpacing: 1,
            }}
          />
          <button
            onClick={handleAdd}
            disabled={loading}
            style={{
              height: 48,
              padding: "0 16px",
              borderRadius: 14,
              border: "none",
              background: loading ? theme.colors.border : theme.colors.primary,
              color: loading ? theme.colors.subtext : "#FFFFFF",
              fontWeight: 900,
              fontSize: 13,
              cursor: loading ? "not-allowed" : "pointer",
              flexShrink: 0,
            }}
          >
            {loading ? "..." : "연결"}
          </button>
        </div>
        {error && (
          <p style={{ fontSize: 12, color: theme.colors.expense, marginTop: 6, fontWeight: 600 }}>{error}</p>
        )}
        <p style={{ fontSize: 11, color: theme.colors.subtext, marginTop: 8, lineHeight: 1.6 }}>
          새 코드를 입력하면 해당 코드의 가계부로 전환됩니다.<br />
          파트너와 같은 코드를 사용하면 함께 연결돼요.
        </p>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 16, padding: "10px", textAlign: "center" as const }}>
      <div style={{ fontSize: 11, opacity: 0.85, color: "white" }}>{label}</div>
      <strong style={{ display: "block", marginTop: 4, fontSize: 14, color: "white" }}>{value}</strong>
    </div>
  );
}





// ─── 스타일 상수 ───────────────────────────────────────────────
const pageStyle = { minHeight: "100vh", background: "#FFFFFF", padding: "14px 12px 82px", display: "flex", justifyContent: "center" } as const;
const containerStyle = { width: "100%", maxWidth: 390, display: "flex", flexDirection: "column" as const, gap: 14 } as const;
const headerStyle = { display: "flex", alignItems: "center", justifyContent: "space-between" } as const;
const iconButtonStyle = { border: "none", background: "transparent", padding: 4, cursor: "pointer" } as const;
const profileCardStyle = { background: `linear-gradient(135deg, ${theme.colors.primary} 0%, #B6AAFF 100%)`, color: "white", borderRadius: 24, padding: 20, textAlign: "center" as const } as const;
const avatarRowStyle = { display: "flex", justifyContent: "center", gap: 10 } as const;
const avatarStyle = { width: 54, height: 54, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "grid", placeItems: "center", fontSize: 28 } as const;
const familyCodeButtonStyle = { marginTop: 4, border: "none", background: "transparent", color: "rgba(255,255,255,0.9)", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer" } as const;
const statsGridStyle = { marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 } as const;
const menuSectionStyle = { background: "white", borderRadius: 22, padding: "0 16px", border: `1px solid ${theme.colors.border}` } as const;
const menuItemStyle = { width: "100%", border: "none", background: "white", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", cursor: "pointer" } as const;
const menuLeftStyle = { display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 800 } as const;
const menuIconStyle = { width: 36, height: 36, borderRadius: 10, background: theme.colors.primarySoft, display: "grid", placeItems: "center", color: theme.colors.primary } as const;
const overlayStyle = { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 50, display: "flex", alignItems: "flex-end" } as const;
const sheetStyle = { width: "100%", maxWidth: 390, margin: "0 auto", background: "white", borderRadius: "24px 24px 0 0", padding: "0 0 96px", maxHeight: "90vh", overflowY: "auto" as const } as const;
const sheetHeaderStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 12px", borderBottom: `1px solid ${theme.colors.border}`, position: "sticky" as const, top: 0, background: "white", zIndex: 1 } as const;
const sheetBodyStyle = { padding: "16px 20px", display: "flex", flexDirection: "column" as const, gap: 6 } as const;

const infoRowStyle = { minHeight: 48, borderRadius: 16, border: `1px solid ${theme.colors.border}`, padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14 } as const;
const primaryButtonStyle = { height: 52, border: "none", borderRadius: 18, background: theme.colors.primary, color: "white", fontWeight: 900 } as const;
const toggleRowStyle = { height: 52, borderRadius: 16, border: `1px solid ${theme.colors.border}`, background: "white", padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 800 } as const;
const toggleStyle = { width: 42, height: 24, borderRadius: 999, padding: 3, display: "flex", alignItems: "center", transition: "0.2s" } as const;
const toggleDotStyle = { width: 18, height: 18, borderRadius: 999, background: "white", transition: "0.2s" } as const;
const colorPickerRowStyle = { display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" as const } as const;
const colorCircleStyle = { width: 34, height: 34, borderRadius: "50%", cursor: "pointer" } as const;
const nameColorRowStyle = { display: "grid", gridTemplateColumns: "1fr 44px", gap: 8 } as const;
const paletteButtonStyle = { height: 48, borderRadius: 16, border: `1px solid ${theme.colors.border}`, background: "#FFFFFF", display: "grid", placeItems: "center", cursor: "pointer" } as const;
const editBoxStyle = { marginTop: 14, paddingTop: 14, borderTop: `1px solid ${theme.colors.border}`, display: "flex", flexDirection: "column" as const, gap: 8 } as const;
const editActionGridStyle = { display: "grid", gridTemplateColumns: "96px 1fr", gap: 10, marginTop: 8 } as const;
const deleteButtonStyle = { height: 52, border: "none", borderRadius: 18, background: "#FFF3F6", color: theme.colors.expense, fontWeight: 900, cursor: "pointer" } as const;
const memberInlineRowStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 } as const;
const memberPillStyle = { minHeight: 42, borderRadius: 16, color: "#FFFFFF", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 900 } as const;
const accountRowStyle = { minHeight: 56, borderRadius: 16, border: `1px solid ${theme.colors.border}`, padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14 } as const;
const accountIconStyle = { width: 38, height: 38, borderRadius: 14, background: theme.colors.primarySoft, display: "grid", placeItems: "center", color: theme.colors.primary, flexShrink: 0 } as const;
const editHeaderRowStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 } as const;
const backTextButtonStyle = { border: "none", background: "transparent", color: theme.colors.primary, fontSize: 12, fontWeight: 900, cursor: "pointer", padding: 0 } as const;
const budgetListStyle = { display: "flex", flexDirection: "column" as const, gap: 8 } as const;
const budgetRowStyle = { minHeight: 52, borderRadius: 16, border: `1px solid ${theme.colors.border}`, padding: "8px 10px", display: "grid", gridTemplateColumns: "1fr 120px", alignItems: "center", gap: 8 } as const;
const budgetCategoryStyle = { display: "flex", alignItems: "center", gap: 8, fontSize: 13 } as const;
const budgetInputStyle = { height: 38, borderRadius: 12, border: `1px solid ${theme.colors.border}`, padding: "0 10px", textAlign: "right" as const, fontWeight: 900, outline: "none" } as const;
const emptyBudgetStyle = { borderRadius: 16, border: `1px solid ${theme.colors.border}`, padding: 14, fontSize: 12, color: theme.colors.subtext } as const;
const budgetTotalBoxStyle = { minHeight: 46, borderRadius: 16, background: theme.colors.primarySoft, color: theme.colors.primary, padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, fontWeight: 900 } as const;
const sheetLabelStyle = { fontSize: 13, fontWeight: 900, color: theme.colors.subtext, marginBottom: -2 } as const;
const sheetInputStyle = { width: "100%", height: 48, borderRadius: 16, border: `1px solid ${theme.colors.border}`, padding: "0 14px", fontSize: 15, fontWeight: 800, outline: "none", background: "#FFFFFF", boxSizing: "border-box" as const } as const;
const secondaryButtonStyle = { height: 52, border: `1px solid ${theme.colors.border}`, borderRadius: 18, background: "#FFFFFF", color: theme.colors.text, fontWeight: 900 } as const;
