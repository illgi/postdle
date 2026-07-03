import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from '@emotion/styled';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { layout } from './_shims/mixin';
import { langStore } from './_shims/common';
import { t, SupportedLang } from './_shims/i18n';
import { useAtomValue } from 'jotai';

interface WritingToolsProps {
  content: string;
  onContentUpdate?: (content: string) => void;
}

interface SpellCheckError {
  id: string;
  text: string;
  suggestion: string;
  rule: string;
  message?: string;
  startIndex: number;
  endIndex: number;
  type: 'error' | 'warning';
}

interface CompletenessMetrics {
  hasMinContent: boolean;
  hasHeading: boolean;
  hasParagraphs: boolean;
  hasImages: boolean;
  hasLinks: boolean;
  hasConclusion: boolean;
  spellCheckPassed: boolean;
  contentLength: number;
}

// ============ Styled Components ============

const ToolbarContainer = styled(Box)`
  border-top: 1px solid var(--gray-200);
  background-color: var(--gray-50);
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
`;

const ToolbarHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--gray-100);
  }
`;

const ToolbarTitle = styled(Typography)`
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0;
`;

const ToolbarContent = styled(Box)`
  padding: 16px;
  border-top: 1px solid var(--gray-200);
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FeatureSection = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SectionTitle = styled(Typography)`
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-700);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
`;

const CounterGrid = styled(Box)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const CounterItem = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background-color: white;
  border: 1px solid var(--gray-200);
  border-radius: 6px;
`;

const CounterLabel = styled(Typography)`
  font-size: 11px;
  color: var(--gray-600);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin: 0;
`;

const CounterValue = styled(Typography)`
  font-size: 16px;
  font-weight: 700;
  color: var(--primary-blue);
  margin: 0;
`;

const ReadingTimeBox = styled(Box)`
  padding: 8px;
  background-color: white;
  border: 1px solid var(--gray-200);
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ReadingTimeLabel = styled(Typography)`
  font-size: 12px;
  color: var(--gray-600);
  font-weight: 500;
  margin: 0;
`;

const ReadingTimeValue = styled(Typography)`
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-blue);
  margin: 0;
`;

const SpellCheckContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SpellCheckSummary = styled(Box)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: white;
  border: 1px solid var(--gray-200);
  border-radius: 6px;
`;

const ErrorList = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--gray-100);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--gray-300);
    border-radius: 3px;

    &:hover {
      background: var(--gray-400);
    }
  }
`;

const ErrorItem = styled(Box)<{ type: 'error' | 'warning' }>`
  padding: 10px;
  background-color: ${(props) =>
    props.type === 'error' ? 'rgba(220, 38, 38, 0.04)' : 'rgba(217, 119, 6, 0.04)'};
  border-left: 3px solid
    ${(props) => (props.type === 'error' ? '#dc2626' : '#d97706')};
  border-radius: 4px;
  font-size: 12px;
`;

const ErrorRule = styled(Typography)`
  font-size: 11px;
  color: var(--gray-700);
  margin: 4px 0 0 0;
  line-height: 1.4;
`;

const SuggestionBox = styled(Box)`
  display: flex;
  gap: 8px;
  margin-top: 6px;
  align-items: center;
`;

const WrongText = styled.span`
  background-color: rgba(220, 38, 38, 0.1);
  color: #dc2626;
  padding: 2px 4px;
  border-radius: 2px;
  font-weight: 500;
`;

const SuggestedText = styled.span`
  background-color: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  padding: 2px 4px;
  border-radius: 2px;
  font-weight: 500;
`;

const FixButton = styled.button`
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  background-color: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #0052cc;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const CompletenessContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CompletenessBar = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const CompletenessHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CompletenessLabel = styled(Typography)`
  font-size: 12px;
  color: var(--gray-700);
  font-weight: 500;
  margin: 0;
`;

const CompletenessPercentage = styled(Typography)`
  font-size: 14px;
  font-weight: 700;
  color: var(--primary-blue);
  margin: 0;
`;

const CustomLinearProgress = styled(LinearProgress)`
  height: 8px;
  border-radius: 4px;
  background-color: var(--gray-200);

  .MuiLinearProgress-bar {
    border-radius: 4px;
    background-color: var(--primary-blue);
  }
