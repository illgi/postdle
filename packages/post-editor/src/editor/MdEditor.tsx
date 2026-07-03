'use client';
import { isTouchOnlyDevice } from './_shims/validate';
import { langStore } from './_shims/common';
import { t } from './_shims/i18n';
import { useAtomValue } from 'jotai';

import { TPageContentType } from './_shims/commonCode';
import { useEditorAdapter } from './adapter';
import { TFormRes } from './_shims/apiType';

import AutoSave from './AutoSave';
import { ImageModal } from './ImageModal';
import { MdWrap, PreviewButton } from './mdEditorStyle';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import CodeIcon from '@mui/icons-material/Code';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatStrikethroughIcon from '@mui/icons-material/FormatStrikethrough';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GridOnIcon from '@mui/icons-material/GridOn';
import ImageIcon from '@mui/icons-material/Image';
import Redo from '@mui/icons-material/Redo';
import Undo from '@mui/icons-material/Undo';
import YouTubeIcon from '@mui/icons-material/YouTube';
import TitleIcon from '@mui/icons-material/Title';
import SubscriptIcon from '@mui/icons-material/Subscript';
import SuperscriptIcon from '@mui/icons-material/Superscript';
import { Box, Button, IconButton, Menu, MenuItem, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, ListItem, ListItemButton, ListItemText, Chip, CircularProgress } from '@mui/material';
import { Extension } from '@tiptap/core';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import Placeholder from '@tiptap/extension-placeholder';
import { TableCell, TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyleKit } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import Youtube from '@tiptap/extension-youtube';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DataObjectIcon from '@mui/icons-material/DataObject';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import BrushIcon from '@mui/icons-material/Brush';
import CalculateIcon from '@mui/icons-material/Calculate';
import DrawingCanvas from './DrawingCanvas';
import CalculatorModal from './CalculatorModal';
import DOMPurify from 'dompurify';
import React, { useEffect, useState, lazy, Suspense, useCallback } from 'react';
import { Markdown } from 'tiptap-markdown';

// Lazy load WritingTools for better performance
const WritingTools = lazy(() => import('./WritingTools'));
import { consumePendingTemplate } from './PageTemplates';

const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      // extend the existing attributes …
      ...this.parent?.(),

      // and add a new one …
      backgroundColor: {
        default: null,
        parseHTML: element => element.getAttribute('data-background-color'),
        renderHTML: attributes => {
          return {
            'data-background-color': attributes.backgroundColor,
            style: `background-color: ${attributes.backgroundColor}`,
          };
        },
      },
    };
  },
});

