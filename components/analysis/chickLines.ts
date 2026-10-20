import { getBaseMonthByStartDay, getCustomMonthRange } from "@/components/lib/monthRange";

/**
 * 자산아리 대사 모음 (외계인 버전 👽)
 *
 * - 캐릭터 설정: 지구에 착륙한 외계인 '아리'. 커플(지구인 둘)의 자산을 우주선 연료 삼아 자라고,
 *   레벨이 오를수록 장비를 갖추며 은하 대왕으로 진화함. 놀라거나 신호를 받으면 "삐빅!"
 * - 상황(조건)마다 대사를 여러 개 준비해 두고, 해당되는 상황 중 하나 + 그 안의 대사 하나를 무작위로 고름
 * - kind: status(소비 상태 리액션) · advice(조언) · idle(인사·잡담)
 *   → 화면에서는 status/advice를 idle보다 3배 자주 고름
 * - mood: 표정 이미지 (angry 화남 · happy 웃음 · sad 울음 · neutral 무표정 · surprised 놀람)
 * - 말풍선 한 줄 = 최대 34자(띄어쓰기 포함). 금액이 들어가 34자를 넘는 대사는 자동으로 빠지고
 *   같은 상황의 다른 대사가 나옴. 새 대사를 넣을 때도 34자 안으로!
 */

export const MAX_LINE_CHARS = 34;

export type Mood = "angry" | "happy" | "sad" | "neutral" | "surprised";
export type LineKind = "status" | "advice" | "idle";
export type ChickLine = { texts: string[]; mood: Mood; kind: LineKind };

export type ChickTx = {
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  transactionAt: string;
  category?: string | null;
  memo?: string | null;
};

const ADJUST_CATEGORIES = ["자산수정", "자산 수정"]; // 잔고 맞춤 기록은 소비로 안 봄