`;

const CompleteLevelChip = styled(Chip)<{ isSelected: boolean }>`
  font-size: 11px;
  height: 28px;
  font-weight: 500;
  background-color: ${(props) => (props.isSelected ? 'var(--primary-blue)' : 'var(--gray-200)')};
  color: ${(props) => (props.isSelected ? 'white' : 'var(--gray-700)')};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${(props) => (props.isSelected ? 'var(--primary-blue)' : 'var(--gray-300)')};
  }
`;

const LevelsContainer = styled(Box)`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const MetricsGrid = styled(Box)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 10px;
  background-color: white;
  border: 1px solid var(--gray-200);
  border-radius: 6px;
  font-size: 12px;
`;

const MetricItem = styled(Box)`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const MetricIcon = styled(Box)<{ completed: boolean }>`
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => (props.completed ? '#22c55e' : 'var(--gray-400)')};
  font-size: 14px;
`;

const MetricText = styled(Typography)`
  font-size: 12px;
  color: var(--gray-700);
  margin: 0;
`;

// ============ Spell Check Rules ============

/**
 * 국립국어원 한글 맞춤법 규정 기반 검사 규칙
 * - 한글 맞춤법 (문교부 고시 제88-1호, 국립국어원 개정)
 * - 표준어 규정 (문교부 고시 제88-2호)
 * - 외래어 표기법, 띄어쓰기 규정 반영
 */