const TableMenu = ({ editor, isDisable }: { editor: Editor | null; isDisable?: boolean }) => {
  const lang = useAtomValue(langStore);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  if (!editor) return null;

  const isTableActive = editor.isActive('table');

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const close = () => setAnchorEl(null);

  return (
    <>
      {/* 테이블 아이콘 버튼 */}
      <IconButton onClick={handleClick} size="small" disabled={isDisable}>
        <GridOnIcon />
      </IconButton>

      {/* 테이블 옵션 메뉴 */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem
          disabled={isDisable}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          {t('insertTable', lang)}
        </MenuItem>
        <MenuItem
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          disabled={!editor.can().addColumnBefore() || !isTableActive}
        >
          {t('addLeftColumn', lang)}
        </MenuItem>

        <MenuItem
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          disabled={!editor.can().addColumnAfter() || !isTableActive}
        >
          {t('addRightColumn', lang)}
        </MenuItem>

        <MenuItem
          onClick={() => editor.chain().focus().addRowBefore().run()}
          disabled={!editor.can().addRowBefore() || !isTableActive}
        >
          {t('addTopRow', lang)}
        </MenuItem>

        <MenuItem
          onClick={() => editor.chain().focus().addRowAfter().run()}
          disabled={!editor.can().addRowAfter() || !isTableActive}
        >
          {t('addBottomRow', lang)}
        </MenuItem>

        {/* 모바일에서는 focus가 해제되어 병합, 분할 기능 사용 불가 */}
        {!isTouchOnlyDevice() && (
          <>
            <MenuItem
              onClick={() => editor.chain().focus().mergeCells().run()}
              disabled={!editor.can().mergeCells() || !isTableActive}
            >
              {t('mergeCells', lang)}
            </MenuItem>

            <MenuItem
              onClick={() => editor.chain().focus().splitCell().run()}
              disabled={!editor.can().splitCell() || !isTableActive}
            >
              {t('splitCell', lang)}
            </MenuItem>
          </>
        )}
        <MenuItem
          sx={{ color: 'error.main' }}
          onClick={() => editor.chain().focus().deleteColumn().run()}
          disabled={!editor.can().deleteColumn() || !isTableActive}
        >
          {t('deleteColumn', lang)}
        </MenuItem>
        <MenuItem
          sx={{ color: 'error.main' }}
          onClick={() => editor.chain().focus().deleteRow().run()}
          disabled={!editor.can().deleteRow() || !isTableActive}
        >
          {t('deleteRow', lang)}
        </MenuItem>
        <MenuItem
          sx={{ color: 'error.main' }}
          onClick={() => editor.chain().focus().deleteTable().run()}
          disabled={!editor.can().deleteTable() || !isTableActive}
        >
          {t('deleteTable', lang)}
        </MenuItem>
      </Menu>
    </>
  );
};

// ===================== Heading Menu =====================
const HeadingMenu = ({ editor, isDisabled = false }: { editor: Editor; isDisabled?: boolean }) => {
  const lang = useAtomValue(langStore);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <Tooltip title={t('editorHeading', lang)}>
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          size="small"
          disabled={isDisabled}
          sx={{ minWidth: 32 }}
        >
          <TitleIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem
          onClick={() => { editor.chain().focus().setParagraph().run(); setAnchorEl(null); }}
          selected={editor.isActive('paragraph')}
        >
          <span style={{ fontSize: 14 }}>{t('editorParagraph', lang)}</span>
        </MenuItem>
        <MenuItem
          onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setAnchorEl(null); }}
          selected={editor.isActive('heading', { level: 1 })}
        >
          <span style={{ fontSize: 20, fontWeight: 700 }}>{t('editorHeading1', lang)}</span>
        </MenuItem>
        <MenuItem
          onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setAnchorEl(null); }}
          selected={editor.isActive('heading', { level: 2 })}
        >
          <span style={{ fontSize: 17, fontWeight: 600 }}>{t('editorHeading2', lang)}</span>
        </MenuItem>
        <MenuItem
          onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); setAnchorEl(null); }}
          selected={editor.isActive('heading', { level: 3 })}
        >
          <span style={{ fontSize: 15, fontWeight: 500 }}>{t('editorHeading3', lang)}</span>
        </MenuItem>
      </Menu>
    </>
  );
};

// ===================== Link Modal =====================
const LinkModal = ({ open, onClose, editor }: { open: boolean; onClose: () => void; editor: Editor }) => {
  const lang = useAtomValue(langStore);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    if (open) {
      const currentUrl = editor.getAttributes('link').href || '';
      setUrl(currentUrl);
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, '');
      setText(selectedText);
    }
  }, [open, editor]);

  const handleSubmit = () => {
    if (!url) { onClose(); return; }
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;

    if (text && !editor.state.selection.content().size) {
      editor.chain().focus()
        .insertContent(`<a href="${fullUrl}" target="_blank">${text}</a>`)
        .run();
    } else {
      editor.chain().focus()
        .extendMarkRange('link')
        .setLink({ href: fullUrl, target: '_blank' })
        .run();
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: 16, fontWeight: 600, pb: 1 }}>{t('editorInsertLink', lang)}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <TextField
          label="URL"
          placeholder={t('editorLinkUrl', lang)}
          value={url}
          onChange={e => setUrl(e.target.value)}
          size="small"
          fullWidth
          autoFocus
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        <TextField
          label={t('editorLinkText', lang)}
          value={text}
          onChange={e => setText(e.target.value)}
          size="small"
          fullWidth
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">{t('editorCancel', lang)}</Button>
        <Button onClick={handleSubmit} variant="contained" size="small" disabled={!url}>
          {t('editorConfirm', lang)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ===================== Form Link Modal =====================
const FormLinkModal = ({ open, onClose, editor }: { open: boolean; onClose: () => void; editor: Editor }) => {
  const lang = useAtomValue(langStore);
  const { listForms } = useEditorAdapter();
  const [forms, setForms] = useState<Array<Partial<TFormRes> & { id: string; title: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && listForms) {
      setLoading(true);
      listForms().then(res => {
        setForms(res || []);
      }).catch(() => {
        setForms([]);
      }).finally(() => setLoading(false));
    }
  }, [open, listForms]);

  const handleSelectForm = (form: { id: string; title: string }) => {
    const formUrl = `${window.location.origin}/forms/${form.id}`;
    editor.chain().focus()
      .insertContent(`<a href="${formUrl}" target="_blank">${form.title}</a>`)
      .run();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: 16, fontWeight: 600, pb: 1 }}>{t('editorInsertFormLink', lang)}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : forms.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: '#888' }}>
            {t('editorNoForms', lang)}
          </Box>
        ) : (
          <List sx={{ pt: 0 }}>
            {forms.map(form => (
              <ListItem key={form.id} disablePadding>
                <ListItemButton onClick={() => handleSelectForm(form)} sx={{ borderRadius: 1 }}>
                  <ListItemText
                    primary={form.title}
                    secondary={`${t('formResponses', lang)}: ${form.submissionCount}`}
                    primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                    secondaryTypographyProps={{ fontSize: 12 }}
                  />
                  <Chip
                    label={form.isActive ? t('formActive', lang) : t('formInactive', lang)}
                    size="small"
                    color={form.isActive ? 'success' : 'default'}
                    sx={{ fontSize: 11 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">{t('editorCancel', lang)}</Button>
      </DialogActions>
    </Dialog>
  );
};

export const FontSize = Extension.create({
  name: 'fontSize',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }

              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize }).run();
        },

      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
        },
    };
  },
});

