import { prisma } from "@/components/lib/prisma";

/**
 * 카드 결제 예정액 계산
 *
 * 규칙 (단순화 버전)
 * 1) 카드 사용액(카드에서 나간 지출·이체)을 결산일 기준 "결제 회차"별로 묶는다.
 * 2) 카드로 들어온 돈(이체·수입)은 날짜·카테고리와 상관없이 전부 합쳐서
 *    가장 오래된 회차부터 차감한다. (실제 카드사도 오래된 청구부터 갚아나감)
 * 3) 오늘(한국시간) 이후 첫 결제일 = "다음 결제", 그 다음 결제일 = "다다음 결제".
 *    다음 결제 이전 회차에 남은 금액은 미납(overdue)으로 다음 결제에 합산한다.
 *
 * 회차 규칙
 * - 결산일 < 결제일 (예: 11일 결산, 22일 결제) → 같은 달 결산분을 그 달 결제
 * - 결산일 ≥ 결제일 (예: 말일 결산, 14일 결제) → 전월 결산분을 그 달 결제
 * - 결산일 미설정 → 말일 결산으로 간주, 결제일 미설정 → 1일로 간주
 *
 * 서버가 어느 시간대에서 돌든 한국시간(KST) 기준으로 날짜를 자른다.
 */

const KST_OFFSET = 9 * 60 * 60 * 1000;

type CardTx = {
  type: string;
  amount: number;
  fromAccountId: number | null;
  toAccountId: number | null;
  transactionAt: Date;
};

export type CardBill = {
  dueDate: string; // 다음 결제일 YYYY-MM-DD
  dueAmount: number; // 다음 결제 회차에 남은 금액 (미납 제외)
  overdueAmount: number; // 지난 결제일까지 다 안 갚은 금액
  nextDueDate: string; // 다다음 결제일
  nextAmount: number; // 다다음 회차(진행 중) 남은 금액
  credit: number; // 사용액보다 더 넣은 돈 (선결제 잔액)
  outstanding: number; // 갚아야 할 총액 (모든 회차 남은 금액 합)
};

const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

const norm = (y: number, m: number) => ({
  y: y + Math.floor(m / 12),
  m: ((m % 12) + 12) % 12,
});

/** 한국시간 y-m-d hh:mm:ss.ms 를 실제 시각(Date)으로 */
const kst = (y: number, m: number, d: number, hh = 0, mm = 0, ss = 0, ms = 0) =>
  new Date(Date.UTC(y, m, d, hh, mm, ss, ms) - KST_OFFSET);

/** 실제 시각 → 한국시간 기준 연/월/일 */
const toKst = (date: Date) => {
  const k = new Date(date.getTime() + KST_OFFSET);
  return { y: k.getUTCFullYear(), m: k.getUTCMonth(), d: k.getUTCDate() };
};

const ymd = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

type Cycle = {
  payKey: number; // yyyymmdd 숫자 (비교용)
  payDate: string;
  end: Date; // 결산 마감 시각 (포함)
  used: number;
  remaining: number;
};

/** 결제월(y, m)에 해당하는 회차의 결제일·결산 마감 시각 */
function cycleOf(y: number, m: number, closeDay: number, payDay: number) {
  const pay = norm(y, m);
  const pd = Math.min(payDay, lastDay(pay.y, pay.m));
  const close = norm(pay.y, closeDay < payDay ? pay.m : pay.m - 1);
  const cd = Math.min(closeDay, lastDay(close.y, close.m));
  return {
    payY: pay.y,
    payM: pay.m,
    payKey: pay.y * 10000 + (pay.m + 1) * 100 + pd,
    payDate: ymd(pay.y, pay.m, pd),
    end: kst(close.y, close.m, cd, 23, 59, 59, 999),
  };
}

