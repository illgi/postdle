/**
 * CalculatorModal — 에디터 내 계산기
 * 수식 입력 → 결과 계산 → 에디터에 삽입
 */
import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { Editor } from '@tiptap/react';

interface CalculatorModalProps {
  open: boolean;
  onClose: () => void;
  editor: Editor;
}

/** 안전한 수식 평가 (eval 대신 직접 파싱) */
function safeEvaluate(expr: string): { result: number | null; error: string | null } {
  try {
    // 허용 문자 검증: 숫자, 연산자, 괄호, 공백, 소수점
    const sanitized = expr.replace(/\s/g, '');
    if (!/^[0-9+\-*/().,%^]+$/.test(sanitized)) {
      return { result: null, error: '허용되지 않는 문자가 포함되어 있습니다.' };
    }

    // % 처리: 숫자% → 숫자/100
    const processed = sanitized.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

    // ^ 처리: ** 로 변환
    const withPow = processed.replace(/\^/g, '**');

    // Function constructor로 안전하게 실행
    const fn = new Function(`"use strict"; return (${withPow});`);
    const result = fn();

    if (typeof result !== 'number' || !isFinite(result)) {
      return { result: null, error: '계산할 수 없는 수식입니다.' };
    }

    // 소수점 처리
    const rounded = Math.round(result * 1e10) / 1e10;
    return { result: rounded, error: null };
  } catch {
    return { result: null, error: '수식 형식이 올바르지 않습니다.' };
  }
}

/** 숫자에 천 단위 쉼표 */
function formatNumber(n: number): string {
  const str = String(n);
  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

const PRESETS = [
  { label: '부가세(10%)', expr: '* 1.1', desc: '× 1.1' },
  { label: '할인(20%)', expr: '* 0.8', desc: '× 0.8' },
  { label: '반올림', expr: '', desc: 'Math.round' },
];

const CalculatorModal: React.FC<CalculatorModalProps> = ({ open, onClose, editor }) => {
  const [expression, setExpression] = useState('');
  const [calcResult, setCalcResult] = useState<string | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ expr: string; result: string }[]>([]);

  const handleCalculate = useCallback(() => {
    if (!expression.trim()) return;

    const { result, error } = safeEvaluate(expression);
    if (error) {
      setCalcError(error);
      setCalcResult(null);
    } else if (result !== null) {
      const formatted = formatNumber(result);
      setCalcResult(formatted);
      setCalcError(null);
      setHistory(prev => [{ expr: expression, result: formatted }, ...prev.slice(0, 9)]);
    }
  }, [expression]);

  const handleInsertResult = () => {
    if (calcResult === null) return;
    editor.chain().focus().insertContent(calcResult).run();
    onClose();
  };

  const handleInsertWithFormula = () => {
    if (calcResult === null) return;
    editor.chain().focus().insertContent(`${expression} = ${calcResult}`).run();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCalculate();
    }
  };

  const handlePreset = (preset: typeof PRESETS[0]) => {
    if (calcResult && preset.expr) {
      const raw = calcResult.replace(/,/g, '');
      setExpression(`${raw} ${preset.expr}`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 16, fontWeight: 600, pb: 1 }}>
        계산기
      </DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <TextField
          fullWidth
          label="수식 입력"
          placeholder="예: 1200 * 3 + 500"
          value={expression}
          onChange={e => setExpression(e.target.value)}
          onKeyDown={handleKeyDown}
          size="small"
          autoFocus
          sx={{ mb: 1.5 }}
          helperText="+ - * / ^ % ( ) 사용 가능, Enter로 계산"
        />

        {/* 프리셋 */}
        <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
          {PRESETS.map(p => (
            <Chip
              key={p.label}
              label={p.label}
              size="small"
              variant="outlined"
              onClick={() => handlePreset(p)}
              sx={{ fontSize: 11, cursor: 'pointer' }}
            />
          ))}
        </Box>

        {/* 결과 */}
        {calcResult !== null && (
          <Box sx={{ p: 2, background: '#f0f7ff', borderRadius: 2, mb: 1.5, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 12, color: '#666', mb: 0.5 }}>{expression}</Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#0056b3' }}>
              = {calcResult}
            </Typography>
          </Box>
        )}
        {calcError && (
          <Box sx={{ p: 1.5, background: '#fef2f2', borderRadius: 2, mb: 1.5 }}>
            <Typography sx={{ fontSize: 12, color: '#dc2626' }}>{calcError}</Typography>
          </Box>
        )}

        {/* 계산 이력 */}
        {history.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#888', mb: 0.5 }}>
              최근 계산
            </Typography>
            {history.map((h, i) => (
              <Box
                key={i}
                onClick={() => setExpression(h.result.replace(/,/g, ''))}
                sx={{
                  fontSize: 12, color: '#555', py: 0.3, cursor: 'pointer',
                  '&:hover': { color: '#0056b3' },
                }}
              >
                {h.expr} = {h.result}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">닫기</Button>
        <Button onClick={handleCalculate} size="small" variant="outlined" disabled={!expression.trim()}>
          계산
        </Button>
        <Button onClick={handleInsertResult} size="small" variant="contained" disabled={calcResult === null}>
          결과 삽입
        </Button>
        <Button onClick={handleInsertWithFormula} size="small" disabled={calcResult === null}>
          수식+결과 삽입
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CalculatorModal;
