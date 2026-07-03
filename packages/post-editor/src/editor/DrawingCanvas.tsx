/**
 * DrawingCanvas — 에디터 내 그리기 도구
 * Canvas에 자유 드로잉 후 이미지(data URL)로 에디터에 삽입
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
  Slider,
  Box,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import DeleteIcon from '@mui/icons-material/Delete';
import { langStore } from './_shims/common';
import { t } from './_shims/i18n';
import { useAtomValue } from 'jotai';
import { Editor } from '@tiptap/react';

interface DrawingCanvasProps {
  open: boolean;
  onClose: () => void;
  editor: Editor;
}

type Tool = 'pen' | 'eraser';

const COLORS = [
  '#000000', '#dc2626', '#2563eb', '#16a34a',
  '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280',
];

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ open, onClose, editor }) => {
  const lang = useAtomValue(langStore);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState<ImageData[]>([]);

  // 캔버스 초기화
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 640;
    canvas.height = 400;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHistory([]);
  }, [open]);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  }, []);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    saveState();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 4 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    setIsDrawing(true);
  }, [saveState, getPos, tool, lineWidth, color]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing, getPos]);

  const endDraw = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const handleUndo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || history.length === 0) return;

    const prev = history[history.length - 1];
    ctx.putImageData(prev, 0, 0);
    setHistory(h => h.slice(0, -1));
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    saveState();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleInsert = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    editor.chain().focus().setImage({ src: dataUrl }).run();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontSize: 16, fontWeight: 600, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        그리기
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="되돌리기">
            <IconButton size="small" onClick={handleUndo} disabled={history.length === 0}>
              <UndoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="전체 지우기">
            <IconButton size="small" onClick={handleClear}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        {/* 도구 선택 */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1.5, flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            value={tool}
            exclusive
            onChange={(_, v) => v && setTool(v)}
            size="small"
          >
            <ToggleButton value="pen" sx={{ fontSize: 13 }}>{t('penTool', lang)}</ToggleButton>
            <ToggleButton value="eraser" sx={{ fontSize: 13 }}>{t('eraserTool', lang)}</ToggleButton>
          </ToggleButtonGroup>

          {/* 색상 */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {COLORS.map(c => (
              <Box
                key={c}
                onClick={() => { setColor(c); setTool('pen'); }}
                sx={{
                  width: 22, height: 22, borderRadius: '50%', backgroundColor: c,
                  border: color === c && tool === 'pen' ? '2px solid #0056b3' : '1px solid #ccc',
                  cursor: 'pointer',
                  transition: 'transform 0.15s',
                  '&:hover': { transform: 'scale(1.2)' },
                }}
              />
            ))}
          </Box>

          {/* 굵기 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
            <span style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>굵기</span>
            <Slider
              value={lineWidth}
              onChange={(_, v) => setLineWidth(v as number)}
              min={1} max={12} step={1}
              size="small"
              sx={{ width: 80 }}
            />
          </Box>
        </Box>

        {/* 캔버스 */}
        <Box sx={{
          border: '1px solid #e0e0e0', borderRadius: 1, overflow: 'hidden',
          touchAction: 'none', cursor: tool === 'eraser' ? 'cell' : 'crosshair',
        }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">취소</Button>
        <Button onClick={handleInsert} variant="contained" size="small">
          이미지로 삽입
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DrawingCanvas;