export function computeCardBill(
  account: { id: number; cardCycleEndDay?: number | null; cardPaymentDay?: number | null },
  txs: CardTx[],
  now: Date = new Date()
): CardBill {
  const closeDay = account.cardCycleEndDay || 31;
  const payDay = account.cardPaymentDay || 1;

  const usages = txs.filter(
    (t) => t.fromAccountId === account.id && (t.type === "EXPENSE" || t.type === "TRANSFER")
  );
  const credits = txs.filter(
    (t) => t.toAccountId === account.id && (t.type === "INCOME" || t.type === "TRANSFER")
  );

  const today = toKst(now);
  const todayKey = today.y * 10000 + (today.m + 1) * 100 + today.d;

  // 회차 생성 시작점: 가장 오래된 사용일(없으면 오늘)의 전월 결제분부터
  const firstUse = usages.length
    ? new Date(Math.min(...usages.map((u) => new Date(u.transactionAt).getTime())))
    : now;
  const lastUse = usages.length
    ? new Date(Math.max(...usages.map((u) => new Date(u.transactionAt).getTime())))
    : now;
  const start = toKst(firstUse);

  const cycles: Cycle[] = [];
  let y = start.y;
  let m = start.m - 1;
  let dueIndex = -1;
  // 다음 결제 회차 + 그 다음 회차까지, 그리고 미래 날짜 사용분까지 덮을 때까지 생성
  for (let guard = 0; guard < 600; guard++) {
    const c = cycleOf(y, m, closeDay, payDay);
    m += 1;
    if (c.end.getTime() < firstUse.getTime()) continue;
    cycles.push({ payKey: c.payKey, payDate: c.payDate, end: c.end, used: 0, remaining: 0 });
    if (dueIndex < 0 && c.payKey >= todayKey) dueIndex = cycles.length - 1;
    if (dueIndex >= 0 && cycles.length >= dueIndex + 2 && c.end.getTime() >= lastUse.getTime()) break;
  }

  // 사용액을 회차에 배정 (각 회차 = 이전 회차 마감 직후 ~ 이번 마감)
  for (const u of usages) {
    const t = new Date(u.transactionAt).getTime();
    const c = cycles.find((cy) => t <= cy.end.getTime());
    if (c) c.used += Number(u.amount || 0);
  }

  // 입금액을 오래된 회차부터 차감 (FIFO)
  let pool = credits.reduce((s, c) => s + Number(c.amount || 0), 0);
  for (const c of cycles) {
    const paid = Math.min(pool, c.used);
    c.remaining = c.used - paid;
    pool -= paid;
  }

  const due = cycles[dueIndex];
  const next = cycles[dueIndex + 1];
  const overdueAmount = cycles.slice(0, dueIndex).reduce((s, c) => s + c.remaining, 0);

  return {
    dueDate: due.payDate,
    dueAmount: due.remaining,
    overdueAmount,
    nextDueDate: next.payDate,
    nextAmount: next.remaining,
    credit: pool,
    outstanding: cycles.reduce((s, c) => s + c.remaining, 0),
  };
}

/** 여러 카드 계좌의 결제 예정액을 한 번의 조회로 계산 */
export async function getCardBills(
  familyId: number,
  cards: { id: number; cardCycleEndDay?: number | null; cardPaymentDay?: number | null }[]
): Promise<Map<number, CardBill>> {
  const result = new Map<number, CardBill>();
  if (!cards.length) return result;
  const ids = cards.map((c) => c.id);

  const txs = await prisma.transaction.findMany({
    where: {
      familyId,
      OR: [{ fromAccountId: { in: ids } }, { toAccountId: { in: ids } }],
    },
    select: { type: true, amount: true, fromAccountId: true, toAccountId: true, transactionAt: true },
  });

  const now = new Date();
  for (const card of cards) {
    const own = txs.filter((t) => t.fromAccountId === card.id || t.toAccountId === card.id);
    result.set(card.id, computeCardBill(card, own, now));
  }
  return result;
}
