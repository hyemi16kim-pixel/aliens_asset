"use client";

import { useRouter } from "next/navigation";
import BottomNav from "@/components/navigation/BottomNav";
import { theme } from "@/components/lib/theme";
import { useEffect, useMemo, useRef, useState } from "react";
import { readRecentSms } from "@/components/lib/smsReader";
import {
  readRecentKakao,
  isKakaoPermissionGranted,
  requestKakaoPermission,
} from "@/components/lib/kakaoReader";
import { getCurrentFamilyId, getCurrentUserId } from "@/components/lib/familyCode";
import { cacheProfileSettings, getProfileSettings } from "@/components/lib/profileSettings";
import { useKeyboardOffset, scrollInputIntoView } from "@/components/lib/useKeyboardOffset";

import {
  X,
  CalendarDays,
  ChevronDown,
  Repeat,
  Coffee,
  Utensils,
  ShoppingBag,
  Bus,
  Home,
  Heart,
  Wallet,
  ArrowLeftRight,
  Star,
  Plus,
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
  Landmark,
  PiggyBank,
  ArrowDownCircle,
  CreditCard,
  TrendingUp,
  Zap,
  Coins,
  Pencil,
  HandCoins,
  Trophy,
  Banknote,
  Store,
  Building2,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import { useModalBack } from "@/components/lib/BackStackContext";

type TransactionType = "EXPENSE" | "INCOME" | "TRANSFER" | "STOCK";

type Account = {
  id: number;
  name: string;
  type: string;
  balance: number;
  aliases?: string[];
  sourceKey?: string | null;
  owner?: {
    id: number;
    name: string;
    role?: "OWNER" | "MEMBER";
  } | null;
};

const typeColorMap = {
  EXPENSE: "#FF6B81",
  INCOME: "#4CD6A5",
  TRANSFER: "#5BB8F5",
  STOCK: "#f3a24c",
};

const typeSoftColorMap = {
  EXPENSE: "#FFEAF3",
  INCOME: "#ECFFF6",
  TRANSFER: theme.colors.primarySoft,
   STOCK: "#fff3ec",
};

type CategoryItem = {
  name: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
};

const customIconMap = {
  EXPENSE: [
    { key: "식비", icon: Utensils },
    { key: "카페", icon: Coffee },
    { key: "쇼핑", icon: ShoppingBag },
    { key: "교통", icon: Bus },
    { key: "생활", icon: Home },
    { key: "데이트", icon: Heart },
    { key: "게임", icon: Gamepad2 },
    { key: "영화", icon: Film },
    { key: "선물", icon: Gift },
    { key: "병원", icon: Hospital },
    { key: "공부", icon: BookOpen },
    { key: "운동", icon: Dumbbell },
    { key: "여행", icon: Plane },
    { key: "의류", icon: Shirt },
    { key: "통신", icon: Smartphone },
    { key: "반려", icon: PawPrint },
    { key: "육아", icon: Baby },
    { key: "음악", icon: Music },
  ],
  INCOME: [
    { key: "급여", icon: Briefcase },
    { key: "보너스", icon: Gift },
    { key: "용돈", icon: Wallet },
    { key: "이자", icon: Landmark },
    { key: "배당", icon: PiggyBank },
    { key: "환급", icon: ArrowDownCircle },
  ],
  TRANSFER: [
    { key: "이체", icon: ArrowLeftRight },
    { key: "카드 전월 선결제", icon: CreditCard },
    { key: "카드 이번달 선결제", icon: CreditCard },
  ],
  STOCK: [
    { key: "주식", icon: PiggyBank },
    { key: "매수", icon: Plus },
    { key: "매도", icon: ArrowDownCircle },
  ],
};

// EXPENSE/INCOME: DB 카테고리만 표시 (하드코딩 제외)
// TRANSFER: DB가 비어있으면 기본 3개 fallback (loadCategories에서 처리)
const categoryMap: Record<string, CategoryItem[]> = {
  EXPENSE: [],
  INCOME: [],
  TRANSFER: [],
  STOCK: customIconMap.STOCK.map(({ key, icon }) => ({ name: key, icon })),
};

// 프로필 페이지에서 저장한 영어 아이콘 키 → Lucide 컴포넌트 매핑
const englishIconMap: Record<string, React.ElementType> = {
  home: Home,
  utensils: Utensils,
  coffee: Coffee,
  shopping: ShoppingBag,
  bus: Bus,
  heart: Heart,
  gamepad: Gamepad2,
  film: Film,
  gift: Gift,
  hospital: Hospital,
  book: BookOpen,
  dumbbell: Dumbbell,
  plane: Plane,
  shirt: Shirt,
  phone: Smartphone,
  paw: PawPrint,
  baby: Baby,
  music: Music,
  briefcase: Briefcase,
  building: Building2,
  trending: TrendingUp,
  card: CreditCard,
  refresh: RefreshCw,
  zap: Zap,
  coins: Coins,
  pencil: Pencil,
  handcoins: HandCoins,
  trophy: Trophy,
  banknote: Banknote,
  store: Store,
  wallet: Wallet,
  landmark: Landmark,
  piggybank: PiggyBank,
  shoppingcart: ShoppingCart,
};

export default function AddTransactionPage() {
  const router = useRouter();

  // 서버/클라이언트 초기값은 동일하게 고정 → hydration 불일치 방지
  // localStorage 캐시 로드는 useEffect에서 처리
  const [myName, setMyName] = useState("나");
  const [partnerName, setPartnerName] = useState("파트너");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [favoriteAccountIds, setFavoriteAccountIds] = useState<string[]>([]);
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [memo, setMemo] = useState("");
  const [owner, setOwner] = useState("나");
  const [date, setDate] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [repeat, setRepeat] = useState("반복 안함");
  const [showOptions, setShowOptions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [inputMode, setInputMode] = useState<"MANUAL" | "IMPORT">("MANUAL");


  const [usedImportIds, setUsedImportIds] = useState<string[]>([]);
  const [selectedImportId, setSelectedImportId] = useState<string>("");
  const [hiddenImportIds, setHiddenImportIds] = useState<string[]>([]);

  const [stockTradeType, setStockTradeType] = useState<"BUY" | "SELL" | "DIVIDEND">("BUY");
  const keyboardHeight = useKeyboardOffset();
  const [dividendAmount, setDividendAmount] = useState("");
  const [stockAccountId, setStockAccountId] = useState("");
  const [stockName, setStockName] = useState("");
  const [stockCode, setStockCode] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockPrice, setStockPrice] = useState("");
  const [stockMode, setStockMode] = useState<"EXISTING" | "NEW">("EXISTING");
  const [stockHoldings, setStockHoldings] = useState<any[]>([]);
  const [selectedStockId, setSelectedStockId] = useState("");

  const [favoriteCategories, setFavoriteCategories] = useState<string[]>([]);
  const [customCategories, setCustomCategories] = useState<
    { id?: number; name: string; iconKey: string; emoji?: string }[]
  >([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIconKey, setNewCategoryIconKey] = useState("생활");
  const [isLongPress, setIsLongPress] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const isDragging = useRef(false);
  useModalBack(showAddCategory, () => setShowAddCategory(false));

type ImportedMessage = {
  receivedAt: string;
  id: string;
  sourceType: "SMS" | "KAKAO";
  sourceKey: string;
  rawText: string;
};

const [importedMessages, setImportedMessages] = useState<ImportedMessage[]>([]);
const [isLoadingMessages, setIsLoadingMessages] = useState(false);


// SMS 텍스트에서 가맹점명만 추출 (카드 승인 문자 기준)
const cleanSmsMemo = (text: string): string => {
  let m = text;
  // 1. [Web발신] / [앱발신] 등 접두사 제거
  m = m.replace(/\[.*?발신\]/gi, "");
  // 2. 카드명+번호+승인 패턴 제거 (예: KB국민카드3072승인, 현대카드1234승인)
  m = m.replace(/[가-힣a-zA-Z]+카드\d+승인/g, "");
  m = m.replace(/[가-힣a-zA-Z]+(은행|뱅크|페이|머니)\s*(\d+\s*)?(승인|출금|입금|결제)/g, "");
  // 3. 이름*이름님 패턴 제거 (예: 김*미님)
  m = m.replace(/[가-힣]{1,3}\*[가-힣]{0,3}님/g, "");
  // 4. 금액 제거 (예: 7,600원, 451,541원)
  m = m.replace(/\d{1,3}(?:,\d{3})*\s*원/g, "");
  // 5. 누적액 제거
  m = m.replace(/누적\s*\d[\d,]*/g, "");
  // 6. 날짜/시간 패턴 제거 (예: 05/26 10:12, 2024.05.26)
  m = m.replace(/\d{2,4}[./]\d{2}[./]\d{2,4}(\s+\d{2}:\d{2}(:\d{2})?)?/g, "");
  m = m.replace(/\d{2}\/\d{2}\s+\d{2}:\d{2}/g, "");
  // 7. 일시불 / 할부 / 출금 / 잔액 키워드 제거
  m = m.replace(/일시불|\d+개월/g, "");
  m = m.replace(/\s*출금\s*/g, " ");
  m = m.replace(/잔액\s*\d[\d,]*/g, "");
  m = m.replace(/\s*잔액\s*/g, " ");
  // 8. 숫자만 있는 토큰 제거
  m = m.replace(/\b\d+\b/g, "");
  // 9. 밑줄 → 공백, 특수문자 정리
  m = m.replace(/[_\-]/g, " ");
  m = m.replace(/[\[\]()【】《》「」<>]/g, "");
  // 10. 공백 정리, 각 토큰 끝의 단독 숫자 제거
  m = m.replace(/\s+/g, " ").trim();
  // 11. 결과가 너무 짧거나 없으면 원문 40자 사용
  const clean = m.trim();
  return clean.length >= 2 ? clean.slice(0, 30) : text.replace(/\s+/g, " ").slice(0, 40);
};

const parseImportedMessage = (item: ImportedMessage) => {
  const text = item.rawText || "";

  const cleanText = text.replace(
    /누적\s*\d{1,3}(?:,\d{3})*\s*원/g,
    ""
  );

  const contextualMatch = cleanText.match(
    /(?:입금|출금|승인|결제|사용|자동결제)[\s\S]{0,30}?(\d{1,3}(?:,\d{3})+|\d+)/
  );

  const wonMatch = cleanText.match(
    /(\d{1,3}(?:,\d{3})+|\d+)\s*원/
  );

  const numberCandidates = Array.from(
    cleanText.matchAll(/\d{1,3}(?:,\d{3})+|\d+/g)
  )
    .map((v) => Number(v[0].replace(/,/g, "")))
    .filter((v) => v >= 1000);

  const amount = contextualMatch
    ? Number(contextualMatch[1].replace(/,/g, ""))
    : wonMatch
    ? Number(wonMatch[1].replace(/,/g, ""))
    : numberCandidates.length > 0
    ? Math.max(...numberCandidates)
    : 0;

  const type: TransactionType = /입금/.test(text)
    ? "INCOME"
    : "EXPENSE";

  // 날짜 자동 파싱: MM/DD HH:MM 또는 MM/DD 패턴
  const dateMatch = text.match(/(\d{2})\/(\d{2})(?:\s+(\d{2}):(\d{2}))?/);
  let date = new Date().toLocaleDateString("sv-SE");
  if (dateMatch) {
    const year = new Date().getFullYear();
    const mm = dateMatch[1];
    const dd = dateMatch[2];
    date = `${year}-${mm}-${dd}`;
  }

  return {
    type,
    amount,
    category: type === "INCOME" ? "수입" : "기타",
    date,
    accountNameHint: item.sourceKey || "",
    memo: cleanSmsMemo(text),
  };
};

  const activeColor = typeColorMap[type];
  const activeSoftColor = typeSoftColorMap[type];
  // 모든 타입의 아이콘을 합쳐서 검색 (타입 무관하게 이름으로 매핑)
  const allIconItems = Object.values(customIconMap).flat();
  const defaultCategories = categoryMap[type];

  
  const customMappedCategories = customCategories.map((item) => {
    // 1차: 한글 카테고리명으로 아이콘 검색
    let foundIcon: React.ElementType | null = allIconItems.find((iconItem) => iconItem.key === item.iconKey)?.icon || null;
    // 2차: DB에 저장된 영어 아이콘 키로 검색 (프로필 페이지 방식)
    if (!foundIcon && item.emoji) {
      foundIcon = englishIconMap[item.emoji] || null;
    }
    return {
      name: item.name,
      icon: foundIcon,   // null이면 👽 fallback
      emoji: item.emoji || "👽",
    };
  });

  const categories = [...defaultCategories, ...customMappedCategories];

  const sortedCategories = useMemo(() => {
    return [
      ...categories.filter((item) => favoriteCategories.includes(item.name)),
      ...categories.filter((item) => !favoriteCategories.includes(item.name)),
    ];
  }, [categories, favoriteCategories]);

  useEffect(() => {
    // 클라이언트에서만 실행 (hydration 이후)
    setDate(new Date().toLocaleDateString("sv-SE"));
    const saved = localStorage.getItem("alien_used_import_ids");
    if (saved) {
      setUsedImportIds(JSON.parse(saved));
    }
    try {
      const hiddenSaved = localStorage.getItem("alien_hidden_import_ids");
      if (hiddenSaved) setHiddenImportIds(JSON.parse(hiddenSaved));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    // family-settings API에서 userId 기준으로 나/파트너 이름 가져오기
    const familyId = getCurrentFamilyId();
    const myUserId = getCurrentUserId();
    fetch(`/api/family-settings?familyId=${familyId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) return;
        const meIsOwner = !myUserId || data.owner?.id === myUserId;
        const me = meIsOwner ? data.owner : data.partner;
        const partner = meIsOwner ? data.partner : data.owner;
        const meName = me?.name || "";
        const partnerName = partner?.name || "";
        const meColor = me?.color || "#BFEFE0";
        const partnerColorVal = partner?.color || "#FFD6E8";
        if (meName) {
          setMyName(meName);
          // owner가 아직 기본값("나")이거나 이전 캐시 이름이면 실제 이름으로 갱신
          setOwner((prev) => (prev === "나" || prev === "" ? meName : prev));
          // 계좌 필터 초기값: 아직 선택 안 했으면 내 이름으로 설정
          setAccountFilter((prev) => (prev === "" ? meName : prev));
        }
        if (partnerName) setPartnerName(partnerName);
        cacheProfileSettings(meName, partnerName, meColor, partnerColorVal);
      })
      .catch(() => {});
    const _uid = getCurrentUserId();
    const _favAccKey = `alien_favorite_account_ids_${_uid || 0}`;
    setFavoriteAccountIds(
      JSON.parse(localStorage.getItem(_favAccKey) || "[]")
    );
    fetch(`/api/accounts/simple?familyId=${getCurrentFamilyId()}&userId=${getCurrentUserId()}`)
      .then((res) => res.json())
      .then((data) => {
        const accountList = Array.isArray(data) ? data : data.accounts || [];
        setAccounts(accountList);
      })
      .catch(console.error);
  }, []);

  const myAccounts = accounts.filter(
      (account) => account.owner?.name === myName
    );

    const partnerAccounts = accounts.filter(
      (account) => account.owner?.name === partnerName
    );

    const sharedAccounts = accounts.filter(
      (account) => !account.owner?.name
    );

  // 나/파트너/공동 필터 적용
  const filteredAccounts =
    accountFilter === partnerName
      ? partnerAccounts
      : accountFilter === "공동"
      ? sharedAccounts
      : myAccounts; // 기본: 나

  useEffect(() => {
    if (type !== "STOCK" || !stockAccountId) return;

    fetch(`/api/stocks?accountId=${stockAccountId}`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setStockHoldings(list);

        if (list.length > 0) {
          setStockMode("EXISTING");
          setSelectedStockId(String(list[0].id));
          setStockName(list[0].name);
          setStockCode(list[0].code);
        } else {
          setStockMode("NEW");
          setSelectedStockId("");
          setStockName("");
          setStockCode("");
        }
      })
      .catch(console.error);
  }, [type, stockAccountId]);


  // 주식 수량 × 단가 → 금액 자동 계산
  useEffect(() => {
    if (type !== "STOCK" || stockTradeType === "DIVIDEND") return;
    const qty = Number(stockQuantity.replace(/[^0-9.]/g, "") || 0);
    const price = Number(stockPrice.replace(/[^0-9.]/g, "") || 0);
    if (qty > 0 && price > 0) {
      setAmount(String(Math.round(qty * price)));
    } else {
      setAmount("");
    }
  }, [stockQuantity, stockPrice, type, stockTradeType]);

  // 카테고리 로드
  useEffect(() => {
    const loadCategories = async () => {
      try {
        // 서버에서 카테고리 로드
        const res = await fetch(`/api/categories?familyId=${getCurrentFamilyId()}&type=${type}`);
        const data = await res.json();

        if (Array.isArray(data)) {
          // 서버에서 받은 카테고리 처리
          const serverCategories = data.map(cat => ({
            id: cat.id,
            name: cat.name,
            iconKey: cat.name, // 이름으로 lucide 아이콘 검색 시도
            emoji: cat.icon || "👽",  // DB 저장 이모지 (fallback용)
          }));

          // 기본 카테고리 제외한 커스텀 카테고리만 설정
          const defaultNames = categoryMap[type].map(c => c.name);
          const customCats = serverCategories.filter(
            (cat, index, self) =>
              !defaultNames.includes(cat.name) &&
              self.findIndex((item) => item.name === cat.name) === index
          );

          // TRANSFER: DB에 카테고리 없으면 customIconMap 기본값 사용
          const finalCats = (type === "TRANSFER" && serverCategories.length === 0 && customCats.length === 0)
            ? customIconMap.TRANSFER.map(({ key }) => ({ id: 0, name: key, iconKey: key, emoji: "↔️" }))
            : customCats;

          setCustomCategories(finalCats);

          // 첫 번째 카테고리로 초기화 (category가 비어있을 때)
          if (!category && finalCats.length > 0) {
            setCategory(finalCats[0].name);
          }
        }
        
        // 즐겨찾기는 사용자별로 로컬에 저장
        const _catUid = getCurrentUserId();
        const _catFavKey = `alien_favorite_categories_${type}_${_catUid || 0}`;
        const savedFavorites = localStorage.getItem(_catFavKey);

        const fallback =
          type === "EXPENSE"
            ? ["식비", "카페", "쇼핑"]
            : type === "INCOME"
            ? ["수입"]
            : ["이체"];

        setFavoriteCategories(savedFavorites ? JSON.parse(savedFavorites) : fallback);
      } catch (error) {
        console.error("카테고리 로드 오류:", error);
        
        
        const _catUid2 = getCurrentUserId();
        const _catFavKey2 = `alien_favorite_categories_${type}_${_catUid2 || 0}`;
        const savedFavorites = localStorage.getItem(_catFavKey2);

        const fallback =
          type === "EXPENSE"
            ? ["식비", "카페", "쇼핑"]
            : type === "INCOME"
            ? ["수입"]
            : ["이체"];

        setFavoriteCategories(savedFavorites ? JSON.parse(savedFavorites) : fallback);
      }
      
      setShowAddCategory(false);
    };
    
    loadCategories();
  }, [type]);

  const toggleFavoriteAccount = (accountId: string) => {
    const next = favoriteAccountIds.includes(accountId)
      ? favoriteAccountIds.filter((id) => id !== accountId)
      : [...favoriteAccountIds, accountId];

    setFavoriteAccountIds(next);
    const _uid2 = getCurrentUserId();
    localStorage.setItem(`alien_favorite_account_ids_${_uid2 || 0}`, JSON.stringify(next));
  };

  const sortAccountsByFavorite = (list: Account[]) => {
    return [...list].sort((a, b) => {
      const aFav = favoriteAccountIds.includes(String(a.id)) ? 0 : 1;
      const bFav = favoriteAccountIds.includes(String(b.id)) ? 0 : 1;
      return aFav - bFav;
    });
  };

  const changeType = (nextType: TransactionType) => {
    setType(nextType);
    setCategory("");
    // 타입 전환 시 계좌 선택 초기화 (혼선 방지)
    setFromAccountId("");
    setToAccountId("");

    if (nextType === "STOCK") {
      const stockAccount = accounts.find((account) => account.type === "STOCK");
      if (stockAccount) setStockAccountId(String(stockAccount.id));
    }
  };

  const toggleFavorite = (name: string) => {
    const next = favoriteCategories.includes(name)
      ? favoriteCategories.filter((item) => item !== name)
      : [...favoriteCategories, name];

    setFavoriteCategories(next);
    const _catUid3 = getCurrentUserId();
    localStorage.setItem(
      `alien_favorite_categories_${type}_${_catUid3 || 0}`,
      JSON.stringify(next)
    );
  };

  const addCustomCategory = async () => {
    const name = newCategoryName.trim();

    if (!name) {
      alert("카테고리명을 입력하세요.");
      return;
    }

    if (categories.some((item) => item.name === name)) {
      alert("이미 있는 카테고리입니다.");
      return;
    }

    try {
      // 서버에 카테고리 추가
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: getCurrentFamilyId(),
          name,
          type,
          displayOrder: customCategories.length
        }),
      });

      if (!res.ok) {
        throw new Error("카테고리 추가 실패");
      }

      const newCategory = await res.json();
      const refreshRes = await fetch(`/api/categories?familyId=${getCurrentFamilyId()}&type=${type}`);
      const refreshData = await refreshRes.json();

      setCustomCategories(
        Array.isArray(refreshData)
          ? refreshData.map((item) => ({
              id: item.id,
              name: item.name,
              iconKey: item.iconKey || item.name,
              emoji: item.icon || "👽",
            }))
          : []
      );

      setCategory(name);
      setNewCategoryName("");
      setNewCategoryIconKey("생활");
      setShowAddCategory(false);
    } catch (error) {
      console.error("카테고리 추가 오류:", error);
      alert("카테고리 추가에 실패했습니다.");
    }
  };

const startCategoryDrag = (clientX: number) => {
  if (!categoryScrollRef.current) return;

  isDragging.current = true;
  dragStartX.current = clientX;
  dragScrollLeft.current = categoryScrollRef.current.scrollLeft;
};

const moveCategoryDrag = (clientX: number) => {
  if (!categoryScrollRef.current || !isDragging.current) return;

  const diff = clientX - dragStartX.current;
  categoryScrollRef.current.scrollLeft = dragScrollLeft.current - diff;
};

const endCategoryDrag = () => {
  isDragging.current = false;
};

const startLongPress = (id: number) => {
  if (longPressTimer) clearTimeout(longPressTimer);
  
  const timer = setTimeout(() => {
    setIsLongPress(true);
    setCategoryToDelete(id);
  }, 800); // 0.8초 길게 누르면 삭제 모드
  
  setLongPressTimer(timer);
};

const endLongPress = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    setLongPressTimer(null);
  }
};

const deleteCategory = async (id: number) => {
  const confirmed = confirm("카테고리를 삭제할까요?");

  if (!confirmed) {
    setIsLongPress(false);
    setCategoryToDelete(null);
    return;
  }
  if (!id) return;
  
  try {
    const res = await fetch(`/api/categories?id=${id}`, {
      method: "DELETE",
    });
    
    if (!res.ok) {
      throw new Error("카테고리 삭제 실패");
    }
    
    const refreshRes = await fetch(`/api/categories?familyId=${getCurrentFamilyId()}&type=${type}`);
    const refreshData = await refreshRes.json();

    setCustomCategories(
      Array.isArray(refreshData)
        ? refreshData.map((item) => ({
            id: item.id,
            name: item.name,
            iconKey: item.iconKey || item.name,
          }))
        : []
    );
    // 삭제한 카테고리가 현재 선택된 카테고리라면 기본 카테고리로 변경
    const deletedCategory = customCategories.find(item => item.id === id);
    setIsLongPress(false);
    setCategoryToDelete(null);
    if (deletedCategory && category === deletedCategory.name) {
      setCategory(categoryMap[type][0].name);
    }
    
    setCategoryToDelete(null);
    setIsLongPress(false);
  } catch (error) {
    console.error("카테고리 삭제 오류:", error);
    alert("카테고리 삭제에 실패했습니다.");
  }
};


const normalizeKey = (value: string) =>
  String(value || "")
    .replace(/[^0-9a-zA-Z가-힣]/g, "")
    .toLowerCase();

const getPartialKeys = (value: string) => {
  const normalized = normalizeKey(value);

  if (!normalized) return [];

  const parts = value
    .split(/[\s,./_\-:()[\]<>]+/)
    .map((item) => normalizeKey(item))
    .filter((item) => item.length >= 2);

  return Array.from(new Set([normalized, ...parts]));
};

const bankAliasMap: Record<string, string[]> = {
  국민: ["국민", "kb"],
  농협: ["농협", "nh"],
  신한: ["신한"],
  우리: ["우리"],
  하나: ["하나"],
  새마을금고: ["새마을", "금고", "mg"],
  카카오: ["카카오", "kakao"],
  토스: ["토스", "toss"],
  기업: ["기업", "ibk"],
  부산: ["부산"],
  대구: ["대구"],
  경남: ["경남"],
  수협: ["수협"],
};

const loadImportedMessages = async () => {
  try {
    setIsLoadingMessages(true);

    // 1) SMS
    const smsList = await readRecentSms(50);
    const smsMessages: ImportedMessage[] = smsList.map((sms) => ({
      receivedAt: new Date(sms.date).toISOString(),
      id: `sms-${sms.id}`,
      sourceType: "SMS" as const,
      sourceKey: sms.address || "",
      rawText: sms.body || "",
    }));

    // 2) KakaoTalk notifications
    let kakaoMessages: ImportedMessage[] = [];
    try {
      const granted = await isKakaoPermissionGranted();
      if (granted) {
        const kakaoList = await readRecentKakao(50);
        kakaoMessages = kakaoList.map((k) => ({
          receivedAt: new Date(k.date).toISOString(),
          id: `kakao-${k.id}`,
          sourceType: "KAKAO" as const,
          sourceKey: k.sender || "",
          rawText: k.body || "",
        }));
      }
    } catch {}

    // Merge and sort newest first
    const merged = [...smsMessages, ...kakaoMessages].sort(
      (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );

    setImportedMessages(merged);
  } catch (error) {
    console.error(error);
    alert("내역 불러오기에 실패했습니다.");
  } finally {
    setIsLoadingMessages(false);
  }
};

// Opens Android Notification Access settings so user can grant Kakao permission
const openKakaoPermissionSettings = async () => {
  await requestKakaoPermission();
};

// 새 메시지만 추가로 불러오기 (기존 목록 유지, 새 것만 prepend)
const refreshImportedMessages = async () => {
  try {
    setIsLoadingMessages(true);
    const existingIds = new Set(importedMessages.map((m) => m.id));

    const smsList = await readRecentSms(50);
    const smsNew: ImportedMessage[] = smsList
      .map((sms) => ({
        receivedAt: new Date(sms.date).toISOString(),
        id: `sms-${sms.id}`,
        sourceType: "SMS" as const,
        sourceKey: sms.address || "",
        rawText: sms.body || "",
      }))
      .filter((m) => !existingIds.has(m.id));

    let kakaoNew: ImportedMessage[] = [];
    try {
      const granted = await isKakaoPermissionGranted();
      if (granted) {
        const kakaoList = await readRecentKakao(50);
        kakaoNew = kakaoList
          .map((k) => ({
            receivedAt: new Date(k.date).toISOString(),
            id: `kakao-${k.id}`,
            sourceType: "KAKAO" as const,
            sourceKey: k.sender || "",
            rawText: k.body || "",
          }))
          .filter((m) => !existingIds.has(m.id));
      }
    } catch {}

    const newMessages = [...smsNew, ...kakaoNew].sort(
      (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );

    if (newMessages.length === 0) {
      alert("새로 받은 문자/카카오 내역이 없습니다.");
      return;
    }
    setImportedMessages((prev) => [...newMessages, ...prev]);
  } catch (error) {
    console.error(error);
    alert("새로고침에 실패했습니다.");
  } finally {
    setIsLoadingMessages(false);
  }
};


// 별명 매칭 우선순위 함수
// P1: 특수문자 포함 원문에서 alias 그대로 발견 (가장 정확)
// P2: 정규화 후 alias가 완전한 단어로 존재 (뒤에 한글/영숫자가 이어지지 않음)
// P3: 정규화 후 substring 포함 (현재 동작)
// 같은 순위라면 긴 alias 우선 (더 구체적)
const getBestAliasMatch = (
  account: Account,
  rawText: string
): { priority: number; aliasLen: number } => {
  const aliases: string[] = account.aliases?.length
    ? account.aliases
    : account.sourceKey
    ? [account.sourceKey]
    : [];

  const lowerRaw = rawText.toLowerCase();
  const normText = normalizeKey(rawText);

  let bestPriority = 4;
  let bestAliasLen = 0;

  for (const alias of aliases) {
    if (!alias) continue;
    const lowerAlias = alias.toLowerCase();
    const normAlias = normalizeKey(alias);
    if (!normAlias || normAlias.length < 1) continue;

    // P1: 특수문자 포함 그대로 원문에 존재
    if (lowerRaw.includes(lowerAlias)) {
      if (1 < bestPriority || (1 === bestPriority && lowerAlias.length > bestAliasLen)) {
        bestPriority = 1;
        bestAliasLen = lowerAlias.length;
      }
      continue;
    }

    // P2 / P3: 정규화 텍스트에서 검색
    const idx = normText.indexOf(normAlias);
    if (idx !== -1) {
      const afterChar = normText[idx + normAlias.length];
      const isWordBoundary = !afterChar || !/[a-z0-9가-힣]/.test(afterChar);
      const p = isWordBoundary ? 2 : 3;
      if (p < bestPriority || (p === bestPriority && normAlias.length > bestAliasLen)) {
        bestPriority = p;
        bestAliasLen = normAlias.length;
      }
    }
  }

  return { priority: bestPriority, aliasLen: bestAliasLen };
};

const applyImportedCandidate = (candidate: ImportedMessage) => {
  if (accounts.length === 0) {
    alert("계좌 목록을 불러오는 중입니다. 잠시 후 다시 눌러주세요.");
    return;
  }
  const parsed = parseImportedMessage(candidate);

  const combinedText = `${candidate.sourceKey || ""} ${candidate.rawText || ""}`;

  // 별명 기반 우선순위 매칭
  type MatchResult = { account: Account; priority: number; aliasLen: number };
  const aliasMatches: MatchResult[] = accounts
    .filter((a) => a.type !== "STOCK")
    .map((account) => {
      const m = getBestAliasMatch(account, combinedText);
      return { account, ...m };
    })
    .filter((m) => m.priority < 4);

  // 우선순위 낮을수록 좋고 (1=최우선), 같으면 alias 길수록 좋음
  aliasMatches.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.aliasLen - a.aliasLen;
  });

  // sourceKey 완전 매칭 (P0으로 취급 - alias보다 우선)
  const sourceKey = normalizeKey(candidate.sourceKey);
  const sourceMatchedAccount = accounts.find((account) => {
    const accountSourceKey = normalizeKey(account.sourceKey || "");
    return accountSourceKey && sourceKey && accountSourceKey === sourceKey;
  });

  const matchedAccount = sourceMatchedAccount || aliasMatches[0]?.account || null;

setType(parsed.type);
setAmount(String(parsed.amount));
setCategory(parsed.category);
setMemo(parsed.memo);
setDate(parsed.date);
setOwner(myName);
  const matchedId = matchedAccount ? String(matchedAccount.id) : "";

  setFromAccountId(matchedId);
  setToAccountId("");

  setInputMode("MANUAL");

  setTimeout(() => {
    setFromAccountId(matchedId);
    setToAccountId("");
  }, 0);

setSelectedImportId(String(candidate.id));
console.log("MATCH_DEBUG", {
  combinedText,
  rawText: candidate.rawText,
  aliasMatches: aliasMatches.map((m) => ({
    id: m.account.id,
    name: m.account.name,
    priority: m.priority,
    aliasLen: m.aliasLen,
  })),
  matchedAccount: matchedAccount ? { id: matchedAccount.id, name: matchedAccount.name } : null,
});
};

  const saveTransaction = async () => {
    if (isSaving) return;

    if (type !== "STOCK" && !amount) {
      alert("금액을 입력하세요.");
      return;
    }
      if (type === "STOCK") {
      // 배당금 입금 처리
      if (stockTradeType === "DIVIDEND") {
        if (!stockAccountId || !dividendAmount) {
          alert("증권 계좌와 배당금 금액을 입력하세요.");
          return;
        }
        try {
          setIsSaving(true);
          const res = await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              familyId: getCurrentFamilyId(),
              userId: getCurrentUserId() || undefined,
              type: "INCOME",
              amount: Number(dividendAmount),
              category: "배당금",
              owner,
              memo: stockName ? `${stockName} 배당금` : "배당금",
              transactionAt: new Date(date).toISOString(),
              toAccountId: Number(stockAccountId),
            }),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            alert(data?.error || "배당금 저장 실패");
            return;
          }
          router.push("/transactions");
        } catch (err) {
          console.error(err);
          alert("배당금 저장 실패");
        } finally {
          setIsSaving(false);
        }
        return;
      }

      if (!stockAccountId || !stockName || !stockCode || !stockQuantity || !stockPrice) {
    alert("주식 거래 정보를 모두 입력하세요.");
    return;
  }

  try {
    setIsSaving(true);

    const res = await fetch("/api/stocks/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: Number(stockAccountId),
        tradeType: stockTradeType,
        name: stockName,
        code: stockCode,
        quantity: Number(stockQuantity),
        price: Number(stockPrice),
        owner,
        transactionAt: new Date(date).toISOString(),
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      alert(data?.error || "주식 거래 저장 실패");
      return;
    }

    router.push("/transactions");
  } catch (err) {
    console.error(err);
    alert("주식 거래 저장 실패");
  } finally {
    setIsSaving(false);
  }

  

  return;
}

    try {
      setIsSaving(true);

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          familyId: getCurrentFamilyId(),
          userId: getCurrentUserId() || undefined,
          type,
          amount: Number(amount),
          category,
          owner,
          memo: memo || null,
          repeat,
          transactionAt: new Date(date).toISOString(),
          fromAccountId:
            type === "INCOME" ? null : fromAccountId ? Number(fromAccountId) : null,
          toAccountId:
          type === "EXPENSE"
            ? null
            : type === "TRANSFER"
            ? toAccountId
              ? Number(toAccountId)
              : null
            : type === "INCOME"
            ? toAccountId
              ? Number(toAccountId)
              : null
            : null,
        }),
      });

      if (!res.ok) throw new Error("저장 실패");
      if (selectedImportId) {
        const nextUsedImportIds = Array.from(
          new Set([...usedImportIds, selectedImportId])
        );

        setUsedImportIds(nextUsedImportIds);
        localStorage.setItem(
          "alien_used_import_ids",
          JSON.stringify(nextUsedImportIds)
        );
      }

      router.push("/transactions");
    } catch (err) {
      console.error(err);
      alert("거래 저장 실패");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
       <header style={headerStyle}>
        <button onClick={() => router.back()} style={iconButtonStyle}>
          <X size={22} color={theme.colors.subtext} />
        </button>

        <strong
        style={{
          fontSize: 18,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        거래 추가
      </strong>
        <button
          type="button"
          onClick={async () => {
            if (inputMode === "MANUAL") {
              setInputMode("IMPORT");
              await loadImportedMessages();
              return;
            }

            setInputMode("MANUAL");
          }}
          style={{
            border: `1px solid ${theme.colors.border}`,
            background: inputMode === "IMPORT" ? theme.colors.primarySoft : "#FFFFFF",
            color: inputMode === "IMPORT" ? theme.colors.primary : theme.colors.subtext,
            borderRadius: 999,
            height: 30,
            padding: "0 10px",
            fontSize: 11,
            fontWeight: 900,
          }}
        >
          {isLoadingMessages
          ? "불러오는 중..."
          : inputMode === "MANUAL"
          ? "불러오기"
          : "직접입력"}
        </button>
      </header>
{inputMode === "IMPORT" && (
  <section style={importBoxStyle}>
    <div style={importHeaderStyle}>
      <strong>불러온 내역</strong>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 10, color: theme.colors.subtext }}>SMS + 카카오</span>
        <button
          type="button"
          onClick={refreshImportedMessages}
          disabled={isLoadingMessages}
          style={{
            border: "1px solid #DDD6FE",
            background: "#F4EFFE",
            color: "#7C5CFF",
            borderRadius: 999,
            height: 22,
            padding: "0 8px",
            fontSize: 10,
            fontWeight: 900,
            cursor: "pointer",
            opacity: isLoadingMessages ? 0.5 : 1,
          }}
        >
          {isLoadingMessages ? "⏳" : "🔄 새로고침"}
        </button>
        <button
          type="button"
          onClick={async () => {
            // 웹(Vercel)에서는 안내 메시지만 표시
            if (typeof window !== "undefined" && !(window as any).Capacitor?.isNativePlatform?.()) {
              alert("카카오톡 알림 읽기는 Android 앱에서만 지원됩니다.\n앱을 설치 후 사용해주세요.");
              return;
            }
            const granted = await isKakaoPermissionGranted();
            if (granted) {
              alert("카카오톡 알림 접근이 이미 허용되어 있습니다.\n불러오기 버튼을 눌러주세요.");
            } else {
              await openKakaoPermissionSettings();
              alert("설정에서 AlienAsset의 알림 접근을 허용한 후\n불러오기 버튼을 다시 눌러주세요.");
            }
          }}
          style={{
            border: "1px solid #F7E600",
            background: "#FFF9CC",
            color: "#7A6A00",
            borderRadius: 999,
            height: 22,
            padding: "0 8px",
            fontSize: 10,
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          💬 카카오 권한
        </button>
      </div>
    </div>


{[...new Map(importedMessages.map((item) => [item.rawText, item])).values()]
  .filter((item) => {
    const text = `${item.rawText} ${item.sourceKey}`.toLowerCase();

    return accounts.some((account) => {
      const { priority } = getBestAliasMatch(account, text);
      return priority < 4;
    });
  })
  .filter(
    (item) =>
      !usedImportIds.includes(String(item.id)) &&
      !hiddenImportIds.includes(String(item.id))
  )
  .sort(
    (a, b) =>
      new Date(b.receivedAt).getTime() -
      new Date(a.receivedAt).getTime()
  )
  .map((item) => {
  const parsed = parseImportedMessage(item);

  return (
    <div
      key={item.id}
      style={{
      ...importCardStyle,
      position: "relative",
      opacity: usedImportIds.includes(item.id) ? 0.45 : 1,
      filter: usedImportIds.includes(item.id)
        ? "grayscale(1)"
        : "none",
    }}
    >
      <button
  type="button"
  onClick={() => {
    const next = [...hiddenImportIds, String(item.id)];

    setHiddenImportIds(next);

    localStorage.setItem(
      "alien_hidden_import_ids",
      JSON.stringify(next)
    );
  }}
  style={{
    position: "absolute",
    top: 10,
    right: 10,
    border: "none",
    background: "transparent",
    fontSize: 16,
    cursor: "pointer",
    color: theme.colors.subtext,
  }}
>
  ×
</button>
      <div style={{ fontSize: 12, color: theme.colors.subtext }}>
        {item.sourceType} · {item.sourceKey}
      </div>

      <strong style={{ fontSize: 16 }}>
        {parsed.type === "INCOME" ? "+" : "-"}
        {parsed.amount.toLocaleString()}원
      </strong>

      <div style={{ fontSize: 13, color: theme.colors.text }}>
        {parsed.memo}
      </div>

      <pre style={rawTextStyle}>{item.rawText}</pre>

      <button
        type="button"
        disabled={false}
        onClick={() => applyImportedCandidate(item)}
        style={{
          ...importApplyButtonStyle,
          opacity: usedImportIds.includes(item.id) ? 0.5 : 1,
          cursor: usedImportIds.includes(item.id)
            ? "not-allowed"
            : "pointer",
        }}
      >
        이 내역으로 입력
      </button>
    </div>
  );
})}
  </section>
)}
{inputMode === "MANUAL" && (
  <>
    {/* ── 히어로 카드: 타입 + 금액 ── */}
    <div style={{
      background: `linear-gradient(160deg, ${activeColor}20 0%, ${activeColor}08 100%)`,
      border: `1.5px solid ${activeColor}40`,
      borderRadius: 24,
      padding: "14px 14px 18px",
    }}>
      {/* 타입 탭 */}
      <div style={typeGridStyle}>
        <TypeButton active={type === "EXPENSE"} label="지출" color={typeColorMap.EXPENSE} onClick={() => changeType("EXPENSE")} />
        <TypeButton active={type === "INCOME"}  label="수입" color={typeColorMap.INCOME}  onClick={() => changeType("INCOME")}  />
        <TypeButton active={type === "TRANSFER"} label="이체" color={typeColorMap.TRANSFER} onClick={() => changeType("TRANSFER")} />
        <TypeButton active={type === "STOCK"}   label="주식" color={typeColorMap.STOCK}   onClick={() => changeType("STOCK")}   />
      </div>

      {/* 금액 */}
      <div style={{ ...amountSectionStyle, padding: "14px 0 10px" }}>
        <div style={amountWrapStyle}>
          {!amount && <span style={{ ...amountPlaceholderStyle, color: `${activeColor}60` }}>0</span>}
          <input
            value={amount ? Number(amount).toLocaleString() : ""}
            onChange={(e) => {
              if (type === "STOCK" && stockTradeType !== "DIVIDEND") return;
              const v = e.target.value.replace(/[^0-9]/g, "");
              setAmount(v);
              if (stockTradeType === "DIVIDEND") setDividendAmount(v);
            }}
            onFocus={(e) => {
              if (type === "STOCK" && stockTradeType !== "DIVIDEND") { e.currentTarget.blur(); return; }
              scrollInputIntoView(e.currentTarget);
            }}
            readOnly={type === "STOCK" && stockTradeType !== "DIVIDEND"}
            style={{
              ...amountInputStyle,
              color: activeColor,
              ...(type === "STOCK" && stockTradeType !== "DIVIDEND"
                ? { opacity: 0.85, cursor: "default" }
                : {}),
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: `${activeColor}99`, fontWeight: 700, marginTop: 2 }}>
          원
          {type === "STOCK" && stockTradeType !== "DIVIDEND" && (
            <span style={{ marginLeft: 6, fontSize: 10, color: `${activeColor}70`, fontWeight: 600 }}>
              수량×단가 자동계산
            </span>
          )}
        </div>
      </div>

      {/* 사용자 + 날짜 한 줄 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 8, marginTop: 4 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[myName, partnerName, "공동"].map((name, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setOwner(name)}
              style={{
                height: 30, borderRadius: 999,
                padding: "0 10px", fontSize: 12, fontWeight: 800,
                border: owner === name ? `1.5px solid ${activeColor}` : `1px solid ${activeColor}30`,
                background: owner === name ? `${activeColor}20` : "rgba(255,255,255,0.6)",
                color: owner === name ? activeColor : `${activeColor}80`,
                cursor: "pointer",
              }}
            >{name}</button>
          ))}
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            border: `1px solid ${activeColor}30`,
            borderRadius: 10, padding: "4px 8px",
            fontSize: 12, fontWeight: 700,
            background: "rgba(255,255,255,0.7)",
            color: theme.colors.text, outline: "none",
          }}
        />
      </div>

      {/* 메모 — 히어로 카드 내부 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "rgba(255,255,255,0.55)",
        border: `1px solid ${activeColor}25`,
        borderRadius: 12, padding: "0 12px", height: 40, marginTop: 10,
      }}>
        <span style={{ fontSize: 14, opacity: 0.6 }}>📝</span>
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="메모 (선택)"
          onFocus={(e) => scrollInputIntoView(e.currentTarget)}
          style={{ flex: 1, border: "none", outline: "none", fontSize: 13, fontWeight: 600, background: "transparent", color: theme.colors.text }}
        />
      </div>
    </div>
      {/* ── 세부 정보 카드: 카테고리 + 계좌 + 메모 ── */}
      <div style={{
        background: `linear-gradient(160deg, ${activeColor}10 0%, ${activeColor}04 100%)`,
        border: `1px solid ${activeColor}28`,
        borderRadius: 24,
        padding: "16px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}>
      {type !== "STOCK" && (
        <section>
          <label style={{ ...compactLabelStyle, color: `${activeColor}99` }}>카테고리</label>

          <div
            ref={categoryScrollRef}
            style={categoryScrollWrapStyle}
            onMouseDown={(e) => startCategoryDrag(e.clientX)}
            onMouseMove={(e) => moveCategoryDrag(e.clientX)}
            onMouseUp={endCategoryDrag}
            onMouseLeave={endCategoryDrag}
            onTouchStart={(e) => startCategoryDrag(e.touches[0].clientX)}
            onTouchMove={(e) => moveCategoryDrag(e.touches[0].clientX)}
            onTouchEnd={endCategoryDrag}
          >
            <div style={categoryScrollStyle}>
              {sortedCategories.length === 0 && (
                <div style={{
                  padding: "10px 4px",
                  fontSize: 12,
                  color: theme.colors.subtext,
                  whiteSpace: "nowrap",
                }}>
                  프로필 → 카테고리 관리에서 추가해주세요
                </div>
              )}
              {sortedCategories.map((item) => {
                const Icon = item.icon as React.ElementType | null;
                const active = category === item.name;
                const favorite = favoriteCategories.includes(item.name);

                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setCategory(item.name);
                      // 카드 선결제 카테고리 벗어나면 toAccountId 초기화
                      if (item.name !== "카드 전월 선결제" && item.name !== "카드 이번달 선결제") {
                        setToAccountId("");
                      }
                    }}
                    onTouchStart={() => {
                      // 커스텀 카테고리만 길게 누르기 활성화
                      const customCat = customCategories.find(c => c.name === item.name);
                      if (customCat?.id) {
                        startLongPress(customCat.id);
                      }
                    }}
                    onTouchEnd={endLongPress}
                    onTouchMove={endLongPress}
                    onMouseDown={() => {
                      // 커스텀 카테고리만 길게 누르기 활성화
                      const customCat = customCategories.find(c => c.name === item.name);
                      if (customCat?.id) {
                        startLongPress(customCat.id);
                      }
                    }}
                    onMouseUp={endLongPress}
                    onMouseLeave={endLongPress}
                    style={{
                      ...categoryChipStyle,
                      border: active
                        ? `1px solid ${activeColor}`
                        : `1px solid ${theme.colors.border}`,
                      background: active ? activeSoftColor : "#FFFFFF",
                      color: active ? activeColor : theme.colors.text,
                      position: "relative",
                    }}
                  >
                    {Icon
                      ? <Icon size={15} color={active ? activeColor : theme.colors.subtext} />
                      : <span style={{ fontSize: 15 }}>
                          {/^[a-zA-Z]/.test((item as any).emoji || "") ? "👽" : ((item as any).emoji || "👽")}
                        </span>
                    }
                    <span>{item.name}</span>

                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.name);
                      }}
                      style={starWrapStyle}
                    >
                      <Star
                        size={14}
                        fill={favorite ? activeColor : "none"}
                        color={favorite ? activeColor : theme.colors.subtext}
                      />
                    </span>
                    
                    {/* 삭제 확인 오버레이 */}
                    {isLongPress && 
                     categoryToDelete === customCategories.find(c => c.name === item.name)?.id && (
                      <div 
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(255,255,255,0.9)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          borderRadius: 999,
                          zIndex: 10,
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCategory(categoryToDelete);
                          }}
                          style={{
                            border: "none",
                            background: "#E11D48",
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        >
                          삭제
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCategoryToDelete(null);
                            setIsLongPress(false);
                          }}
                          style={{
                            border: "none",
                            background: "#F1F1F1",
                            padding: "4px 8px",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        >
                          취소
                        </button>
                      </div>
                    )}
                  </button>
                );
              })}

              {/* 카테고리 추가는 프로필 > 카테고리 관리에서만 가능 */}
            </div>
          </div>
        </section>
      )}

        {false && showAddCategory && (
          <section style={addCategoryBoxStyle}>
            <div style={addCategoryHeaderStyle}>
              <strong>새 카테고리 추가</strong>
              <button
                type="button"
                onClick={() => setShowAddCategory(false)}
                style={iconButtonStyle}
              >
                <X size={17} color={theme.colors.subtext} />
              </button>
            </div>

            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="예: 병원, 여행, 구독"
              style={categoryNameInputStyle}
            />

            <div style={iconListStyle}>
              {allIconItems.map((item) => {
                const Icon = item.icon as React.ElementType;
                const active = newCategoryIconKey === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setNewCategoryIconKey(item.key)}
                    style={{
                      ...iconSelectButtonStyle,
                      border: active
                        ? `1px solid ${activeColor}`
                        : `1px solid ${theme.colors.border}`,
                      background: active ? activeSoftColor : "#FFFFFF",
                      color: active ? activeColor : theme.colors.subtext,
                    }}
                  >
                    <Icon size={20} />
                  </button>
                );
              })}
            </div>

            <div style={addCategoryActionStyle}>
              <button
                type="button"
                onClick={() => setShowAddCategory(false)}
                style={cancelCategoryButtonStyle}
              >
                취소
              </button>

              <button
                type="button"
                onClick={addCustomCategory}
                style={{
                  ...confirmCategoryButtonStyle,
                  background: activeColor,
                }}
              >
                추가하기
              </button>
            </div>
          </section>
        )}


{type === "STOCK" ? (
  <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>

    {/* 매수 / 매도 / 배당금 토글 */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
      {([
        { key: "BUY",      label: "📈 매수",  color: "#4CD6A5" },
        { key: "SELL",     label: "📉 매도",  color: "#FF6B81" },
        { key: "DIVIDEND", label: "💰 배당금", color: "#F59E0B" },
      ] as const).map(({ key, label, color }) => (
        <button
          key={key}
          type="button"
          onClick={() => setStockTradeType(key)}
          style={{
            height: 48, borderRadius: 18,
            border: stockTradeType === key ? `1.5px solid ${color}` : `1px solid ${activeColor}25`,
            background: stockTradeType === key
              ? `linear-gradient(135deg, ${color}20 0%, ${color}08 100%)`
              : "rgba(255,255,255,0.6)",
            color: stockTradeType === key ? color : theme.colors.subtext,
            fontWeight: 900, fontSize: 13,
            cursor: "pointer",
          }}
        >{label}</button>
      ))}
    </div>

    {/* 증권 계좌 */}
    <div>
      <label style={{ ...compactLabelStyle, color: `${activeColor}99` }}>증권 계좌</label>
      <AccountSelect
        label=""
        value={stockAccountId}
        accounts={accounts.filter((account) => account.type === "STOCK")}
        onChange={setStockAccountId}
        activeColor={activeColor}
      />
    </div>

    {/* 배당금 폼 */}
    {stockTradeType === "DIVIDEND" ? (
      <>
        {/* 배당금: 종목명(메모용, 선택) */}
        <div style={{
          height: 52, borderRadius: 18,
          border: `1px solid ${activeColor}28`,
          display: "grid", gridTemplateColumns: "auto 1fr",
          alignItems: "center", padding: "0 14px", gap: 8,
          background: "rgba(255,255,255,0.75)",
        }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: `${activeColor}99`, whiteSpace: "nowrap" }}>종목</span>
          <select
            value={selectedStockId}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedStockId(value);
              const selected = stockHoldings.find((item) => String(item.id) === value);
              if (selected) setStockName(selected.name);
              else setStockName("");
            }}
            style={{ ...accountSelectStyle, color: theme.colors.text }}
          >
            <option value="">종목 선택 (선택사항)</option>
            <option value="__COMMON__">공통</option>
            {stockHoldings.map((item) => (
              <option key={item.id} value={item.id}>{item.name}({item.code})</option>
            ))}
          </select>
        </div>

        {/* 배당금 금액 */}
        <input
          value={dividendAmount}
          onChange={(e) => { setDividendAmount(e.target.value); setAmount(e.target.value.replace(/[^0-9]/g, "")); }}
          placeholder="배당금 금액 (원)"
          type="number"
          style={{
            ...categoryNameInputStyle,
            border: `1px solid ${activeColor}28`,
            background: "rgba(255,255,255,0.75)",
          }}
        />

        {/* 안내 텍스트 */}
        <div style={{
          fontSize: 11, color: theme.colors.subtext,
          padding: "6px 4px", lineHeight: 1.6,
        }}>
          💰 배당금은 <strong>예수금으로 입금</strong>되며 <strong>수익률에 포함</strong>됩니다.
        </div>
      </>
    ) : (
      <>
        {/* 종목 선택 */}
        <div style={{
          height: 52, borderRadius: 18,
          border: `1px solid ${activeColor}28`,
          display: "grid", gridTemplateColumns: "auto 1fr",
          alignItems: "center", padding: "0 14px", gap: 8,
          background: "rgba(255,255,255,0.75)",
        }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: `${activeColor}99`, whiteSpace: "nowrap" }}>종목</span>
          <select
            value={stockMode === "NEW" ? "__NEW__" : selectedStockId}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "__NEW__") {
                setStockMode("NEW");
                setSelectedStockId("");
                setStockName("");
                setStockCode("");
                return;
              }
              setStockMode("EXISTING");
              setSelectedStockId(value);
              const selected = stockHoldings.find((item) => String(item.id) === value);
              if (selected) { setStockName(selected.name); setStockCode(selected.code); }
            }}
            style={{ ...accountSelectStyle, color: theme.colors.text }}
          >
            <option value="">보유종목 선택</option>
            {stockHoldings.map((item) => (
              <option key={item.id} value={item.id}>{item.name}({item.code})</option>
            ))}
            <option value="__NEW__">+ 신규 종목 추가</option>
          </select>
        </div>

        {stockMode === "NEW" && (
          <div style={{ display: "grid", gap: 8 }}>
            <input
              value={stockName}
              onChange={(e) => setStockName(e.target.value)}
              placeholder="종목명 예: 삼성전자"
              style={{
                ...categoryNameInputStyle,
                border: `1px solid ${activeColor}28`,
                background: "rgba(255,255,255,0.75)",
              }}
            />
            <input
              value={stockCode}
              onChange={(e) => setStockCode(e.target.value)}
              placeholder="종목코드 예: 005930"
              style={{
                ...categoryNameInputStyle,
                border: `1px solid ${activeColor}28`,
                background: "rgba(255,255,255,0.75)",
              }}
            />
          </div>
        )}

        {/* 수량 / 단가 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { value: stockQuantity, setter: setStockQuantity, placeholder: "수량 (주)" },
            { value: stockPrice,    setter: setStockPrice,    placeholder: "단가 (원)" },
          ].map(({ value, setter, placeholder }) => (
            <input
              key={placeholder}
              value={value ? Number(value).toLocaleString() : ""}
              onChange={(e) => setter(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder={placeholder}
              inputMode="numeric"
              style={{
                ...categoryNameInputStyle,
                border: `1px solid ${activeColor}28`,
                background: "rgba(255,255,255,0.75)",
              }}
            />
          ))}
        </div>
      </>
    )}
  </section>
) : (
  <section>
    {/* 계좌 레이블 + 나/파트너/공동 토글 (이체는 필터 없이 전체 표시) */}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
      <label style={{ ...compactLabelStyle, marginBottom: 0, color: `${activeColor}99` }}>
        {type === "INCOME" ? "입금 계좌" : type === "EXPENSE" ? "출금 계좌" : "이체 계좌"}
      </label>
      {type !== "TRANSFER" && (
        <div style={{ display: "flex", gap: 4 }}>
          {([myName, partnerName, "공동"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setAccountFilter(f)}
              style={{
                height: 24, padding: "0 8px", borderRadius: 999,
                fontSize: 11, fontWeight: 800, cursor: "pointer",
                border: accountFilter === f ? `1.5px solid ${activeColor}` : `1px solid ${activeColor}25`,
                background: accountFilter === f ? `${activeColor}18` : "rgba(255,255,255,0.6)",
                color: accountFilter === f ? activeColor : theme.colors.subtext,
              }}
            >{f}</button>
          ))}
        </div>
      )}
    </div>

    {type === "TRANSFER" ? (
      <div style={{ display: "grid", gap: 10 }}>
        {/* 카드 선결제 안내 */}
        {(category === "카드 전월 선결제" || category === "카드 이번달 선결제") && (
          <div style={{ padding: "8px 12px", borderRadius: 12, background: "#FFF7ED", border: "1px solid #FED7AA", fontSize: 11, color: "#F97316", fontWeight: 700 }}>
            💳 {category === "카드 전월 선결제" ? "전월 카드 예상납부액에서 차감됩니다" : "이번달 카드 예상납부액에서 차감됩니다"}
          </div>
        )}
        <AccountSelect
          label="출금"
          value={fromAccountId}
          accounts={accounts}
          onChange={setFromAccountId}
          activeColor={activeColor}
        />
        <AccountSelect
          label={category === "카드 전월 선결제" || category === "카드 이번달 선결제" ? "카드 계좌" : "입금"}
          value={toAccountId}
          accounts={
            category === "카드 전월 선결제" || category === "카드 이번달 선결제"
              ? accounts.filter((a: any) => a.type === "CARD")
              : accounts
          }
          onChange={setToAccountId}
          activeColor={activeColor}
        />
      </div>
    ) : (
      <AccountSelect
        label={type === "INCOME" ? "입금" : "출금"}
        value={type === "INCOME" ? toAccountId : fromAccountId}
        accounts={filteredAccounts}
        onChange={(val) => {
          if (type === "INCOME") {
            setToAccountId(val);
            setFromAccountId("");
          } else {
            setFromAccountId(val);
            setToAccountId("");
          }
        }}
        activeColor={activeColor}
      />
    )}
  </section>
)}

      </div>{/* ── 세부 정보 카드 끝 ── */}

      </>
    )}

        <BottomNav />
      </div>

      {/* ── 저장 버튼: 하단바 바로 위 고정 ── */}
      {inputMode === "MANUAL" && (
        <div style={{
          position: "fixed",
          bottom: keyboardHeight > 0 ? keyboardHeight + 8 : 88,
          left: 0, right: 0,
          padding: "10px 18px",
          background: "linear-gradient(to top, rgba(255,255,255,1) 60%, rgba(255,255,255,0))",
          zIndex: 50,
          display: "flex",
          justifyContent: "center",
          transition: "bottom 0.2s ease",
        }}>
          <button
            onClick={saveTransaction}
            disabled={isSaving}
            style={{
              ...saveButtonStyle,
              width: "100%",
              maxWidth: 390,
              background: isSaving
                ? theme.colors.border
                : `linear-gradient(135deg, ${activeColor} 0%, ${theme.colors.primary} 100%)`,
              opacity: isSaving ? 0.7 : 1,
              color: isSaving ? theme.colors.subtext : "#FFFFFF",
              boxShadow: isSaving ? "none" : `0 8px 24px ${activeColor}50`,
            }}
          >
            {isSaving ? "저장 중..." : "저장"}
          </button>
        </div>
      )}
    </main>
    
  );
}

const getAccountOwnerLabel = (account: Account, myUserId?: number) => {
  // 계좌 소유자는 고정이므로 DB 실제 이름 사용
  // 단, 현재 기기 사용자 본인 계좌는 "나"로 표시
  if (!account.owner) return "공동";
  if (myUserId && account.owner.id === myUserId) return "나";
  return account.owner.name || "공동";
};

function TypeButton({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active?: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 42,
        borderRadius: 16,
        border: active
          ? `1px solid ${color}`
          : `1px solid ${theme.colors.border}`,
        background: active ? `${color}15` : "#FFFFFF",
        color: active ? color : theme.colors.subtext,
        fontWeight: 900,
        fontSize: 14,
      }}
    >
      {label}
    </button>
  );
}

function UserButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 42,
        borderRadius: 16,
        border: active
          ? `1px solid ${theme.colors.primary}`
          : `1px solid ${theme.colors.border}`,
        background: active ? theme.colors.primarySoft : "#FFFFFF",
        color: active ? theme.colors.primary : theme.colors.subtext,
        fontWeight: 900,
        fontSize: 14,
      }}
    >
      {label}
    </button>
  );
}

function AccountSelect({
  label = "",
  value,
  accounts,
  onChange,
  activeColor = theme.colors.primary,
}: {
  label?: string;
  value: string;
  accounts: Account[];
  onChange: (value: string) => void;
  activeColor?: string;
}) {
  const myUserId = getCurrentUserId();
  const myAccounts = accounts.filter((a) =>
    myUserId ? a.owner?.id === myUserId : a.owner?.role === "OWNER"
  );
  const partnerAccounts = accounts.filter((a) =>
    myUserId ? (a.owner && a.owner.id !== myUserId) : a.owner?.role === "MEMBER"
  );
  const sharedAccounts = accounts.filter((a) => !a.owner);
  const [favoriteAccountIds, setFavoriteAccountIds] = useState<string[]>(() => {
  if (typeof window === "undefined") return [];
  const _uid = getCurrentUserId();
  return JSON.parse(
    localStorage.getItem(`alien_favorite_account_ids_${_uid || 0}`) || "[]"
  );
});

const toggleFavoriteAccount = (accountId: string) => {
  const next = favoriteAccountIds.includes(accountId)
    ? favoriteAccountIds.filter((id: string) => id !== accountId)
    : [...favoriteAccountIds, accountId];

  setFavoriteAccountIds(next);
  const _uid = getCurrentUserId();
  localStorage.setItem(
    `alien_favorite_account_ids_${_uid || 0}`,
    JSON.stringify(next)
  );
};
  const sortAccountsByFavorite = (list: Account[]) => {
    return [...list].sort((a, b) => {
      const aFav = favoriteAccountIds.includes(String(a.id)) ? 0 : 1;
      const bFav = favoriteAccountIds.includes(String(b.id)) ? 0 : 1;
      return aFav - bFav;
    });
  };
  const allAccounts = sortAccountsByFavorite([
    ...myAccounts,
    ...partnerAccounts,
    ...sharedAccounts,
  ]);

  return (
    <AccountGroup
      title={label}
      accounts={allAccounts}
      selectedId={value}
      favoriteAccountIds={favoriteAccountIds}
      onToggleFavorite={toggleFavoriteAccount}
      onSelect={onChange}
      myUserId={myUserId}
      activeColor={activeColor}
    />
  );
}

function AccountGroup({
  title,
  accounts,
  selectedId,
  favoriteAccountIds,
  onToggleFavorite,
  onSelect,
  myUserId,
  activeColor = theme.colors.primary,
}: {
    title: string;
    accounts: Account[];
    selectedId: string;
    favoriteAccountIds: string[];
    onToggleFavorite: (accountId: string) => void;
    onSelect: (value: string) => void;
    myUserId?: number;
    activeColor?: string;
}) {
  if (accounts.length === 0) return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: theme.colors.subtext, paddingLeft: 2 }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: theme.colors.subtext, paddingLeft: 2 }}>
        분석 → 자산 → 리스트 추가에서 계좌를 먼저 추가해주세요
      </div>
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {title ? (
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            color: theme.colors.text,
            paddingLeft: 2,
          }}
        >
          {title}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {accounts.map((account) => {
          const selected = String(selectedId) === String(account.id);
          const balance =
            account.type === "CARD"
              ? Math.abs(Number(account.balance || 0))
              : Number(account.balance || 0);

          return (
            <button
              key={account.id}
              type="button"
              onClick={() => onSelect(String(account.id))}
              style={{
                width: 122,
                height: 62,
                flex: "0 0 122px",
                position: "relative",
                borderRadius: 18,
                border: selected
                  ? `1.5px solid ${activeColor}`
                  : `1px solid ${activeColor}25`,
                background: selected ? `${activeColor}15` : "rgba(255,255,255,0.75)",
                padding: "10px 28px 10px 12px",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                

                <div>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 4,
    }}
  >
    <div
      style={{
        fontSize: 14,
        fontWeight: 900,
        color: theme.colors.text,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: 78,
      }}
    >
      {account.name}
    </div>

    <div
      onClick={(e) => {
        e.stopPropagation();
        onToggleFavorite(String(account.id));
      }}
      style={{
        position: "absolute",
        top: 10,
        right: 9,
        border: "none",
        background: "transparent",
        padding: 0,
        width: 16,
        height: 16,
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
      }}
    >
      <Star
        size={13}
        fill={
          favoriteAccountIds.includes(String(account.id))
            ? theme.colors.primary
            : "none"
        }
        color={
          favoriteAccountIds.includes(String(account.id))
            ? theme.colors.primary
            : theme.colors.subtext
        }
      />
    </div>
  </div>

  <div
    style={{
      fontSize: 11,
      fontWeight: 800,
      color: theme.colors.subtext,
      marginTop: 2,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth:78,
    }}
  >
    {getAccountOwnerLabel(account, myUserId)}
  </div>
</div>
              </div>

            </button>
          );
        })}
      </div>
    </div>
  );
}

const getAccountIcon = (type: string) => {
  if (type === "BANK") return "🏦";
  if (type === "STOCK") return "📈";
  if (type === "CARD") return "💳";
  if (type === "SAVING") return "🐷";
  if (type === "CASH") return "💵";
  return "🛸";
};

const pageStyle = {
  minHeight: "100vh",
  background: "#FFFFFF",
  padding: "calc(64px + env(safe-area-inset-top)) 18px calc(180px + env(safe-area-inset-bottom))",
  display: "flex",
  justifyContent: "center",
} as const;

const containerStyle = {
  width: "100%",
  maxWidth: 390,
  display: "flex",
  flexDirection: "column",
  gap: 10,
} as const;

const compactLabelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 900,
  marginBottom: 8,
  color: theme.colors.subtext,
  textTransform: "uppercase" as const,
  letterSpacing: 0.5,
} as const;

const headerStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 100,
  display: "grid",
  gridTemplateColumns: "36px 1fr 86px",
  alignItems: "center",
  gap: 8,
  padding: "calc(env(safe-area-inset-top) + 12px) 18px 12px",
  background: "rgba(255,255,255,0.95)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  borderBottom: "1px solid #F0EAFF",
};

const iconButtonStyle = {
  border: "none",
  background: "transparent",
  padding: 0,
  cursor: "pointer",
} as const;

const typeGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr 1fr",
  gap: 8,
} as const;

const amountSectionStyle = {
  textAlign: "center",
  padding: "12px 0 2px",
} as const;

const amountInputStyle = {
  width: "100%",
  border: "none",
  outline: "none",
  textAlign: "center",
  fontSize: 56,
  fontWeight: 950,
  color: theme.colors.text,
  letterSpacing: "-2.5px",
  background: "transparent",
} as const;

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 900,
  marginBottom: 10,
  color: theme.colors.text,
} as const;

const categoryScrollWrapStyle = {
  width: "100%",
  overflowX: "auto",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  paddingBottom: 2,
  cursor: "grab",
  WebkitOverflowScrolling: "touch",
  touchAction: "pan-x",
  userSelect: "none",
} as const;

const categoryScrollStyle = {
  display: "flex",
  gap: 8,
  minWidth: "max-content",
} as const;

const categoryChipStyle = {
  flexShrink: 0,
  height: 42,
  borderRadius: 999,
  padding: "0 12px",
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontWeight: 900,
  fontSize: 13,
  background: "#FFFFFF",
} as const;

const starWrapStyle = {
  display: "grid",
  placeItems: "center",
  width: 18,
  height: 18,
  marginLeft: 2,
} as const;

const addCategoryBoxStyle = {
  border: `1px solid ${theme.colors.border}`,
  borderRadius: 20,
  padding: 14,
  background: "#FFFFFF",
} as const;

const addCategoryHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
  fontSize: 14,
} as const;

const categoryNameInputStyle = {
  width: "100%",
  height: 46,
  borderRadius: 16,
  border: `1px solid ${theme.colors.border}`,
  padding: "0 14px",
  outline: "none",
  fontSize: 14,
  fontWeight: 800,
} as const;

const iconListStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 8,
  marginTop: 12,
  maxHeight: 180,
  overflowY: "auto",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
} as const;

const iconSelectButtonStyle = {
  height: 56,
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#FFFFFF",
} as const;

const addCategoryActionStyle = {
  display: "grid",
  gridTemplateColumns: "96px 1fr",
  gap: 10,
  marginTop: 14,
} as const;

const cancelCategoryButtonStyle = {
  height: 46,
  border: "none",
  borderRadius: 16,
  background: "#F7F4FA",
  color: theme.colors.subtext,
  fontWeight: 900,
} as const;

const confirmCategoryButtonStyle = {
  height: 46,
  border: "none",
  borderRadius: 16,
  color: "#FFFFFF",
  fontWeight: 900,
} as const;

const userGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 10,
} as const;

const accountSelectWrapStyle = {
  height: 52,
  borderRadius: 18,
  border: `1px solid ${theme.colors.border}`,
  display: "grid",
  gridTemplateColumns: "56px 1fr",
  alignItems: "center",
  padding: "0 14px",
  gap: 8,
  background: "rgba(255,255,255,0.75)",
} as const;

const accountSelectLabelStyle = {
  fontSize: 12,
  fontWeight: 900,
  color: theme.colors.subtext,
} as const;

const accountSelectStyle = {
  width: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: 14,
  fontWeight: 800,
} as const;

const memoStyle = {
  width: "100%",
  minHeight: 84,
  borderRadius: 20,
  border: `1px solid ${theme.colors.border}`,
  padding: 16,
  resize: "none" as const,
  outline: "none",
  fontSize: 14,
  background: "#FFFFFF",
} as const;

const extraBoxStyle = {
  border: `1px solid ${theme.colors.border}`,
  borderRadius: 20,
  padding: 16,
  background: "#FFFFFF",
} as const;

const extraHeaderButtonStyle = {
  width: "100%",
  border: "none",
  background: "transparent",
  padding: 0,
  display: "flex",
  justifyContent: "space-between",
  fontWeight: 900,
  marginBottom: 14,
} as const;

const extraRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 0",
  fontSize: 14,
} as const;

const extraLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: theme.colors.subtext,
} as const;

const dateInputStyle = {
  border: "none",
  outline: "none",
  textAlign: "right",
  fontSize: 14,
  background: "transparent",
} as const;

const selectStyle = {
  border: "none",
  outline: "none",
  textAlign: "right",
  fontSize: 14,
  background: "transparent",
} as const;

const saveButtonStyle = {
  height: 58,
  border: "none",
  borderRadius: 20,
  color: "white",
  fontSize: 16,
  fontWeight: 950,
} as const;

const amountWrapStyle = {
  position: "relative",
  width: "100%",
} as const;

const amountPlaceholderStyle = {
  position: "absolute",
  left: "50%",
  transform: "translateX(-50%)",
  top: 0,
  width: "100%",
  textAlign: "center",
  fontSize: 56,
  fontWeight: 950,
  color: theme.colors.subtext,
  pointerEvents: "none",
} as const;

const importBoxStyle = {
  display: "grid",
  gap: 12,
} as const;

const importHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 13,
  color: theme.colors.subtext,
} as const;

const importCardStyle = {
  border: `1px solid ${theme.colors.border}`,
  borderRadius: 22,
  padding: 16,
  background: "#FFFFFF",
  display: "grid",
  gap: 8,
} as const;

const rawTextStyle = {
  margin: 0,
  padding: 12,
  borderRadius: 16,
  background: "#F8F5FF",
  color: theme.colors.subtext,
  fontSize: 12,
  whiteSpace: "pre-wrap",
} as const;

const importApplyButtonStyle = {
  height: 46,
  border: "none",
  borderRadius: 16,
  background: theme.colors.primary,
  color: "#FFFFFF",
  fontWeight: 900,
} as const;
