"use client";

import { useRouter } from "next/navigation";
import BottomNav from "@/components/navigation/BottomNav";
import { theme } from "@/components/lib/theme";
import { useEffect, useMemo, useRef, useState } from "react";
import { readRecentSms } from "@/components/lib/smsReader";

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
} from "lucide-react";

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
  TRANSFER: theme.colors.primary,
  STOCK: "#f3a24c",
};

const typeSoftColorMap = {
  EXPENSE: "#FFEAF3",
  INCOME: "#ECFFF6",
  TRANSFER: theme.colors.primarySoft,
   STOCK: "#fff3ec",
};

const categoryMap = {
  EXPENSE: [
    { name: "식비", icon: Utensils },
  ],
  INCOME: [{ name: "수입", icon: Wallet }],
  TRANSFER: [{ name: "이체", icon: ArrowLeftRight }],
  STOCK: [{ name: "주식", icon: PiggyBank }],
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
    { key: "자동이체", icon: Repeat },
    { key: "카드대금", icon: CreditCard },
    { key: "저축이동", icon: PiggyBank },
    { key: "은행", icon: Landmark },
  ],
  STOCK: [
    { key: "주식", icon: PiggyBank },
    { key: "매수", icon: Plus },
    { key: "매도", icon: ArrowDownCircle },
  ],
};