const SPELL_CHECK_RULES = [
  // ─── 1. 되/돼 구분 (맞춤법 제35항 관련) ───
  {
    pattern: /됬/g,
    rule: '됬→됐',
    suggestion: '됐',
    message: '"됐"이 올바른 과거형입니다 ("되었"의 준말)',
    type: 'error' as const,
  },

  // ─── 2. ㄹ께/ㄹ게 구분 (맞춤법 제53항) ───
  {
    pattern: /할께/g,
    rule: '할께→할게',
    suggestion: '할게',
    message: '"ㄹ게"가 맞습니다. "ㄹ께"는 비표준입니다.',
    type: 'error' as const,
  },
  {
    pattern: /볼께/g,
    rule: '볼께→볼게',
    suggestion: '볼게',
    message: '"ㄹ게"가 맞습니다. "ㄹ께"는 비표준입니다.',
    type: 'error' as const,
  },
  {
    pattern: /갈께/g,
    rule: '갈께→갈게',
    suggestion: '갈게',
    message: '"ㄹ게"가 맞습니다. "ㄹ께"는 비표준입니다.',
    type: 'error' as const,
  },

  // ─── 3. 왠/웬 구분 (표준어 규정) ───
  {
    pattern: /웬지/g,
    rule: '웬지→왠지',
    suggestion: '왠지',
    message: '"왜인지"의 준말은 "왠지"입니다. "웬"은 "어찌 된, 어떤"의 뜻입니다.',
    type: 'error' as const,
  },
  {
    pattern: /왠일/g,
    rule: '왠일→웬일',
    suggestion: '웬일',
    message: '"어찌 된 일인가"의 뜻이므로 "웬일"이 맞습니다.',
    type: 'error' as const,
  },
  {
    pattern: /왠만/g,
    rule: '왠만→웬만',
    suggestion: '웬만',
    message: '"웬만하면"이 맞습니다. "왠"은 "왠지"에서만 씁니다.',
    type: 'error' as const,
  },

  // ─── 4. 몇일/며칠 (맞춤법 제27항 관련) ───
  {
    pattern: /몇일/g,
    rule: '몇일→며칠',
    suggestion: '며칠',
    message: '"며칠"이 표준어입니다. "몇+일"이 아니라 독립 단어입니다.',
    type: 'error' as const,
  },

  // ─── 5. 어떻해/어떡해 (표준어 규정) ───
  {
    pattern: /어떻해/g,
    rule: '어떻해→어떡해',
    suggestion: '어떡해',
    message: '"어떡해"("어떻게 해"의 준말)가 올바른 표현입니다.',
    type: 'error' as const,
  },

  // ─── 6. 역활/역할 ───
  {
    pattern: /역활/g,
    rule: '역활→역할',
    suggestion: '역할',
    message: '"역할(役割)"이 올바른 표기입니다.',
    type: 'error' as const,
  },

  // ─── 7. 금새/금세 ───
  {
    pattern: /금새/g,
    rule: '금새→금세',
    suggestion: '금세',
    message: '"금시에"의 준말인 "금세"가 맞습니다.',
    type: 'error' as const,
  },

  // ─── 8. 갯수/개수 (사이시옷 규정, 맞춤법 제30항) ───
  {
    pattern: /갯수/g,
    rule: '갯수→개수',
    suggestion: '개수',
    message: '"개수(個數)"가 올바른 표기입니다. 한자어에는 사이시옷을 쓰지 않습니다.',
    type: 'error' as const,
  },
  {
    pattern: /갯\s*수/g,
    rule: '갯 수→개수',
    suggestion: '개수',
    message: '"개수(個數)"가 올바른 표기입니다.',
    type: 'error' as const,
  },

  // ─── 9. 댓가/대가 (사이시옷 규정) ───
  {
    pattern: /댓가/g,
    rule: '댓가→대가',
    suggestion: '대가',
    message: '"대가(代價)"가 올바른 표기입니다. 한자어에는 사이시옷을 쓰지 않습니다.',
    type: 'error' as const,
  },

  // ─── 10. 어의없다/어이없다 ───
  {
    pattern: /어의없/g,
    rule: '어의없→어이없',
    suggestion: '어이없',
    message: '"어이없다"가 올바른 표현입니다.',
    type: 'error' as const,
  },

  // ─── 11. 희안하다/희한하다 ───
  {
    pattern: /희안하/g,
    rule: '희안→희한',
    suggestion: '희한하',
    message: '"희한(稀罕)하다"가 맞습니다.',
    type: 'error' as const,
  },

  // ─── 12. 설레임/설렘 (표준어 규정 제18항) ───
  {
    pattern: /설레임/g,
    rule: '설레임→설렘',
    suggestion: '설렘',
    message: '"설렘"이 표준어입니다. "설레다"의 명사형은 "설렘"입니다.',
    type: 'error' as const,
  },

  // ─── 13. 부사 '-이/-히' 구분 (맞춤법 제51항) ───
  {
    pattern: /곰곰히/g,
    rule: '곰곰히→곰곰이',
    suggestion: '곰곰이',
    message: '"곰곰이"가 맞습니다. 첩어 부사는 "-이"를 씁니다.',
    type: 'error' as const,
  },
  {
    pattern: /일일히/g,
    rule: '일일히→일일이',
    suggestion: '일일이',
    message: '"일일이"가 맞습니다.',
    type: 'error' as const,
  },
  {
    pattern: /깨끗히/g,
    rule: '깨끗히→깨끗이',
    suggestion: '깨끗이',
    message: '"깨끗이"가 맞습니다. 받침 "ㅅ" 뒤에는 "-이"를 씁니다.',
    type: 'error' as const,
  },
  {
    pattern: /빠듯히/g,
    rule: '빠듯히→빠듯이',
    suggestion: '빠듯이',
    message: '"빠듯이"가 맞습니다.',
    type: 'error' as const,
  },
  {
    pattern: /가까히/g,
    rule: '가까히→가까이',
    suggestion: '가까이',
    message: '"가까이"가 맞습니다.',
    type: 'error' as const,
  },

  // ─── 14. 바래다/바라다 ───
  {
    pattern: /바래([요겠])/g,
    rule: '바래→바라',
    suggestion: '바라$1',
    message: '희망의 뜻일 때는 "바라다"가 맞습니다. "바래다"는 "색이 변하다" 뜻입니다.',
    type: 'warning' as const,
  },

  // ─── 15. 일찌기/일찍이 ───
  {
    pattern: /일찌기/g,
    rule: '일찌기→일찍이',
    suggestion: '일찍이',
    message: '"일찍이"가 올바른 표현입니다.',
    type: 'error' as const,
  },

  // ─── 16. 오랫만에 / 오래간만에 ───
  {
    pattern: /오랫만에/g,
    rule: '오랫만에→오랜만에',
    suggestion: '오랜만에',
    message: '"오랜만에" 또는 "오래간만에"가 올바른 표현입니다.',
    type: 'error' as const,
  },

  // ─── 17. 띄어쓰기: 의존명사 (맞춤법 제42항) ───
  {
    pattern: /할수있/g,
    rule: '띄어쓰기: 할 수 있',
    suggestion: '할 수 있',
    message: '의존명사 "수"는 앞말과 띄어 씁니다.',
    type: 'warning' as const,
  },
  {
    pattern: /할수록/g,
    rule: '띄어쓰기: 할수록',
    suggestion: '할수록',
    message: '"할수록"은 붙여 씁니다 ("-ㄹ수록" 어미).',
    type: 'warning' as const,
  },
  {
    pattern: /해야할/g,
    rule: '띄어쓰기: 해야 할',
    suggestion: '해야 할',
    message: '"해야 할"로 띄어 씁니다.',
    type: 'warning' as const,
  },
  {
    pattern: /할때/g,
    rule: '띄어쓰기: 할 때',
    suggestion: '할 때',
    message: '의존명사 "때"는 앞말과 띄어 씁니다.',
    type: 'warning' as const,
  },
  {
    pattern: /한것/g,
    rule: '띄어쓰기: 한 것',
    suggestion: '한 것',
    message: '의존명사 "것"은 앞말과 띄어 씁니다.',
    type: 'warning' as const,
  },
  {
    pattern: /될것/g,
    rule: '띄어쓰기: 될 것',
    suggestion: '될 것',
    message: '의존명사 "것"은 앞말과 띄어 씁니다.',
    type: 'warning' as const,
  },

  // ─── 18. 자주 틀리는 표현들 ───
  {
    pattern: /문안하다/g,
    rule: '문안→무난',
    suggestion: '무난하다',
    message: '"문제없이 순탄하다"는 뜻은 "무난(無難)하다"입니다.',
    type: 'warning' as const,
  },
  {
    pattern: /안습/g,
    rule: '안습 (비표준)',
    suggestion: '안습',
    message: '"안습"은 비표준 신조어입니다. 정식 문서에서는 "안타깝다" 등을 사용하세요.',
    type: 'warning' as const,
  },

  // ─── 19. 맞춤법 제5항: 된소리 ───
  {
    pattern: /있슴/g,
    rule: '있슴→있음',
    suggestion: '있음',
    message: '"있음"이 올바른 표기입니다.',
    type: 'error' as const,
  },
  {
    pattern: /없슴/g,
    rule: '없슴→없음',
    suggestion: '없음',
    message: '"없음"이 올바른 표기입니다.',
    type: 'error' as const,
  },
  {
    pattern: /합니데/g,
    rule: '합니데→합니다',
    suggestion: '합니다',
    message: '"합니다"가 올바른 표기입니다.',
    type: 'error' as const,
  },

  // ─── 20. 불필요 띄어쓰기 ───
  {
    pattern: /  +/g,
    rule: '불필요한 띄어쓰기',
    suggestion: ' ',
    message: '연속된 공백이 있습니다. 한 칸만 띄어야 합니다.',
    type: 'warning' as const,
  },
];

