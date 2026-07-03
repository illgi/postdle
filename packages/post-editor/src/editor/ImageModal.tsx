import { langStore } from './_shims/common';
import { t } from './_shims/i18n';
import { useAtomValue } from 'jotai';

import { useEditorAdapter } from './adapter';
import { layout } from './_shims/mixin';
import styled from '@emotion/styled';
import { Box, Button, Dialog, DialogContent, Tab, Tabs } from '@mui/material';
import type { Editor } from '@tiptap/react';
import React, { useEffect, useState } from 'react';

const Wrap = styled.div`
  .input-field {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
  }
  .input-field::placeholder {
    color: #aaa;
  }

  @media ${layout.$breakpointMobile} {
  }
`;

export const StyledTabs = styled(Tabs)`
  min-height: 0;
  padding: 4px;
  border-radius: 0.5rem;

  .MuiTabs-flexContainer {
    gap: 4px;
  }

  .MuiTabs-indicator {
    background-color: var(--blue);
  }
`;

export const StyledTab = styled(Tab)`
  min-height: 0;
  padding: 8px 12px;
  border-radius: 0.5rem;
  border: none;
  color: var(--black);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.15;
  text-transform: none;
  min-width: auto;
  transition: all 0.2s cubic-bezier(0.65, 0.05, 0.36, 1);

  &.Mui-selected {
    color: var(--black);
  }
`;

type TImageModalProps = {
  open: boolean;
  onClose: () => void;
  editor: Editor;
};

export const ImageModal = ({ open, onClose, editor }: TImageModalProps) => {
  const lang = useAtomValue(langStore);
  // 원본 pagedle의 useSnackbarHook.openAlert 대체 (공유 패키지는 앱 스낵바에 결합하지 않음)
  const openAlert = (msg: string) => {
    if (typeof window !== 'undefined') window.alert(msg);
  };
  // 원본 pagedle의 useFileUploadMutate 대체 — EditorAdapter.onImageUpload 로 주입
  const { onImageUpload } = useEditorAdapter();

  const [tab, setTab] = useState(0);
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setTab(0);
    setUrl('');
    setFile(null);
  }, [open]);

  const handleInsertUrl = () => {
    if (!url) return openAlert('URL을 입력하세요.');
    editor.chain().focus().setImage({ src: url }).run();
    onClose();
  };

  const handleInsertFile = async () => {
    if (!file) return openAlert('이미지를 선택하세요.');

    if (!file.type.startsWith('image/')) {
      return openAlert('이미지 파일만 업로드할 수 있습니다.');
    }

    if (file.size > 20 * 1024 * 1024) {
      return openAlert('파일 크기는 20MB 이하만 가능합니다.');
    }

    if (!onImageUpload) {
      openAlert('이미지 업로드가 설정되지 않았습니다.');

      return;
    }

    try {
      setUploading(true);
      const uploadedUrl = await onImageUpload(file);

      setUploading(false);
      if (!uploadedUrl) {
        openAlert('업로드 실패');

        return;
      }

      editor.chain().focus().setImage({ src: uploadedUrl }).run();
      onClose();
    } catch {
      setUploading(false);
      openAlert('이미지 업로드 중 오류가 발생했습니다.');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            maxWidth: '400px', // 원하는 px로 커스텀
            width: '100%', // 반응형 유지
            borderRadius: '16px',
          },
        },
      }}
    >
      <DialogContent
        sx={{
          '.sub': {
            marginBottom: '24px',
            textAlign: 'center',
          },
        }}
      >
        <Wrap>
          <p className="sub" style={{ fontWeight: 'bold' }}>
            이미지 삽입
          </p>
          <StyledTabs
            value={tab}
            onChange={(_, v) => {
              setTab(v);
              setUrl('');
              setFile(null);
            }}
          >
            <StyledTab label={t('urlInput', lang)} />
            <StyledTab label={t('fileUpload', lang)} />
          </StyledTabs>
          <Box display="flex" flexDirection={'column'} gap="15px" marginBottom={'25px'} paddingTop={'16px'}>
            {tab === 0 && (
              <input
                type="text"
                placeholder={t('imageUrlPlaceholder', lang)}
                className="input-field"
                value={url}
                onChange={e => {
                  setUrl(e.target.value);
                }}
                disabled={false}
              />
            )}

            {tab === 1 && (
              <input
                type="file"
                className="input-field"
                accept="image/*"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
            )}
          </Box>
          <Box display="flex" justifyContent="center" gap="10px" flexDirection={'column'}>
            {tab === 0 ? (
              <Button
                variant="contained"
                onClick={handleInsertUrl}
                disabled={!url && !file}
                sx={{ borderRadius: '8px', padding: '8px 24px', fontSize: '16px !important' }}
              >
                삽입
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleInsertFile}
                disabled={uploading}
                sx={{ borderRadius: '8px', padding: '8px 24px', fontSize: '16px !important' }}
              >
                {uploading ? '업로드 중...' : '삽입'}
              </Button>
            )}

            <Button
              onClick={() => {
                onClose();
              }}
              sx={{
                color: '#888',
                fontSize: '16px !important',
              }}
            >
              취소
            </Button>
          </Box>
        </Wrap>
      </DialogContent>
    </Dialog>
  );
};
