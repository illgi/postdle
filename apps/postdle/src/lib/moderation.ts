// 자동 필터(간이 모더레이션) — 발행 전 콘텐츠 검사. 순수 함수(네트워크 없음).
// HTML/엔티티를 먼저 순수 텍스트로 변환한 뒤 규칙을 순서대로 적용한다.

export interface CheckResult {
  ok: boolean;
  reason?: string;
}

// 최소 글자수(순수 텍스트 기준)
export const MIN_LENGTH = 500;

/** 욕설 목록 — 재사용을 위해 export. 정규화(공백 제거) 후 매칭한다. */
export const PROFANITY_LIST: string[] = [
  '씨발', '시발', '씨빨', '시빨', '씨발놈', '씨발년',
  '개새끼', '개새기', '개색기', '개세끼',
  '좆', '좆같', '좃', '존나', '좆나',
  '병신', '븅신', '빙신',
  '지랄', '지럴',
  '썅', '쌍놈', '쌍년',
  '니미', '니애미', '니미럴',
  '엠창', '앰창',
  '보지', '자지',
  '꺼져', '닥쳐',
  'fuck', 'fucking', 'shit', 'bitch', 'asshole',
];

/** HTML 태그·엔티티 제거 후 순수 텍스트로. */
export function toPlainText(input: string): string {
  return (input || '')
    .replace(/<[^>]*>/g, ' ') // HTML 태그 제거
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&[a-z#0-9]+;/gi, ' ') // 기타 엔티티 제거
    .replace(/\s+/g, ' ')
    .trim();
}

// 정규식들 (재사용을 위해 export)
export const PHONE_RE = /(01[016-9])[-\s]?\d{3,4}[-\s]?\d{4}/;
export const GENERIC_NUM_RE = /\d{2,3}[-\s]?\d{3,4}[-\s]?\d{4}/;
export const RRN_RE = /\d{6}[-\s]?[1-4]\d{6}/; // 주민등록번호
const JAMO_RE = /[ㄱ-ㅎㅏ-ㅣ]/g;

/** 개인정보(전화번호·주민번호 등) 포함 여부. */
export function hasPII(plain: string): boolean {
  return PHONE_RE.test(plain) || RRN_RE.test(plain) || GENERIC_NUM_RE.test(plain);
}

/** 욕설 포함 여부 — 공백/구분자 제거 후 매칭(자간 회피 대응). */
export function hasProfanity(plain: string): boolean {
  // 공백·일부 구분자 제거해 "시 발" 같은 회피를 잡는다.
  const normalized = plain.toLowerCase().replace(/[\s.,·・~!@#$%^&*_\-]/g, '');
  return PROFANITY_LIST.some((w) => normalized.includes(w.toLowerCase()));
}

/** 초성체(자음/모음만) 비율이 높거나 ㅋ/ㅎ/ㅇ 남발인지. */
export function isJamoSpam(plain: string): boolean {
  const noSpace = plain.replace(/\s+/g, '');
  if (noSpace.length === 0) return false;
  const jamo = (noSpace.match(JAMO_RE) || []).length;
  if (jamo / noSpace.length >= 0.6) return true;
  // 반복 ㅋ/ㅎ/ㅇ 가 전체를 지배
  const repeated = (noSpace.match(/[ㅋㅎㅇ]/g) || []).length;
  if (repeated / noSpace.length >= 0.6) return true;
  return false;
}

/** 반복 스팸 — 한 글자 20회 이상 연속, 또는 2~10자 부분열이 절반 이상 차지. */
export function isRepetitionSpam(plain: string): boolean {
  const noSpace = plain.replace(/\s+/g, '');
  if (noSpace.length === 0) return false;
  // 한 글자 20회 이상 연속
  if (/(.)\1{19,}/.test(noSpace)) return true;
  // 2~10자 부분열 반복이 전체의 50% 초과
  for (let len = 2; len <= 10; len++) {
    if (len * 2 > noSpace.length) break;
    for (let i = 0; i + len <= noSpace.length; i++) {
      const unit = noSpace.slice(i, i + len);
      // 정규식 특수문자 이스케이프
      const esc = unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matches = noSpace.match(new RegExp(esc, 'g')) || [];
      if (matches.length * len > noSpace.length * 0.5 && matches.length >= 3) return true;
    }
  }
  return false;
}

/**
 * 콘텐츠 검사. 첫 번째로 실패한 사유를 반환.
 * (개인정보/욕설은 항상, 길이/초성체/반복은 공개 글에만 — 호출측에서 선택 가능)
 */
export function checkContent(input: string, opts: { requireLength?: boolean } = {}): CheckResult {
  const requireLength = opts.requireLength !== false; // 기본 true
  const plain = toPlainText(input);

  if (requireLength) {
    if (plain.length < MIN_LENGTH) {
      return { ok: false, reason: '내용을 500자 이상 작성해주세요.' };
    }
  }

  // 개인정보 — 공개/비공개 모두 차단
  if (hasPII(plain)) {
    return { ok: false, reason: '전화번호·개인정보는 포함할 수 없어요.' };
  }

  if (requireLength) {
    if (isJamoSpam(plain)) {
      return { ok: false, reason: '의미 있는 문장으로 작성해주세요. (초성체 불가)' };
    }
    if (isRepetitionSpam(plain)) {
      return { ok: false, reason: '반복되는 내용은 발행할 수 없어요.' };
    }
  }

  // 욕설 — 공개/비공개 모두 차단
  if (hasProfanity(plain)) {
    return { ok: false, reason: '부적절한 표현이 포함돼 있어요.' };
  }

  return { ok: true };
}