// ============ Helper Functions ============

/** HTML 태그를 제거하고 순수 텍스트만 추출 */
function stripHtml(html: string): string {
  if (!html) return '';
  // <br>, <p>, <div> 등은 줄바꿈으로 변환
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]*>/g, '');
  // HTML entities 디코딩
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"');
  // 앞뒤 공백/줄바꿈만 있는 경우 빈 문자열 반환 (빈 에디터 <p></p> → "\n" 방지)
  if (!text.trim()) return '';
  // 맨 끝 줄바꿈 제거 (</p> 변환으로 생긴 불필요한 trailing newline)
  text = text.replace(/\n+$/, '');
  return text;
}

function countCharacters(text: string) {
  // 공백 포함: 줄바꿈(\n, \r)은 HTML 변환 부산물이므로 제외
  return stripHtml(text).replace(/[\r\n]/g, '').length;
}

function countCharactersWithoutSpaces(text: string) {
  return stripHtml(text).replace(/\s/g, '').length;
}

function countWords(text: string) {
  const clean = stripHtml(text).trim();
  if (!clean) return 0;
  const words = clean.split(/\s+/).filter((w) => w.length > 0);
  return words.length;
}

function countParagraphs(text: string) {
  const clean = stripHtml(text);
  const paragraphs = clean
    .split(/\n\n+/)
    .filter((p) => p.trim().length > 0);
  return paragraphs.length;
}

function estimateReadingTime(text: string, lang: SupportedLang = 'ko'): string {
  const charCount = stripHtml(text).replace(/\s/g, '').length;
  const avgCharsPerMinute = 500;
  const minutes = Math.max(1, Math.ceil(charCount / avgCharsPerMinute));

  if (minutes < 1) {
    return t('lessThanOneMin', lang);
  } else if (minutes === 1) {
    return t('aboutOneMin', lang);
  } else {
    return t('aboutNMin', lang).replace('{n}', String(minutes));
  }
}