const won = (v: number) => {
  const n = Math.round(Math.abs(v));
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만`;
  return n.toLocaleString();
};

// 받침 여부에 따라 조사 고르기: josa("식비", "은", "는") → "식비는"
const hasBatchim = (word: string) => {
  const ch = word.trim().slice(-1);
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  if (/[0-9]/.test(ch)) return "013678".includes(ch); // 영 일 삼 육 칠 팔
  return false;
};
const josa = (word: string, withBatchim: string, without: string) => `${word}${hasBatchim(word) ? withBatchim : without}`;

// 메모로 알아보는 소비 패턴
const DELIVERY = /쿠팡이츠|배달의민족|배민|우아한형제들|요기요|땡겨요/;
const CONVENIENCE = /GS25|지에스25|지에스 |씨유|(^|[^A-Za-z])CU([^A-Za-z]|$)|세븐일레븐|이마트24|미니스톱/;
const CAFE = /커피|카페|스타벅스|메가엠지씨|메가커피|컴포즈|빽다방|이디야|투썸|폴바셋|할리스|바나프레소/;
const TAXI = /택시|카카오T|카카오모빌리티|우티|UT /;
const SALARY = /월급|급여|salary/i;

export function buildChickLines(params: {
  transactions: ChickTx[];
  budgets: Record<string, number>;
  monthStartDay: number;
  level: number;
  maxLevel: number;
  levelProgress: number;
  toNextLevel: number; // 다음 레벨까지 남은 금액
}): ChickLine[] {
  const { transactions, budgets, monthStartDay, level, maxLevel, levelProgress, toNextLevel } = params;
  const now = new Date();
  const cur = getCustomMonthRange(getBaseMonthByStartDay(now, monthStartDay), monthStartDay);
  const prev = getCustomMonthRange(getBaseMonthByStartDay(new Date(cur.start.getTime() - 1), monthStartDay), monthStartDay);
  const prev2 = getCustomMonthRange(getBaseMonthByStartDay(new Date(prev.start.getTime() - 1), monthStartDay), monthStartDay);

  // 지난달은 "이번 달과 같은 날짜까지"만 비교
  const elapsedMs = now.getTime() - cur.start.getTime();
  const prevSamePoint = new Date(Math.min(prev.start.getTime() + elapsedMs, prev.end.getTime()));
  const totalMs = cur.end.getTime() - cur.start.getTime();
  const elapsedRatio = Math.min(Math.max(elapsedMs / totalMs, 0.03), 1);
  const dayMs = 24 * 60 * 60 * 1000;
  const dayOfPeriod = Math.floor(elapsedMs / dayMs) + 1;
  const daysLeft = Math.max(Math.ceil((cur.end.getTime() - now.getTime()) / dayMs), 1);

  const isExpense = (t: ChickTx) => t.type === "EXPENSE" && !ADJUST_CATEGORIES.includes(t.category || "");
  const isIncome = (t: ChickTx) => t.type === "INCOME" && !ADJUST_CATEGORIES.includes(t.category || "");
  const inRange = (t: ChickTx, from: Date, to: Date) => {
    const d = new Date(t.transactionAt);
    return d >= from && d <= to;
  };
  const pick = (from: Date, to: Date, pred: (t: ChickTx) => boolean) => transactions.filter((t) => inRange(t, from, to) && pred(t));
  const total = (list: ChickTx[]) => list.reduce((s, t) => s + Number(t.amount || 0), 0);
  const sum = (from: Date, to: Date, pred: (t: ChickTx) => boolean) => total(pick(from, to, pred));
  const cat = (name: string) => (t: ChickTx) => isExpense(t) && (t.category || "") === name;
  const memoHas = (re: RegExp) => (t: ChickTx) => isExpense(t) && re.test(`${t.memo || ""} ${t.category || ""}`);

  const lines: ChickLine[] = [];
  const say = (kind: LineKind, mood: Mood, texts: string[]) => lines.push({ kind, mood, texts });

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const hour = now.getHours();
  const weekday = now.getDay(); // 0 일 ~ 6 토

  /* ───── 오늘 ───── */
  const todayExp = sum(todayStart, now, isExpense);
  const todayFood = sum(todayStart, now, cat("식비"));
  if (hour >= 14 && todayFood === 0) {
    say("status", "happy", [
      "오늘 식비 0원! 지구 음식 없이도 버텼어.",
      "식비를 아껴서 더듬이가 쭉 펴졌어.",
      "배고픔을 참은 만큼 우주선 연료가 찼어.",
    ]);
  }
  if (hour >= 18 && todayExp === 0) {
    say("status", "happy", [
      "오늘은 무지출 데이! 이대로 착륙하자.",
      "오늘 지구 돈을 한 푼도 안 썼어. 삐빅!",
      "무지출 성공 직전이야. 야식만 참으면 돼!",
    ]);
  }
  if (todayExp >= 100_000) {
    say("status", "sad", [
      `오늘 벌써 ${won(todayExp)}원… 더듬이가 축 처졌어.`,
      `오늘 지출 ${won(todayExp)}원! 내일은 쉬어가자.`,
      "오늘은 지구 돈이 너무 빨리 사라졌어…",
    ]);
    say("status", "surprised", [
      `삐빅! 오늘 벌써 ${won(todayExp)}원이야?!`,
      "경보! 오늘 지출이 왜 이렇게 커?!",
    ]);
  }

  /* ───── 식비 ───── */
  const foodNow = sum(cur.start, now, cat("식비"));
  const foodPrev = sum(prev.start, prevSamePoint, cat("식비"));
  if (foodPrev > 0 && foodNow < foodPrev * 0.85) {
    say("status", "happy", [
      "지난달보다 식비를 아꼈어. 연료 절약 성공!",
      `식비가 지난달보다 ${won(foodPrev - foodNow)}원 적어! 가벼워!`,
      "지구 집밥 파워 덕분에 몸이 가벼워졌어.",
    ]);
  }
  if (foodPrev > 0 && foodNow > foodPrev * 1.2) {
    say("status", "neutral", [
      "지구 음식이 너무 맛있어서 배가 빵빵해.",
      `식비가 지난달보다 ${won(foodNow - foodPrev)}원 많아. 살찌나…?`,
      "맛있는 건 좋은데 우주선이 무거워지고 있어.",
    ]);
  }

  /* ───── 공과금 ───── */
  const billNow = sum(cur.start, now, cat("공과금"));
  const billPrev = sum(prev.start, prevSamePoint, cat("공과금"));
  if (billPrev > 0 && billNow > billPrev * 1.1) {
    say("status", "sad", [
      "저번달보다 공과금을 많이 내서 피곤해.",
      `공과금이 ${won(billNow - billPrev)}원 더 나왔어. 더듬이 아파…`,
      "고정비가 늘어서 어깨가 무거워.",
    ]);
  }
  if (billPrev > 0 && billNow > billPrev * 1.5) {
    say("status", "surprised", [
      "공과금이 이렇게 나왔다고?! 계산 오류 아냐?",
      `공과금이 지난달의 ${(billNow / billPrev).toFixed(1)}배야! 삐빅!`,
    ]);
  }
  if (billPrev > 0 && billNow < billPrev * 0.9) {
    say("status", "happy", [
      "공과금이 지난달보다 덜 나와서 에너지가 남아.",
      "고정비가 줄었어! 이런 게 진짜 체력이지.",
    ]);
  }

  /* ───── 예산 ───── */
  const budgetEntries = Object.entries(budgets || {}).filter(([, v]) => Number(v) > 0);
  if (budgetEntries.length > 0) {
    const spentOf = (name: string) => sum(cur.start, now, cat(name));
    const over = budgetEntries
      .map(([name, b]) => ({ name, budget: Number(b), spent: spentOf(name) }))
      .filter((x) => x.spent > x.budget)
      .sort((a, b) => b.spent - b.budget - (a.spent - a.budget));
    const totalBudget = budgetEntries.reduce((s, [, b]) => s + Number(b), 0);
    const totalSpent = budgetEntries.reduce((s, [name]) => s + spentOf(name), 0);
    const remaining = totalBudget - totalSpent;

    if (over.length > 0) {
      const o = over[0];
      say("status", "angry", [
        `${o.name} 예산 초과! 경고등이 켜졌어.`,
        `${o.name}에서 예산보다 ${won(o.spent - o.budget)}원 더 썼어! 삐빅!`,
        `${o.name} 예산 초과! 더듬이가 곤두섰어.`,
      ]);
      say("status", "sad", [
        `${o.name} 예산을 넘겨서 눈물이 찔끔 나…`,
        `${o.name} 예산 초과… 연료가 새고 있어 ㅠㅠ`,
        `${o.name}에서 ${won(o.spent - o.budget)}원이나 넘었어. 울어도 돼?`,
      ]);
      say("advice", "angry", [
        `${josa(o.name, "은", "는")} 남은 기간 쉬어가자. 내가 감시할게!`,
        `${o.name}, 남은 기간엔 꼭 필요한 것만!`,
      ]);
    } else if (totalSpent <= totalBudget * elapsedRatio) {
      say("status", "happy", [
        "예산 안에서 쓰고 있어. 지구인들 똑똑해!",
        "예산을 잘 지키고 있어! 항로 정상이야.",
        "계획대로 비행 중이라 머리가 맑아.",
      ]);
    } else {
      say("status", "neutral", [
        "예산은 아직 괜찮은데 비행 속도가 좀 빨라.",
        "이대로면 월말에 연료가 빠듯할지도 몰라.",
      ]);
    }
    if (remaining > 0 && daysLeft >= 2) {
      const perDay = remaining / daysLeft;
      say("advice", "neutral", [
        `남은 ${daysLeft}일, 하루 ${won(perDay)}원씩 쓰면 딱 맞아!`,
        `예산 ${won(remaining)}원 남았어. 하루 ${won(perDay)}원 안에서!`,
      ]);
      if (perDay < 10_000) {
        say("advice", "sad", [
          `남은 예산이 하루 ${won(perDay)}원뿐이야… ㅠㅠ`,
          `${daysLeft}일 동안 ${won(remaining)}원으로 버텨야 해…`,
        ]);
      }
    }
    if (remaining < 0) {
      say("advice", "sad", [
        `예산을 ${won(-remaining)}원 넘었어. 지갑 꼭 닫아줘…`,
        "예산을 넘었어. 다음달 항로를 다시 짜보자.",
      ]);
    }
  }

  /* ───── 전체 지출 흐름 ───── */
  const incNow = sum(cur.start, now, isIncome);
  const expNow = sum(cur.start, now, isExpense);
  const expPrev = sum(prev.start, prevSamePoint, isExpense);
  if (incNow > expNow && incNow > 0) {
    say("status", "happy", [
      "쓴 것보다 번 게 많아서 몸집이 커졌어.",
      `이번달 지금까지 ${won(incNow - expNow)}원 흑자야! 쑥쑥!`,
      "들어온 돈이 더 많아. 연료 가득 충전 중!",
    ]);
  }
  if (incNow > 0 && expNow > incNow) {
    say("status", "sad", [
      "번 것보다 쓴 게 많아… 나 작아지는 중.",
      `들어온 돈보다 ${won(expNow - incNow)}원 더 나갔어. 훌쩍…`,
      "연료 탱크가 비어가고 있어. 이건 싫어 ㅠㅠ",
    ]);
  }
  if (expPrev > 0 && expNow > expPrev * 1.15) {
    say("status", "sad", [
      "지난달보다 지출 속도가 빨라서 숨이 차.",
      `지난달 이맘때보다 ${won(expNow - expPrev)}원 더 썼어. 헥헥`,
      "이번달은 너무 빨리 날고 있어. 감속하자.",
    ]);
  }
  if (expPrev > 0 && expNow < expPrev * 0.85) {
    say("status", "happy", [
      "지난달보다 덜 써서 마음이 든든해.",
      `지난달 이맘때보다 ${won(expPrev - expNow)}원 덜 썼어. 최고!`,
      "속도 조절 완벽해. 나 근육 생겼어.",
    ]);
  }

  /* ───── 가장 많이 쓴 카테고리 ───── */
  const catTotals = pick(cur.start, now, isExpense).reduce<Record<string, number>>((acc, t) => {
    const k = t.category || "기타";
    acc[k] = (acc[k] || 0) + Number(t.amount || 0);
    return acc;
  }, {});
  const top = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
  if (top && expNow > 0 && top[1] / expNow >= 0.3) {
    const pct = Math.round((top[1] / expNow) * 100);
    say("advice", "neutral", [
      `이번달 지출의 ${pct}%가 ${josa(top[0], "이야", "야")}. 여기부터 줄이자!`,
      `${top[0]}에 ${won(top[1])}원 썼어. 레이더상 절약 포인트!`,
      `${top[0]}에 ${won(top[1])}원 썼어. 여기가 절약 포인트!`,
    ]);
  }

  /* ───── 소비 패턴 (메모 기준) ───── */
  const delivery = pick(cur.start, now, memoHas(DELIVERY));
  if (delivery.length >= 5) {
    const avg = total(delivery) / delivery.length;
    say("advice", "neutral", [
      `배달 ${delivery.length}번! 한 번만 집밥 해도 ${won(avg)}원 아껴.`,
      "배달비까지 치면 은근 비싸. 한 번 줄여볼까?",
      `배달 앱에 ${won(total(delivery))}원 썼어. 지구 오토바이 무서워.`,
    ]);
  }
  if (delivery.length >= 8) {
    say("status", "sad", [
      `배달을 ${delivery.length}번이나… 알림만 봐도 눈물 나.`,
      "배달비가 쌓여서 내 연료가 줄었어 ㅠㅠ",
    ]);
  }
  const conv = pick(cur.start, now, memoHas(CONVENIENCE));
  if (conv.length >= 8) {
    say("advice", "neutral", [
      `편의점 ${conv.length}번에 ${won(total(conv))}원 나갔어!`,
      "편의점은 티끌 모아 태산! 장 볼 때 미리 사자.",
    ]);
  }
  const cafe = pick(cur.start, now, memoHas(CAFE));
  if (cafe.length >= 6) {
    say("advice", "neutral", [
      `카페에 ${won(total(cafe))}원 썼어. 텀블러 할인도 있어!`,
      `카페 ${cafe.length}번 갔어. 주 1회는 홈카페 어때?`,
    ]);
  }
  const taxi = pick(cur.start, now, memoHas(TAXI));
  if (taxi.length >= 3) {
    say("advice", "neutral", [
      `택시 ${taxi.length}번 탔어. 텔레포트는 아직 안 돼!`,
      `택시 ${taxi.length}번 탔어. 조금 일찍 나서면 아껴!`,
    ]);
  }

  /* ───── 주말 지출 비중 ───── */
  const curExp = pick(cur.start, now, isExpense);
  const weekendExp = total(curExp.filter((t) => [0, 6].includes(new Date(t.transactionAt).getDay())));
  if (expNow > 0 && dayOfPeriod >= 10 && weekendExp / expNow >= 0.5) {
    say("advice", "neutral", [
      `지출의 ${Math.round((weekendExp / expNow) * 100)}%가 주말이야. 주말 계획을 미리!`,
      "주말에 지갑이 제일 바빠. 이번엔 산책 어때?",
    ]);
  }

  /* ───── 이번주 큰 지출 ───── */
  const weekAgo = new Date(now.getTime() - 7 * dayMs);
  const big = pick(weekAgo, now, isExpense).sort((a, b) => b.amount - a.amount)[0];
  if (big && big.amount >= 300_000) {
    const label = (big.memo || big.category || "큰 지출").slice(0, 8);
    say("advice", "neutral", [
      `이번주 '${label}' ${won(big.amount)}원, 다음달 예산에 넣자.`,
      "큰 지출이 있던 주야. 남은 날은 가볍게!",
    ]);
    say("status", "surprised", [
      `삐빅! '${label}' ${won(big.amount)}원이 레이더에 떴어!`,
      `헉! '${label}' ${won(big.amount)}원?! 깜짝이야.`,
      "이번주에 큰 게 나갔네?! 눈이 번쩍했어.",
    ]);
    say("status", "sad", [
      `'${label}' ${won(big.amount)}원… 우주선이 흔들려.`,
      "이번주 큰 지출 때문에 조금 휘청거려…",
    ]);
  }

  /* ───── 월급 ───── */
  const recentSalary = pick(new Date(now.getTime() - 3 * dayMs), now, (t) => isIncome(t) && SALARY.test(`${t.category || ""} ${t.memo || ""}`));
  if (recentSalary.length > 0) {
    say("advice", "happy", [
      "월급 들어왔다! 저축부터 먼저 떼어두자.",
      "월급날! 고정비·저축 먼저 빼고 쓰자.",
      "월급이 들어오니까 더듬이가 반짝반짝해!",
    ]);
  }

  if (recentSalary.length > 0) {
    say("status", "surprised", ["삐빅! 월급 신호 수신! 깜짝이야!", "어? 통장이 갑자기 두둑해졌어!"]);
  }
  const bigIncome = pick(new Date(now.getTime() - 3 * dayMs), now, (t) => isIncome(t) && !SALARY.test(`${t.category || ""} ${t.memo || ""}`) && t.amount >= 1_000_000)[0];
  if (bigIncome) {
    say("status", "surprised", [
      `${won(bigIncome.amount)}원이 들어왔어! 눈이 번쩍!`,
      "통장에 큰돈이 착륙했어! 이거 진짜야?!",
    ]);
  }

  /* ───── 레벨 ───── */
  if (level < maxLevel && levelProgress >= 0.9) {
    say("status", "happy", [
      "다음 레벨까지 거의 다 왔어! 조금만 더!",
      `LV.${level + 1}까지 ${won(toNextLevel)}원! 진화 직전이야.`,
      "더듬이가 근질근질해… 곧 진화할 것 같아!",
    ]);
  }
  const heroNo = Math.ceil(level / 10); // 1~6번째 영웅
  const isNewHero = level > 1 && level % 10 === 1; // LV.11, 21, 31, 41, 51
  if (level > 1 && levelProgress < 0.08 && !isNewHero) {
    say("status", "happy", [`LV.${level} 달성! 새 장비 어때?`, "레벨업했어! 우리 정말 잘하고 있어."]);
    say("status", "surprised", ["어? 나 모습이 바뀌었어?!", `우와, 벌써 LV.${level}?! 믿기지 않아!`]);
  }
  if (isNewHero) {
    say("status", "surprised", [`삐빅! ${heroNo}번째 영웅이 착륙했어!`, "새 영웅 도착! 선배 영웅은 마을에서 쉬어."]);
    say("status", "happy", ["안녕, 지구인! 이번엔 내가 자랄 차례야.", `${heroNo}번째 영웅이야. 처음부터 잘 부탁해!`]);
  }
  if (level < maxLevel && level % 10 === 0) {
    say("status", "happy", ["이번 영웅 수련이 거의 끝났어! 마무리하자.", "곧 다음 영웅이 착륙할 거야. 두근두근!"]);
  }
  if (level >= maxLevel) {
    say("status", "happy", ["목표 달성! 영웅 여섯 모두 완성이야!", "5억 달성! 지구인 둘 덕분이야. 고마워!"]);
  }
  // 영웅 직업별 잡담 (기사 → 팔라딘 → 검사 → 법사 → 궁수 → 힐러)
  const classLines: Record<number, string[]> = {
    1: ["기사가 되려면 저축 수련부터 해야 해!", "지갑을 지키는 것도 기사의 임무야."],
    2: ["이 방패로 충동구매를 막아줄게!", "팔라딘의 맹세: 예산은 꼭 지킨다!"],
    3: ["불필요한 지출은 내 검으로 싹둑!", "검술도 저축도 매일 조금씩이 비결이야."],
    4: ["마법 주문! 지출아 줄어라, 얍!", "통장이 불어나는 마법을 공부 중이야."],
    5: ["목표 금액에 정조준! 한 발씩 가자.", "멀리 보는 궁수처럼 길게 모으자!"],
    6: ["지친 통장도 내가 회복시켜 줄게!", "힐링 주문: 오늘은 무지출로 쉬어가자."],
  };
  if (classLines[heroNo]) say("idle", "neutral", classLines[heroNo]);
  // 최근 두 달 평균 순저축으로 다음 레벨 예상
  const net = (r: { start: Date; end: Date }) => sum(r.start, r.end, isIncome) - sum(r.start, r.end, isExpense);
  const avgNet = (net(prev) + net(prev2)) / 2;
  if (level < maxLevel && avgNet > 0 && toNextLevel > 0) {
    const months = Math.ceil(toNextLevel / avgNet);
    if (months <= 24) {
      say("advice", "neutral", [
        `요즘처럼 모으면 ${months}개월 뒤 ${josa(`LV.${level + 1}`, "이", "가")} 돼!`,
        `한 달에 ${won(avgNet)}원씩 모여. ${months}개월이면 레벨업!`,
      ]);
    }
  }

  /* ───── 기록 공백 ───── */
  const lastRecord = transactions.reduce((m, t) => Math.max(m, new Date(t.transactionAt).getTime()), 0);
  if (lastRecord > 0 && now.getTime() - lastRecord > 2 * dayMs) {
    say("status", "sad", [
      "가계부를 이틀 넘게 안 썼어… 나 잊었어?",
      "지구인 신호가 끊겼어. 심심하고 배고파 ㅠㅠ",
      "삐빅… 교신 기다리다 눈물 날 뻔했어.",
    ]);
  }

  /* ───── 달 흐름 ───── */
  if (dayOfPeriod <= 3) {
    say("idle", "happy", ["새 달 시작! 이번달 예산 같이 볼래?", "새 항해 시작! 이번달 목표는 뭐로 할까?"]);
  }
  if (daysLeft <= 3) {
    say("idle", "neutral", ["이번달도 거의 끝났어. 착륙 준비하자!", "월말이야. 이번달 탐사 보고서가 곧 나와!"]);
  }

  /* ───── 인사·잡담 ───── */
  if (hour >= 6 && hour < 11) {
    say("idle", "happy", ["좋은 아침, 지구인! 오늘도 알뜰하게!", "지구의 아침이다! 오늘 하루도 차곡차곡."]);
  } else if (hour >= 11 && hour < 14) {
    say("idle", "neutral", ["점심 뭐 먹어? 도시락이면 박수 쳐줄게.", "점심시간! 맛있게, 하지만 알뜰하게!"]);
  } else if (hour >= 22 || hour < 4) {
    say("idle", "neutral", ["늦은 밤 야식은 지갑의 적이야… 참자!", "이 시간 장바구니는 내일 다시 보자."]);
  }
  if (weekday === 5) say("idle", "happy", ["불금이다! 지구인들 신나 보여. 그래도 적당히!"]);
  if (weekday === 1) say("idle", "neutral", ["월요일이야. 이번주도 같이 힘내자!"]);
  if (weekday === 0 || weekday === 6) say("idle", "happy", ["주말이다! 돈 안 드는 지구 데이트도 많아."]);

  say("idle", "neutral", [
    "오늘도 차곡차곡 자라는 중이야.",
    `${level}레벨 외계인, 오늘도 모으는 중!`,
    "가계부 써줘서 고마워. 나 튼튼해져!",
    "삐빅! 오늘 지출 기록은 다 했어?",
    "지구 돈은 신기해. 모을수록 내가 커져!",
    "둘이 같이 모으니까 훨씬 빨리 커!",
    "우리 마을에 집이 하나씩 늘어나는 중!",
    "모선에 보고 중: 지구인 둘, 저축 우수.",
  ]);

  // 34자 넘는 대사는 빼고, 한 상황의 대사가 전부 넘치면 가장 짧은 것만 남김
  return lines.map((l) => {
    const fit = l.texts.filter((t) => t.length <= MAX_LINE_CHARS);
    return { ...l, texts: fit.length > 0 ? fit : [l.texts.reduce((a, b) => (a.length <= b.length ? a : b))] };
  });
}