const FontSizeMenu = ({ editor, isDisabled = false }: { editor: Editor; isDisabled?: boolean }) => {
  const lang = useAtomValue(langStore);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // const fontSizes = [
  //   { name: 'Small', size: '14px' },
  //   { name: 'Default', size: '16px' },
  //   { name: 'Medium', size: '18px' },
  //   { name: 'Large', size: '20px' },
  //   { name: 'XL', size: '24px' },
  //   { name: 'XXL', size: '32px' },
  // ];
  const fontSizes = [
    { name: '10', size: '10px' },
    { name: '12', size: '12px' },
    { name: '14', size: '14px' },
    { name: '16', size: '16px' },
    { name: '18', size: '18px' },
    { name: '20', size: '20px' },
    { name: '24', size: '24px' },
    { name: '32', size: '32px' },
  ];

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const applyFontSize = (size: string) => {
    editor?.chain().focus().setFontSize(size).run();
    setAnchorEl(null);
  };

  const unsetFontSize = () => {
    editor?.chain().focus().unsetFontSize().run();
    setAnchorEl(null);
  };

  const currentFontSize = editor?.getAttributes('textStyle')?.fontSize ?? '16px';

  return (
    <>
      {/* 폰트 사이즈 아이콘 버튼 */}
      <IconButton onClick={handleClick} size="small" disabled={isDisabled}>
        <span>Aa</span>
      </IconButton>

      {/* 폰트 사이즈 선택 팝업 */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {/* 폰트 사이즈 제거 */}
        <MenuItem onClick={unsetFontSize}>❌ {t('resetFontSize', lang)}</MenuItem>

        {/* 사이즈 목록 */}
        {fontSizes.map(f => (
          <MenuItem key={f.size} onClick={() => applyFontSize(f.size)} selected={currentFontSize === f.size}>
            <Box
              sx={{
                fontSize: f.size,
                lineHeight: 1.2,
              }}
            >
              {f.name} ({f.size})
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

const TextColorMenu = ({ editor, isDisabled = false }: { editor: Editor; isDisabled?: boolean }) => {
  const lang = useAtomValue(langStore);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const colors = [
    { name: 'Yellow', color: '#ffff00' },
    { name: 'Orange', color: '#ffc078' },
    { name: 'Green', color: '#8ce99a' },
    { name: 'Blue', color: '#74c0fc' },
    { name: 'Purple', color: '#b197fc' },
    { name: 'Red', color: 'red' },
  ];

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const applyColor = (color: string) => {
    editor?.chain().focus().setColor(color).run();
    setAnchorEl(null);
  };

  const unsetColor = () => {
    editor?.chain().focus().unsetColor().run();
    setAnchorEl(null);
  };

  return (
    <>
      {/* 텍스트 컬러 아이콘 버튼 */}
      <IconButton onClick={handleClick} size="small" disabled={isDisabled}>
        <FormatColorTextIcon />
      </IconButton>

      {/* 컬러 선택 팝업 */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {/* 컬러 제거 */}
        <MenuItem onClick={unsetColor}>❌ {t('removeColor', lang)}</MenuItem>

        {/* 색상 목록 */}
        {colors.map(c => (
          <MenuItem
            key={c.color}
            onClick={() => applyColor(c.color)}
            selected={editor?.isActive('textStyle', { color: c.color })}
          >
            <Box
              sx={{
                width: 18,
                height: 18,
                borderRadius: '4px',
                backgroundColor: c.color,
                marginRight: 1,
                border: '1px solid #ccc',
              }}
            />
            {c.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

const HighlightMenu = ({ editor, isDisabled = false }: { editor: Editor; isDisabled?: boolean }) => {
  const lang = useAtomValue(langStore);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const colors = [
    { name: 'Yellow', color: '#ffff00' },
    { name: 'Orange', color: '#ffc078' },
    { name: 'Green', color: '#8ce99a' },
    { name: 'Blue', color: '#74c0fc' },
    { name: 'Purple', color: '#b197fc' },
    { name: 'Red', color: 'red' },
  ];

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const unsetColor = () => {
    editor.chain().focus().unsetHighlight().run();
  };

  const handleSelect = (color: string) => {
    editor.chain().focus().toggleHighlight({ color }).run();
    setAnchorEl(null);
  };

  return (
    <>
      {/* 하이라이트 아이콘 버튼 */}
      <IconButton onClick={handleClick} size="small" disabled={isDisabled}>
        <FormatColorFillIcon />
      </IconButton>
      {/* 컬러 선택 메뉴 */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {/* 컬러 제거 */}
        <MenuItem onClick={unsetColor}>❌ {t('removeColor', lang)}</MenuItem>

        {colors.map(c => (
          <MenuItem
            key={c.color}
            onClick={() => handleSelect(c.color)}
            selected={editor.isActive('highlight', { color: c.color })}
          >
            <Box
              sx={{
                width: 18,
                height: 18,
                borderRadius: '4px',
                backgroundColor: c.color,
                marginRight: 1,
                border: '1px solid #ccc',
              }}
            />
            {c.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

const MenuBar = ({
  editor,
  isLightTool,
  pageId,
  pageType,
  postId,
  postTitle,
  content,
  isDisable = false,
}: {
  editor: Editor;
  isLightTool?: boolean;
  pageId?: string;
  pageType?: TPageContentType;

  postId?: string;
  postTitle?: string;
  content?: string;
  isDisable?: boolean;
}) => {
  const lang = useAtomValue(langStore);
  // Form-link 기능은 adapter.listForms 가 주입된 경우에만 노출 (postdle: 숨김)
  const { listForms } = useEditorAdapter();
  const showFormLink = !isLightTool && !!listForms;
  if (!editor) return null;

  const [imageOpen, setImageOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [formLinkOpen, setFormLinkOpen] = useState(false);
  const [htmlSourceOpen, setHtmlSourceOpen] = useState(false);
  const [htmlSourceCode, setHtmlSourceCode] = useState('');
  const [drawingOpen, setDrawingOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [moreAnchorEl, setMoreAnchorEl] = useState<null | HTMLElement>(null);
  const moreMenuOpen = Boolean(moreAnchorEl);

  const editorState = useEditorState({
    editor,
    selector: ctx => {
      return {
        isBold: ctx.editor.isActive('bold') ?? false,
        canBold: ctx.editor.can().chain().toggleBold().run() ?? false,
        isItalic: ctx.editor.isActive('italic') ?? false,
        canItalic: ctx.editor.can().chain().toggleItalic().run() ?? false,
        isStrike: ctx.editor.isActive('strike') ?? false,
        canStrike: ctx.editor.can().chain().toggleStrike().run() ?? false,
        isCode: ctx.editor.isActive('code') ?? false,
        canCode: ctx.editor.can().chain().toggleCode().run() ?? false,
        canClearMarks: ctx.editor.can().chain().unsetAllMarks().run() ?? false,
        isParagraph: ctx.editor.isActive('paragraph') ?? false,
        isBulletList: ctx.editor.isActive('bulletList') ?? false,
        isOrderedList: ctx.editor.isActive('orderedList') ?? false,
        isCodeBlock: ctx.editor.isActive('codeBlock') ?? false,
        isBlockquote: ctx.editor.isActive('blockquote') ?? false,
        isLink: ctx.editor.isActive('link') ?? false,
        canUndo: ctx.editor.can().chain().undo().run() ?? false,
        canRedo: ctx.editor.can().chain().redo().run() ?? false,
      };
    },
  });

  const addYoutubeVideo = () => {
    const url = prompt('Enter YouTube URL');
    if (url) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  };

  // Toolbar separator
  const Sep = () => <span className="toolbar-separator" />;

  return (
    <div className="control-group">
      <div className="button-group">
        {/* === Undo / Redo === */}
        <Tooltip title="Undo">
          <button onClick={() => editor.chain().focus().undo().run()} disabled={!editorState.canUndo || isDisable}>
            <Undo />
          </button>
        </Tooltip>
        <Tooltip title="Redo">
          <button onClick={() => editor.chain().focus().redo().run()} disabled={!editorState.canRedo || isDisable}>
            <Redo />
          </button>
        </Tooltip>

        <Sep />

        {/* === Heading / Font === */}
        {!isLightTool && <HeadingMenu editor={editor} isDisabled={isDisable} />}
        <FontSizeMenu editor={editor} isDisabled={isDisable} />

        <Sep />

        {/* === Text formatting === */}
        <Tooltip title="Bold">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editorState.canBold || isDisable}
            className={editorState.isBold ? 'is-active' : ''}
          >
            <FormatBoldIcon />
          </button>
        </Tooltip>
        <Tooltip title="Italic">
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editorState.canItalic || isDisable}
            className={editorState.isItalic ? 'is-active' : ''}
          >
            <FormatItalicIcon />
          </button>
        </Tooltip>
        <Tooltip title="Underline">
          <button
            disabled={isDisable}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'is-active' : ''}
          >
            <FormatUnderlinedIcon />
          </button>
        </Tooltip>
        <Tooltip title={t('editorStrikethrough', lang)}>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editorState.canStrike || isDisable}
            className={editorState.isStrike ? 'is-active' : ''}
          >
            <FormatStrikethroughIcon />
          </button>
        </Tooltip>
        {!isLightTool && (
          <Tooltip title="Code">
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              disabled={!editorState.canCode || isDisable}
              className={editorState.isCode ? 'is-active' : ''}
            >
              <CodeIcon />
            </button>
          </Tooltip>
        )}
        {!isLightTool && (
          <>
            <Tooltip title="Subscript">
              <button
                onClick={() => editor.chain().focus().toggleSubscript().run()}
                disabled={isDisable}
                className={editor.isActive('subscript') ? 'is-active' : ''}
              >
                <SubscriptIcon />
              </button>
            </Tooltip>
            <Tooltip title="Superscript">
              <button
                onClick={() => editor.chain().focus().toggleSuperscript().run()}
                disabled={isDisable}
                className={editor.isActive('superscript') ? 'is-active' : ''}
              >
                <SuperscriptIcon />
              </button>
            </Tooltip>
          </>
        )}

        <Sep />

        {/* === Colors === */}
        <HighlightMenu editor={editor} isDisabled={isDisable} />
        <TextColorMenu editor={editor} isDisabled={isDisable} />

        <Sep />

        {/* === Alignment === */}
        <Tooltip title="Align left">
          <button disabled={isDisable} onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}>
            <FormatAlignLeftIcon />
          </button>
        </Tooltip>
        <Tooltip title="Align center">
          <button disabled={isDisable} onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}>
            <FormatAlignCenterIcon />
          </button>
        </Tooltip>
        <Tooltip title="Align right">
          <button disabled={isDisable} onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}>
            <FormatAlignRightIcon />
          </button>
        </Tooltip>
        <Tooltip title="Justify">
          <button disabled={isDisable} onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}>
            <FormatAlignJustifyIcon />
          </button>
        </Tooltip>

        <Sep />

        {/* === Lists & Blocks === */}
        <Tooltip title="Bullet list">
          <button disabled={isDisable} onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editorState.isBulletList ? 'is-active' : ''}>
            <FormatListBulletedIcon />
          </button>
        </Tooltip>
        <Tooltip title="Numbered list">
          <button disabled={isDisable} onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editorState.isOrderedList ? 'is-active' : ''}>
            <FormatListNumberedIcon />
          </button>
        </Tooltip>
        {!isLightTool && (
          <Tooltip title={t('checklist', lang)}>
            <button disabled={isDisable} onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={editor.isActive('taskList') ? 'is-active' : ''}>
              <CheckBoxOutlinedIcon />
            </button>
          </Tooltip>
        )}
        {!isLightTool && (
          <Tooltip title={t('editorBlockquote', lang)}>
            <button disabled={isDisable} onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editorState.isBlockquote ? 'is-active' : ''}>
              <FormatQuoteIcon />
            </button>
          </Tooltip>
        )}
        {!isLightTool && (
          <Tooltip title="Code block">
            <button disabled={isDisable} onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={editorState.isCodeBlock ? 'is-active' : ''}>
              <span>{'</>'}</span>
            </button>
          </Tooltip>
        )}
        {!isLightTool && (
          <Tooltip title={t('editorHorizontalRule', lang)}>
            <button disabled={isDisable} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
              <HorizontalRuleIcon />
            </button>
          </Tooltip>
        )}

        <Sep />

        {/* === Insert === */}
        <Tooltip title={t('editorInsertLink', lang)}>
          <button disabled={isDisable} onClick={() => {
            if (editorState.isLink) {
              editor.chain().focus().unsetLink().run();
            } else {
              setLinkOpen(true);
            }
          }} className={editorState.isLink ? 'is-active' : ''}>
            {editorState.isLink ? <LinkOffIcon /> : <LinkIcon />}
          </button>
        </Tooltip>
        {showFormLink && (
          <Tooltip title={t('editorInsertFormLink', lang)}>
            <button disabled={isDisable} onClick={() => setFormLinkOpen(true)}>
              <AssignmentIcon />
            </button>
          </Tooltip>
        )}
        <Tooltip title="Image">
          <button disabled={isDisable} onClick={() => setImageOpen(true)}>
            <ImageIcon />
          </button>
        </Tooltip>
        <Tooltip title="YouTube">
          <button disabled={isDisable} onClick={addYoutubeVideo}>
            <YouTubeIcon />
          </button>
        </Tooltip>
        {!isLightTool && (
          <Tooltip title="HTML 소스 붙여넣기">
            <button disabled={isDisable} onClick={() => {
              setHtmlSourceCode(editor.getHTML());
              setHtmlSourceOpen(true);
            }}>
              <DataObjectIcon />
            </button>
          </Tooltip>
        )}
        {!isLightTool && <TableMenu editor={editor} isDisable={isDisable} />}

        <Sep />

        {/* === 추가 도구 (그리기, 계산기) === */}
        {!isLightTool && (
          <>
            <Tooltip title="추가 도구">
              <IconButton
                onClick={(e) => setMoreAnchorEl(e.currentTarget)}
                size="small"
                disabled={isDisable}
              >
                <MoreHorizIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={moreAnchorEl}
              open={moreMenuOpen}
              onClose={() => setMoreAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <MenuItem onClick={() => { setDrawingOpen(true); setMoreAnchorEl(null); }}>
                <BrushIcon sx={{ mr: 1, fontSize: 18, color: '#555' }} />
                그리기
              </MenuItem>
              <MenuItem onClick={() => { setCalcOpen(true); setMoreAnchorEl(null); }}>
                <CalculateIcon sx={{ mr: 1, fontSize: 18, color: '#555' }} />
                계산기
              </MenuItem>
            </Menu>
          </>
        )}
      </div>
      <div className="bottom">
        <AutoSave
          pageId={pageId ?? ''}
          postId={postId}
          content={content ?? ''}
          postTitle={postTitle ?? ''}
          pageType={pageType}
        />
      </div>

      <ImageModal open={imageOpen} onClose={() => setImageOpen(false)} editor={editor} />
      <LinkModal open={linkOpen} onClose={() => setLinkOpen(false)} editor={editor} />
      {showFormLink && <FormLinkModal open={formLinkOpen} onClose={() => setFormLinkOpen(false)} editor={editor} />}
      <DrawingCanvas open={drawingOpen} onClose={() => setDrawingOpen(false)} editor={editor} />
      <CalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} editor={editor} />

      {/* HTML Source Modal */}
      <Dialog
        open={htmlSourceOpen}
        onClose={() => setHtmlSourceOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '14px', fontWeight: 600 }}>
          HTML 소스 편집
        </DialogTitle>
        <DialogContent>
          <TextField
            multiline
            fullWidth
            minRows={12}
            maxRows={24}
            value={htmlSourceCode}
            onChange={(e) => setHtmlSourceCode(e.target.value)}
            placeholder="HTML 소스를 붙여넣으세요"
            sx={{
              mt: 1,
              '& .MuiInputBase-input': {
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: 1.6,
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHtmlSourceOpen(false)} size="small">
            취소
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              editor.commands.setContent(htmlSourceCode);
              setHtmlSourceOpen(false);
            }}
          >
            적용
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const PdfExportButton = ({ editorContent }: { editorContent: string }) => {
  const lang = useAtomValue(langStore);
  const [exporting, setExporting] = useState(false);

  const handleExportPdf = useCallback(async () => {
    if (exporting || !editorContent) return;
    setExporting(true);

    try {
      // Dynamically load html2pdf.js from CDN with SRI
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js';
      script.integrity = 'sha512-MpDFIChbcXl2QgipQrt1VcPHMldRILetapBEmc2sBMOsF2R3SHfBKadHBakKDn5AOCdn2r3E4Bstl06RMXzMpA==';
      script.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load PDF library'));
        if ((window as any).html2pdf) {
          resolve(); // Already loaded
        } else {
          document.head.appendChild(script);
        }
      });

      const html2pdf = (window as any).html2pdf;
      if (!html2pdf) throw new Error('PDF library not available');

      // Create a styled container for PDF rendering (sanitized to prevent XSS)
      const container = document.createElement('div');
      container.innerHTML = DOMPurify.sanitize(editorContent);
      container.style.cssText = `
        font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 15px;
        line-height: 1.8;
        color: #1a1a1a;
        padding: 0;
        max-width: 100%;
      `;

      // Style headings
      container.querySelectorAll('h1').forEach((el: any) => {
        el.style.cssText = 'font-size:2rem;font-weight:800;margin:2rem 0 0.8rem;line-height:1.3;color:#111;border-bottom:2px solid #e2e8f0;padding-bottom:0.4rem;';
      });
      container.querySelectorAll('h2').forEach((el: any) => {
        el.style.cssText = 'font-size:1.5rem;font-weight:700;margin:1.5rem 0 0.6rem;line-height:1.35;color:#1a1a2e;';
      });
      container.querySelectorAll('h3').forEach((el: any) => {
        el.style.cssText = 'font-size:1.25rem;font-weight:600;margin:1.2rem 0 0.5rem;color:#2d3748;';
      });
      container.querySelectorAll('blockquote').forEach((el: any) => {
        el.style.cssText = 'border-left:4px solid #3b82f6;background:#f8fafc;padding:12px 20px;margin:1em 0;border-radius:0 8px 8px 0;color:#475569;font-style:italic;';
      });
      container.querySelectorAll('table').forEach((el: any) => {
        el.style.cssText = 'border-collapse:collapse;width:100%;margin:1em 0;';
      });
      container.querySelectorAll('td, th').forEach((el: any) => {
        el.style.cssText = 'border:1px solid #e2e8f0;padding:8px 12px;';
      });
      container.querySelectorAll('th').forEach((el: any) => {
        el.style.background = '#f1f5f9';
        el.style.fontWeight = '600';
      });
      container.querySelectorAll('pre').forEach((el: any) => {
        el.style.cssText = 'background:#1e293b;color:#fff;padding:14px 18px;border-radius:8px;font-size:0.85em;overflow-x:auto;';
      });
      container.querySelectorAll('img').forEach((el: any) => {
        el.style.maxWidth = '100%';
      });

      const opt = {
        margin: [20, 20, 20, 20],
        filename: `pagedle-document-${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await html2pdf().set(opt).from(container).save();
    } catch (err) {
      console.error('PDF export error:', err);
      alert(t('pdfExportError', lang));
    } finally {
      setExporting(false);
    }
  }, [editorContent, exporting, lang]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, px: '4px' }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<PictureAsPdfIcon />}
        onClick={handleExportPdf}
        disabled={exporting || !editorContent}
        sx={{
          textTransform: 'none',
          fontSize: '13px',
          fontWeight: 600,
          borderRadius: '8px',
          borderColor: '#e2e8f0',
          color: '#475569',
          '&:hover': {
            borderColor: '#3b82f6',
            color: '#3b82f6',
            background: '#f0f7ff',
          },
        }}
      >
        {exporting ? t('pdfExporting', lang) : t('pdfExport', lang)}
      </Button>
    </Box>
  );
};

const MdEditor = ({
  value,
  setContent,
  isEdit = true,
  isLightTool = false,
  pageId,
  pageType,
  postId,
  postTitle,
  isPost = false,
  isDisable = false,
  isFullWidth = false,
  category,
  placeholder,
}: {
  value: string;
  setContent?: (value: string) => void;
  isEdit?: boolean;
  isLightTool?: boolean;
  pageId?: string;
  pageType?: TPageContentType;
  postId?: string;
  postTitle?: string;
  isPost?: boolean;
  isDisable?: boolean;
  isFullWidth?: boolean;
  category?: string;
  /** 전달 시 i18n 기본 문구 대신 사용 (공유 패키지 공개 API) */
  placeholder?: string;
}) => {
  const lang = useAtomValue(langStore);
  const extensions = [
    StarterKit,
    TextAlign.configure({
      types: ['paragraph', 'heading'],
    }),
    TextStyleKit,
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    }),
    Subscript,
    Superscript,
    Image,
    Youtube.configure({
      controls: false,
      nocookie: true,
    }),
    Color.configure({
      types: ['textStyle'],
    }),
    Highlight.configure({
      multicolor: true, // 여러 색 지원!
    }),
    Markdown.configure({
      transformPastedText: true, // ⬅️ 핵심: 붙여넣기 자동 변환
    }),
    FontSize,
    Placeholder.configure({
      placeholder: placeholder ?? (isPost ? t('newPostPlaceholder', lang) : t('newPagePlaceholder', lang)),
      showOnlyWhenEditable: false,
    }),
    TableKit.configure({
      table: { resizable: true },
    }),
    CustomTableCell,
    // CustomDocument,
    // Paragraph,
    TaskList,
    TaskItem.configure({
      nested: true, // 하위 체크리스트 허용
      HTMLAttributes: {
        class: 'task-item',
      },
    }),
    // Text,
    // TaskList,
    // CustomTaskItem,
  ];

  const [isPreview, setIsPreview] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    shouldRerenderOnTransaction: true,

    onUpdate: ({ editor }) => {
      if (!setContent) {
        return;
      }
      // HTML 기반 값 저장
      const html = editor.getHTML();
      setContent(html);
    },
    content: value,
    editable: isDisable ? false : isEdit,
  });

  // Determine if editor should be editable
  // Editable only when: not disabled AND is edit mode AND not in preview mode
  const isEditable = !isDisable && isEdit && !isPreview;

  useEffect(() => {
    editor?.setEditable(isEditable);
  }, [isDisable, isEdit, editor, isPreview, isEditable]);

  // 온보딩 템플릿 자동 적용 (빈 페이지 최초 진입 시)
  useEffect(() => {
    if (!editor || !isEdit) return;

    // 콘텐츠가 비어있을 때만 템플릿 적용
    const currentText = editor.getText().trim();
    if (currentText.length > 0) return;

    const template = consumePendingTemplate();
    if (template) {
      editor.commands.setContent(template);
      if (setContent) setContent(template);
    }
  }, [editor, isEdit]);

  useEffect(() => {
    if (!editor) return;

    if (!value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return <></>;

  return (
    <>
      <MdWrap
        className={`editor-container ${isEdit ? (isPreview ? 'view' : '') : 'view edit-false'} ${
          isPost || postId ? 'post' : ''
        }
        ${isFullWidth ? 'fullwidth' : ''}
        ${category === 'pagedle' ? 'pagedle-mode' : ''}
        `}
      >
        {isEdit && !isPreview && (
          <MenuBar
            editor={editor}
            isLightTool={isLightTool}
            postId={postId}
            pageId={pageId}
            postTitle={postTitle}
            content={value}
            isDisable={isDisable}
            pageType={pageType}
          />
        )}
        <EditorContent editor={editor} className={`editor-content `} />
      </MdWrap>
      {isEdit && (
        <>
          <Suspense fallback={null}>
            <WritingTools
              content={value}
              onContentUpdate={(updatedContent) => {
                if (setContent) {
                  setContent(updatedContent);
                  editor?.commands.setContent(updatedContent);
                }
              }}
            />
          </Suspense>
          <PdfExportButton editorContent={value} />
          <PreviewButton
            onClick={() => {
              setIsPreview(!isPreview);
            }}
          >
            {isPreview ? t('editMode', lang) : t('previewMode', lang)}
          </PreviewButton>
        </>
      )}
    </>
  );
};

export default MdEditor;