function detectSpellCheckErrors(text: string): SpellCheckError[] {
  const errors: SpellCheckError[] = [];
  let errorId = 0;

  SPELL_CHECK_RULES.forEach((rule) => {
    let match;
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);

    while ((match = regex.exec(text)) !== null) {
      // 캡처 그룹 치환 지원 ($1, $2 등)
      let resolvedSuggestion = rule.suggestion;
      if (match.length > 1) {
        for (let g = 1; g < match.length; g++) {
          resolvedSuggestion = resolvedSuggestion.replace(`$${g}`, match[g] || '');
        }
      }
      errors.push({
        id: `error-${errorId++}`,
        text: match[0],
        suggestion: resolvedSuggestion,
        rule: rule.rule,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        type: rule.type,
      });
    }
  });

  // Check for missing period at end
  if (text.trim().length > 0) {
    const lastChar = text.trim().slice(-1);
    if (!['.', '!', '?', '。', '！', '？'].includes(lastChar)) {
      errors.push({
        id: `error-${errorId++}`,
        text: '마침표 없음',
        suggestion: '.',
        rule: '문장 끝 마침표',
        startIndex: text.length - 1,
        endIndex: text.length,
        type: 'warning',
      });
    }
  }

  return errors.sort((a, b) => a.startIndex - b.startIndex);
}

function calculateCompletenessMetrics(
  text: string,
  errors: SpellCheckError[]
): CompletenessMetrics {
  const clean = stripHtml(text);
  const contentLength = clean.replace(/\s/g, '').length;
  const hasHeading = /^#{1,2}\s+.+$/m.test(clean);
  const paragraphs = clean.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const hasParagraphs = paragraphs.length >= 2;
  const hasImages = /!\[.*?\]\(.*?\)/.test(text);
  const hasLinks = /\[.*?\]\(.*?\)/.test(text);
  const paragraphContent = paragraphs.slice(-2).join('\n').toLowerCase();
  const hasConclusion =
    /결론|요약|정리|마무리|끝으로|결말|(정|의)결|최종|종합/.test(paragraphContent);

  return {
    hasMinContent: contentLength >= 100,
    hasHeading,
    hasParagraphs,
    hasImages,
    hasLinks,
    hasConclusion,
    spellCheckPassed: errors.length === 0,
    contentLength,
  };
}

function calculateCompleteness(
  text: string,
  metrics: CompletenessMetrics,
  manualLevel?: number
): { level: number; label: string; percentage: number } {
  const levels = [
    { level: 1, label: '10%', percentage: 10 },
    { level: 2, label: '20%', percentage: 20 },
    { level: 3, label: '30%', percentage: 30 },
    { level: 4, label: '40%', percentage: 40 },
    { level: 5, label: '50%', percentage: 50 },
    { level: 6, label: '60%', percentage: 60 },
    { level: 7, label: '70%', percentage: 70 },
    { level: 8, label: '80%', percentage: 80 },
    { level: 9, label: '90%', percentage: 90 },
    { level: 10, label: '100%', percentage: 100 },
  ];

  if (manualLevel !== undefined) {
    return levels[manualLevel - 1] || levels[9];
  }

  const scoreFactors = [
    metrics.hasMinContent ? 20 : 0,
    metrics.hasHeading ? 10 : 0,
    metrics.hasParagraphs ? 15 : 0,
    metrics.hasImages ? 10 : 0,
    metrics.hasLinks ? 10 : 0,
    metrics.hasConclusion ? 15 : 0,
    metrics.spellCheckPassed ? 10 : 0,
  ];

  const score = scoreFactors.reduce((a, b) => a + b, 0);
  const levelIndex = Math.min(Math.floor(score / 10), 9);
  return levels[levelIndex];
}

// ============ Main Component ============