export default function AddTransactionPage() {
  const router = useRouter();

  const [myName, setMyName] = useState("민준");
  const [partnerName, setPartnerName] = useState("지영");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [favoriteAccountIds, setFavoriteAccountIds] = useState<string[]>([]);
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("식비");
  const [memo, setMemo] = useState("");
  const [owner, setOwner] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [repeat, setRepeat] = useState("반복 안함");
  const [showOptions, setShowOptions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [inputMode, setInputMode] = useState<"MANUAL" | "IMPORT">("MANUAL");


  const [usedImportIds, setUsedImportIds] = useState<string[]>([]);
  const [selectedImportId, setSelectedImportId] = useState<string>("");
  const [hiddenImportIds, setHiddenImportIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      return JSON.parse(
        localStorage.getItem("alien_hidden_import_ids") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [stockTradeType, setStockTradeType] = useState<"BUY" | "SELL">("BUY");
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
    { id?: number; name: string; iconKey: string }[]
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
type ImportedMessage = {
  receivedAt: string;
  id: string;
  sourceType: "SMS" | "KAKAO";
  sourceKey: string;
  rawText: string;
};

const [importedMessages, setImportedMessages] = useState<ImportedMessage[]>([]);
const [isLoadingMessages, setIsLoadingMessages] = useState(false);


const parseImportedMessage = (item: ImportedMessage) => {
  const text = item.rawText || "";

  const cleanText = text.replace(/누적\s*\d{1,3}(?:,\d{3})*\s*원/g, "");

  const amountMatch =
    cleanText.match(/(?:입금|출금|승인|결제|사용|자동결제)\s*(\d{1,3}(?:,\d{3})+|\d+)\s*원?/) ||
    cleanText.match(/(\d{1,3}(?:,\d{3})+|\d+)\s*원/);
    
  const amount = amountMatch
    ? Number(amountMatch[1].replace(/,/g, ""))
    : 0;

  const type: TransactionType =
    /입금/.test(text) ? "INCOME" : "EXPENSE";

  return {
    type,
    amount,
    category: type === "INCOME" ? "수입" : "기타",
    date: new Date().toISOString().slice(0, 10),
    accountNameHint: item.sourceKey || "",
    memo: text.replace(/\s+/g, " ").slice(0, 40),
  };
};

  const activeColor = typeColorMap[type];
  const activeSoftColor = typeSoftColorMap[type];
  const customIconList = customIconMap[type];
  const defaultCategories = categoryMap[type];

  
  const customMappedCategories = customCategories.map((item) => {
    const foundIcon =
      customIconList.find((iconItem) => iconItem.key === item.iconKey)?.icon ||
      Home;

    return {
      name: item.name,
      icon: foundIcon,
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
    const saved = localStorage.getItem("alien_used_import_ids");

    if (saved) {
      setUsedImportIds(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    setMyName(localStorage.getItem("alien_my_name") || "민준");
    setPartnerName(localStorage.getItem("alien_partner_name") || "지영");
    setFavoriteAccountIds(
      JSON.parse(localStorage.getItem("alien_favorite_account_ids") || "[]")
    );
    fetch("/api/accounts/simple")
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


  // 카테고리 로드
  useEffect(() => {
    const loadCategories = async () => {
      try {
        // 서버에서 카테고리 로드
        const res = await fetch(`/api/categories?familyId=1&type=${type}`);
        const data = await res.json();
        
        if (Array.isArray(data)) {
          // 서버에서 받은 카테고리 처리
          const serverCategories = data.map(cat => ({
            id: cat.id,
            name: cat.name,
            iconKey: cat.name // 아이콘 키는 이름과 동일하게 설정 (기본값)
          }));
          
          // 기본 카테고리 제외한 커스텀 카테고리만 설정
          const defaultNames = categoryMap[type].map(c => c.name);
          const customCats = serverCategories.filter(
            (cat, index, self) =>
              !defaultNames.includes(cat.name) &&
              self.findIndex((item) => item.name === cat.name) === index
          );
          
          setCustomCategories(customCats);
        }
        
        // 즐겨찾기는 여전히 로컬에 저장
        const savedFavorites = localStorage.getItem(
          `alien_favorite_categories_${type}`
        );

        const fallback =
          type === "EXPENSE"
            ? ["식비", "카페", "쇼핑"]
            : type === "INCOME"
            ? ["수입"]
            : ["이체"];

        setFavoriteCategories(savedFavorites ? JSON.parse(savedFavorites) : fallback);
      } catch (error) {
        console.error("카테고리 로드 오류:", error);
        
        
        const savedFavorites = localStorage.getItem(
          `alien_favorite_categories_${type}`
        );

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
    localStorage.setItem("alien_favorite_account_ids", JSON.stringify(next));
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
    setCategory(categoryMap[nextType][0].name);

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
    localStorage.setItem(
      `alien_favorite_categories_${type}`,
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
          familyId: 1,
          name,
          type,
          displayOrder: customCategories.length
        }),
      });

      if (!res.ok) {
        throw new Error("카테고리 추가 실패");
      }

      const newCategory = await res.json();
      const refreshRes = await fetch(`/api/categories?familyId=1&type=${type}`);
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
    
    const refreshRes = await fetch(`/api/categories?familyId=1&type=${type}`);
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

    const smsList = await readRecentSms(50);

    const nextMessages: ImportedMessage[] = smsList.map((sms) => ({
      receivedAt: new Date(sms.date).toISOString(),
      id: `sms-${sms.id}`,
      sourceType: "SMS",
      sourceKey: sms.address || "",
      rawText: sms.body || "",
    }));

    setImportedMessages(nextMessages);
  } catch (error) {
    console.error(error);
    alert("문자 불러오기에 실패했습니다.");
  } finally {
    setIsLoadingMessages(false);
  }
};


const applyImportedCandidate = (candidate: ImportedMessage) => {
  if (accounts.length === 0) {
    alert("계좌 목록을 불러오는 중입니다. 잠시 후 다시 눌러주세요.");
    return;
  }
  const parsed = parseImportedMessage(candidate);

  const sourceKey = normalizeKey(candidate.sourceKey);
  const bankName = normalizeKey(parsed.accountNameHint || "");
  const rawKey = normalizeKey(candidate.rawText || "");

  
  const sourceMatchedAccount = accounts.find((account) => {
  const accountSourceKey = normalizeKey(account.sourceKey || "");
  return accountSourceKey && sourceKey && accountSourceKey === sourceKey;
});

const fullNameMatchedAccount = accounts.find((account) => {
  const accountName = normalizeKey(account.name || "");
  return account.type !== "STOCK" && bankName && accountName === bankName;
});

const sourcePartialMatchedAccount = accounts.find((account) => {
  const accountSourceKey = normalizeKey(account.sourceKey || "");

  const targetText = normalizeKey(
    `${candidate.sourceKey || ""} ${candidate.rawText || ""} ${
      parsed.accountNameHint || ""
    }`
  );

  if (!accountSourceKey || accountSourceKey.length < 2) return false;

  return targetText.includes(accountSourceKey);
});
const bankPartialMatchedAccount = accounts.find((account) => {
  const accountName = normalizeKey(account.name || "");

  return (
    account.type !== "STOCK" &&
    bankName &&
    accountName &&
    (accountName.includes(bankName) || bankName.includes(accountName))
  );
});

const matchedAccount =
  sourceMatchedAccount ||
  sourcePartialMatchedAccount ||
  fullNameMatchedAccount ||
  bankPartialMatchedAccount;

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
  sourceKey,
  bankName,
  rawText: candidate.rawText,
  accounts: accounts.map((a) => ({
    id: a.id,
    name: a.name,
    sourceKey: a.sourceKey,
  })),
  sourcePartialMatchedAccount,
  matchedAccount,
});
};

  const saveTransaction = async () => {
    if (isSaving) return;

    if (type !== "STOCK" && !amount) {
      alert("금액을 입력하세요.");
      return;
    }
      if (type === "STOCK") {
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
          familyId: 1,
          userId: 1,
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
              : fromAccountId
              ? Number(fromAccountId)
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
      <span>SMS / 카카오톡 후보</span>
    </div>


{[...new Map(importedMessages.map((item) => [item.rawText, item])).values()]
  .filter((item) => {
    const text = `${item.rawText} ${item.sourceKey}`.toLowerCase();

    return accounts.some((account) => {
      const aliasMatch =
        account.aliases?.some((alias: string) =>
          text.includes(alias.toLowerCase())
        ) ?? false;

      const sourceMatch =
        account.sourceKey &&
        text.includes(String(account.sourceKey).toLowerCase());

      return aliasMatch || sourceMatch;
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
        <div style={typeGridStyle}>
          <TypeButton
            active={type === "EXPENSE"}
            label="지출"
            color={typeColorMap.EXPENSE}
            onClick={() => changeType("EXPENSE")}
          />
          <TypeButton
            active={type === "INCOME"}
            label="수입"
            color={typeColorMap.INCOME}
            onClick={() => changeType("INCOME")}
          />
          <TypeButton
            active={type === "TRANSFER"}
            label="이체"
            color={typeColorMap.TRANSFER}
            onClick={() => changeType("TRANSFER")}
          />
          <TypeButton
            active={type === "STOCK"}
            label="주식"
            color={typeColorMap.STOCK}
            onClick={() => changeType("STOCK")}
          />
        </div>

<section style={amountSectionStyle}>
  <div style={amountWrapStyle}>
    {!amount && <span style={amountPlaceholderStyle}>0</span>}

    <input
      value={amount ? Number(amount).toLocaleString() : ""}
      onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
      style={amountInputStyle}
    />
  </div>
</section>
      {type !== "STOCK" && (
        <section>
          <label style={labelStyle}>카테고리</label>

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
              {sortedCategories.map((item) => {
                const Icon = item.icon;
                const active = category === item.name;
                const favorite = favoriteCategories.includes(item.name);

                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setCategory(item.name)}
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
                    <Icon
                      size={15}
                      color={active ? activeColor : theme.colors.subtext}
                    />
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

              <button
                type="button"
                onClick={() => setShowAddCategory(true)}
                style={{
                  ...categoryChipStyle,
                  border: `1px dashed ${theme.colors.border}`,
                  background: "#FFFFFF",
                  color: activeColor,
                }}
              >
                <Plus size={15} />
                추가
              </button>
            </div>
          </div>
        </section>
      )}

        {showAddCategory && (
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
              {customIconList.map((item) => {
                const Icon = item.icon;
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

        <section>
          <label style={labelStyle}>사용자</label>
          <div style={userGridStyle}>
            {[myName, partnerName, "공동"].map((name) => (
              <UserButton
                key={name}
                label={name}
                active={owner === name}
                onClick={() => setOwner(name)}
              />
            ))}
          </div>
        </section>

{type === "STOCK" ? (
  <section style={{ display: "grid", gap: 12 }}>
    <label style={labelStyle}>주식 거래</label>

    <div style={userGridStyle}>
      <UserButton
        label="매수"
        active={stockTradeType === "BUY"}
        onClick={() => setStockTradeType("BUY")}
      />
      <UserButton
        label="매도"
        active={stockTradeType === "SELL"}
        onClick={() => setStockTradeType("SELL")}
      />
      <div />
    </div>

    <AccountSelect
      label="증권"
      value={stockAccountId}
      accounts={accounts.filter((account) => account.type === "STOCK")}
      onChange={setStockAccountId}
    />

<div style={accountSelectWrapStyle}>
  <span style={accountSelectLabelStyle}>종목</span>
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

      const selected = stockHoldings.find(
        (item) => String(item.id) === value
      );

      if (selected) {
        setStockName(selected.name);
        setStockCode(selected.code);
      }
    }}
    style={accountSelectStyle}
  >
    <option value="">보유종목 선택</option>

    {stockHoldings.map((item) => (
      <option key={item.id} value={item.id}>
        {item.name}({item.code})
      </option>
    ))}

    <option value="__NEW__">+ 신규 종목 추가</option>
  </select>
</div>

{stockMode === "NEW" && (
  <>
    <input
      value={stockName}
      onChange={(e) => setStockName(e.target.value)}
      placeholder="종목명 예: 삼성전자"
      style={categoryNameInputStyle}
    />

    <input
      value={stockCode}
      onChange={(e) => setStockCode(e.target.value)}
      placeholder="종목코드 예: 005930"
      style={categoryNameInputStyle}
    />
  </>
)}

    <input
      value={stockQuantity}
      onChange={(e) => setStockQuantity(e.target.value)}
      placeholder="수량"
      type="number"
      style={categoryNameInputStyle}
    />

    <input
      value={stockPrice}
      onChange={(e) => setStockPrice(e.target.value)}
      placeholder="단가"
      type="number"
      style={categoryNameInputStyle}
    />
  </section>
) : (
  <section>
    <label style={labelStyle}>
      {type === "INCOME"
        ? "입금 계좌"
        : type === "EXPENSE"
        ? "출금 계좌"
        : "이체 계좌"}
    </label>

    {type === "TRANSFER" ? (
      <div style={{ display: "grid", gap: 10 }}>
        <AccountSelect
          value={fromAccountId}
          accounts={accounts}
          onChange={setFromAccountId}
        />
        <AccountSelect
          value={toAccountId}
          accounts={accounts}
          onChange={setToAccountId}
        />
      </div>
    ) : (
      <AccountSelect
        label={type === "INCOME" ? "입금" : "출금"}
        value={fromAccountId}
        accounts={accounts}
        onChange={setFromAccountId}
      />
    )}
  </section>
)}

        <section>
          <label style={labelStyle}>메모 (선택)</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="메모를 입력하세요"
            style={memoStyle}
          />
        </section>

        <section style={extraBoxStyle}>
          <button
            type="button"
            onClick={() => setShowOptions((prev) => !prev)}
            style={extraHeaderButtonStyle}
          >
            <span>추가 옵션</span>
            <ChevronDown size={18} />
          </button>

          {showOptions && (
            <>
              <div style={extraRowStyle}>
                <div style={extraLabelStyle}>
                  <CalendarDays size={16} />
                  날짜
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={dateInputStyle}
                />
              </div>

              <div style={extraRowStyle}>
                <div style={extraLabelStyle}>
                  <Repeat size={16} />
                  반복
                </div>
                <select
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value)}
                  style={selectStyle}
                >
                  <option>반복 안함</option>
                  <option>매일</option>
                  <option>매주</option>
                  <option>매월</option>
                </select>
              </div>
            </>
          )}
        </section>

        <button
          onClick={saveTransaction}
          disabled={isSaving}
          style={{
            ...saveButtonStyle,
            background: `linear-gradient(135deg, ${theme.colors.primary} 0%, #A992FF 100%)`,
            opacity: isSaving ? 0.6 : 1,
          }}
        >
          {isSaving ? "저장 중..." : "저장"}
        </button>

      </>
    )}
    
        <BottomNav />
      </div>
    </main>
    
  );
}

const getAccountOwnerLabel = (account: Account) => {
  const myName = localStorage.getItem("alien_my_name") || "나";
  const partnerName = localStorage.getItem("alien_partner_name") || "파트너";

  if (account.owner?.role === "OWNER") return myName;
  if (account.owner?.role === "MEMBER") return partnerName;

  return "공동";
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
}: {
  label?: string;
  value: string;
  accounts: Account[];
  onChange: (value: string) => void;
}) {
  const myAccounts = accounts.filter((account) => account.owner?.role === "OWNER");
  const partnerAccounts = accounts.filter((account) => account.owner?.role === "MEMBER");
  const sharedAccounts = accounts.filter((account) => !account.owner?.role);
  const [favoriteAccountIds, setFavoriteAccountIds] = useState<string[]>(() => {
  if (typeof window === "undefined") return [];

  return JSON.parse(
    localStorage.getItem("alien_favorite_account_ids") || "[]"
  );
});

const toggleFavoriteAccount = (accountId: string) => {
  const next = favoriteAccountIds.includes(accountId)
    ? favoriteAccountIds.filter((id: string) => id !== accountId)
    : [...favoriteAccountIds, accountId];

  setFavoriteAccountIds(next);

  localStorage.setItem(
    "alien_favorite_account_ids",
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
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <AccountGroup
        title="내 계좌"
        accounts={sortAccountsByFavorite(myAccounts)}
        selectedId={value}
        favoriteAccountIds={favoriteAccountIds}
        onToggleFavorite={toggleFavoriteAccount}
        onSelect={onChange}
      />
      <AccountGroup
        title="파트너 계좌"
        accounts={sortAccountsByFavorite(partnerAccounts)}
        selectedId={value}
        favoriteAccountIds={favoriteAccountIds}
        onToggleFavorite={toggleFavoriteAccount}
        onSelect={onChange}
      />

      <AccountGroup
        title="공동 계좌"
        accounts={sortAccountsByFavorite(sharedAccounts)}
        selectedId={value}
        favoriteAccountIds={favoriteAccountIds}
        onToggleFavorite={toggleFavoriteAccount}
        onSelect={onChange}
      />
    </div>
  );
}

function AccountGroup({
  title,
  accounts,
  selectedId,
  favoriteAccountIds,
  onToggleFavorite,
  onSelect,
}: {
    title: string;
    accounts: Account[];
    selectedId: string;
    favoriteAccountIds: string[];
    onToggleFavorite: (accountId: string) => void;
    onSelect: (value: string) => void;
}) {
  if (accounts.length === 0) return null;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 900,
          color: theme.colors.subtext,
          paddingLeft: 2,
        }}
      >
        {title}
      </div>

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
                  ? `1.5px solid ${theme.colors.primary}`
                  : `1px solid ${theme.colors.border}`,
                background: selected ? theme.colors.primarySoft : "#FFFFFF",
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
    {account.type}
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
  padding: "16px 18px 96px",
  display: "flex",
  justifyContent: "center",
} as const;

const containerStyle = {
  width: "100%",
  maxWidth: 390,
  display: "flex",
  flexDirection: "column",
  gap: 16,
} as const;

const headerStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "36px 1fr 86px",
  alignItems: "center",
  gap: 8,
  marginBottom: 20,
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
  background: "#FFFFFF",
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