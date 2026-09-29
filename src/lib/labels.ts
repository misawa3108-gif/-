import type { Purpose, VisitStatus } from "@/lib/types";

export const PURPOSE_LABEL: Record<Purpose, string> = {
  meeting: "打ち合わせ",
  interview: "面接",
  sales: "ご提案・挨拶",
  delivery: "お荷物・配達",
  other: "その他",
};

export const WALK_IN_PURPOSES: Purpose[] = [
  "meeting",
  "interview",
  "sales",
  "other",
];

export const VISITOR_PURPOSES: Purpose[] = ["meeting", "sales", "other"];

export const CARRIERS = [
  "ヤマト運輸",
  "佐川急便",
  "日本郵便",
  "Amazon",
  "その他",
] as const;

export const STATUS_LABEL: Record<VisitStatus, string> = {
  expected: "来訪予定",
  waiting: "ロビー待ち",
  meeting: "ご案内中",
  left: "退館",
  cancelled: "取り消し",
};