export const WritingTools: React.FC<WritingToolsProps> = ({
  content,
  onContentUpdate,
}) => {
  const lang = useAtomValue(langStore);
  const [isExpanded, setIsExpanded] = useState(false);
  const [manualCompletenessLevel, setManualCompletenessLevel] = useState<
    number | undefined
  >(undefined);

  // Memoize calculations
  const characterCount = useMemo(() => countCharacters(content), [content]);
  const characterCountNoSpaces = useMemo(
    () => countCharactersWithoutSpaces(content),
    [content]
  );
  const wordCount = useMemo(() => countWords(content), [content]);
  const paragraphCount = useMemo(() => countParagraphs(content), [content]);
  const readingTime = useMemo(() => estimateReadingTime(content, lang), [content, lang]);

  const spellCheckErrors = useMemo(
    () => detectSpellCheckErrors(content),
    [content]
  );

  const metrics = useMemo(
    () => calculateCompletenessMetrics(content, spellCheckErrors),
    [content, spellCheckErrors]
  );

  const completeness = useMemo(
    () => calculateCompleteness(content, metrics, manualCompletenessLevel),
    [content, metrics, manualCompletenessLevel]
  );

  const handleFixError = useCallback(
    (error: SpellCheckError) => {
      if (!onContentUpdate) return;

      const before = content.substring(0, error.startIndex);
      const after = content.substring(error.endIndex);
      const corrected = before + error.suggestion + after;

      onContentUpdate(corrected);
    },
    [content, onContentUpdate]
  );

  const handleSetCompletenessLevel = (level: number) => {
    setManualCompletenessLevel(
      manualCompletenessLevel === level ? undefined : level
    );
  };

  const errorCount = spellCheckErrors.length;
  const hasErrors = errorCount > 0;

  return (
    <ToolbarContainer>
      <ToolbarHeader onClick={() => setIsExpanded(!isExpanded)}>
        <ToolbarTitle>{t('writingToolsTitle', lang)}</ToolbarTitle>
        <IconButton size="small" sx={{ p: 0 }}>
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </ToolbarHeader>

      {isExpanded && (
        <ToolbarContent>
          {/* Feature 1: Character Counter */}
          <FeatureSection>
            <SectionTitle>{t('sectionCharCount', lang)}</SectionTitle>
            <CounterGrid>
              <CounterItem>
                <CounterLabel>{t('charWithSpaces', lang)}</CounterLabel>
                <CounterValue>{characterCount}</CounterValue>
              </CounterItem>
              <CounterItem>
                <CounterLabel>{t('charWithoutSpaces', lang)}</CounterLabel>
                <CounterValue>{characterCountNoSpaces}</CounterValue>
              </CounterItem>
              <CounterItem>
                <CounterLabel>{t('wordCountLabel', lang)}</CounterLabel>
                <CounterValue>{wordCount}</CounterValue>
              </CounterItem>
              <CounterItem>
                <CounterLabel>{t('paragraphCountLabel', lang)}</CounterLabel>
                <CounterValue>{paragraphCount}</CounterValue>
              </CounterItem>
            </CounterGrid>
            <ReadingTimeBox>
              <ReadingTimeLabel>{t('estimatedReadingTime', lang)}</ReadingTimeLabel>
              <ReadingTimeValue>{readingTime}</ReadingTimeValue>
            </ReadingTimeBox>
          </FeatureSection>

          {/* Feature 2: Spell Check */}
          <FeatureSection>
            <SectionTitle>{t('sectionSpellCheck', lang)}</SectionTitle>
            <SpellCheckContainer>
              <SpellCheckSummary>
                {hasErrors ? (
                  <>
                    <ErrorIcon sx={{ fontSize: 18, color: '#dc2626' }} />
                    <Typography sx={{ fontSize: '12px', color: 'var(--gray-700)', m: 0 }}>
                      {t('spellErrorsFound', lang).replace('{n}', String(errorCount))}
                    </Typography>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon sx={{ fontSize: 18, color: '#22c55e' }} />
                    <Typography sx={{ fontSize: '12px', color: 'var(--gray-700)', m: 0 }}>
                      {t('noSpellErrors', lang)}
                    </Typography>
                  </>
                )}
              </SpellCheckSummary>

              {hasErrors && (
                <ErrorList>
                  {spellCheckErrors.map((error) => (
                    <ErrorItem key={error.id} type={error.type}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title={error.rule}>
                          <Chip
                            label={error.rule}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: '10px',
                              height: '20px',
                              borderColor:
                                error.type === 'error' ? '#dc2626' : '#d97706',
                              color:
                                error.type === 'error' ? '#dc2626' : '#d97706',
                            }}
                          />
                        </Tooltip>
                      </Box>
                      <Box sx={{ mt: 4 }}>
                        <WrongText>{error.text}</WrongText>
                        <Typography sx={{ fontSize: '11px', color: 'var(--gray-600)', m: '4px 0', display: 'inline-block', ml: 1 }}>
                          →
                        </Typography>
                        <SuggestedText style={{ marginLeft: 8, display: 'inline-block' }}>
                          {error.suggestion}
                        </SuggestedText>
                      </Box>
                      <ErrorRule>{error.message || error.rule}</ErrorRule>
                      {onContentUpdate && (
                        <SuggestionBox>
                          <FixButton onClick={() => handleFixError(error)}>
                            {t('autoFix', lang)}
                          </FixButton>
                        </SuggestionBox>
                      )}
                    </ErrorItem>
                  ))}
                </ErrorList>
              )}
            </SpellCheckContainer>
          </FeatureSection>

          {/* Feature 3: Completeness Meter */}
          <FeatureSection>
            <SectionTitle>{t('sectionCompleteness', lang)}</SectionTitle>
            <CompletenessContainer>
              <CompletenessBar>
                <CompletenessHeader>
                  <CompletenessLabel>{completeness.label}</CompletenessLabel>
                  <CompletenessPercentage>
                    {completeness.percentage}%
                  </CompletenessPercentage>
                </CompletenessHeader>
                <CustomLinearProgress
                  variant="determinate"
                  value={completeness.percentage}
                />
              </CompletenessBar>

              <Box>
                <Typography
                  sx={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--gray-700)',
                    mb: 1,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                  }}
                >
                  {t('selectLevel', lang)}
                </Typography>
                <LevelsContainer>
                  {[
                    { level: 1, label: '10%' },
                    { level: 2, label: '20%' },
                    { level: 3, label: '30%' },
                    { level: 4, label: '40%' },
                    { level: 5, label: '50%' },
                    { level: 6, label: '60%' },
                    { level: 7, label: '70%' },
                    { level: 8, label: '80%' },
                    { level: 9, label: '90%' },
                    { level: 10, label: '100%' },
                  ].map((item) => (
                    <CompleteLevelChip
                      key={item.level}
                      label={item.label}
                      onClick={() => handleSetCompletenessLevel(item.level)}
                      isSelected={manualCompletenessLevel === item.level}
                    />
                  ))}
                </LevelsContainer>
              </Box>

              <MetricsGrid>
                <MetricItem>
                  <MetricIcon completed={metrics.hasMinContent}>
                    {metrics.hasMinContent ? '✓' : '○'}
                  </MetricIcon>
                  <MetricText>{t('metricMinChars', lang)}</MetricText>
                </MetricItem>
                <MetricItem>
                  <MetricIcon completed={metrics.hasHeading}>
                    {metrics.hasHeading ? '✓' : '○'}
                  </MetricIcon>
                  <MetricText>{t('metricHeading', lang)}</MetricText>
                </MetricItem>
                <MetricItem>
                  <MetricIcon completed={metrics.hasParagraphs}>
                    {metrics.hasParagraphs ? '✓' : '○'}
                  </MetricIcon>
                  <MetricText>{t('metricMultiParagraphs', lang)}</MetricText>
                </MetricItem>
                <MetricItem>
                  <MetricIcon completed={metrics.hasImages}>
                    {metrics.hasImages ? '✓' : '○'}
                  </MetricIcon>
                  <MetricText>{t('metricImages', lang)}</MetricText>
                </MetricItem>
                <MetricItem>
                  <MetricIcon completed={metrics.hasLinks}>
                    {metrics.hasLinks ? '✓' : '○'}
                  </MetricIcon>
                  <MetricText>{t('metricLinks', lang)}</MetricText>
                </MetricItem>
                <MetricItem>
                  <MetricIcon completed={metrics.hasConclusion}>
                    {metrics.hasConclusion ? '✓' : '○'}
                  </MetricIcon>
                  <MetricText>{t('metricConclusion', lang)}</MetricText>
                </MetricItem>
                <MetricItem>
                  <MetricIcon completed={metrics.spellCheckPassed}>
                    {metrics.spellCheckPassed ? '✓' : '○'}
                  </MetricIcon>
                  <MetricText>{t('metricSpellPass', lang)}</MetricText>
                </MetricItem>
              </MetricsGrid>
            </CompletenessContainer>
          </FeatureSection>
        </ToolbarContent>
      )}
    </ToolbarContainer>
  );
};

export default WritingTools;
