import { DATE_FORMAT } from './_shims/date';

import { TPageContentType } from './_shims/commonCode';

import { useEditorAdapter } from './adapter';
import { langStore } from './_shims/common';
import { t } from './_shims/i18n';
import { layout } from './_shims/mixin';
import styled from '@emotion/styled';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';

const Wrap = styled.div`
  font-size: 12px;
  color: var(--gray-5);

  .none {
    color: var(--white);
  }
  @media ${layout.$breakpointMobile} {
  }
`;

type TAutoSave = {
  pageId: string;
  postId?: string;
  postTitle?: string;
  content: string;
  pageType?: TPageContentType;
};

/**
content 변경
  ↓
throttle 타이머 시작 (30초)
  ↓
저장 시점
  ↓
lastSavedContent 비교
  ↓
같으면 return
  ↓
다르면 adapter.onAutoSave 호출

원본 pagedle는 react-query 뮤테이션(useUpdatePage/PostMutation)으로 저장했으나,
공유 패키지는 백엔드 결합을 EditorAdapter.onAutoSave 로 주입받아 처리한다.
adapter.onAutoSave 가 없으면 아무것도 렌더링하지 않는다(AutoSave off).
 */
const AutoSave = ({ pageId, postId, postTitle, content, pageType }: TAutoSave) => {
  const lang = useAtomValue(langStore);
  const { onAutoSave } = useEditorAdapter();
  const [nowDate, setNowDate] = useState<Date | undefined>();

  const showDateFormat = (value?: Date | string) => {
    if (!value) return '';

    return dayjs(value).format(DATE_FORMAT.formatYYYYMMDDHHmmss);
  };

  const THROTTLE_TIME = 30_000; // 30초

  // 최신 content를 항상 들고 있는 ref
  const latestContentRef = useRef(content);
  const lastSavedContentRef = useRef<string | null>(null);

  // throttle 타이머 ref
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 최신 콜백을 항상 참조 (deps 변화로 인한 타이머 재시작 방지)
  const onAutoSaveRef = useRef(onAutoSave);
  useEffect(() => {
    onAutoSaveRef.current = onAutoSave;
  }, [onAutoSave]);

  useEffect(() => {
    if (!onAutoSaveRef.current) return;

    latestContentRef.current = content;

    // 이미 타이머가 돌고 있으면 아무것도 안 함
    if (throttleTimerRef.current) return;

    throttleTimerRef.current = setTimeout(() => {
      const latestContent = latestContentRef.current;

      // 🔴 여기서 비교
      if (lastSavedContentRef.current === latestContent) {
        throttleTimerRef.current = null;

        return;
      }

      onAutoSaveRef.current?.(latestContent);
      lastSavedContentRef.current = latestContent; // 🔴 저장 완료 시 갱신
      setNowDate(new Date());

      // 다음 throttle 주기를 위해 초기화
      throttleTimerRef.current = null;
    }, THROTTLE_TIME);

    return () => {
      // cleanup은 타이머 취소하지 않음 (throttle 유지)
    };
  }, [content, postTitle, pageId, postId, pageType]);

  useEffect(() => {
    return () => {
      if (throttleTimerRef.current) {
        // Save pending changes on unmount
        clearTimeout(throttleTimerRef.current);
        const latestContent = latestContentRef.current;

        if (lastSavedContentRef.current !== latestContent) {
          onAutoSaveRef.current?.(latestContent);
        }

        throttleTimerRef.current = null;
      }
    };
  }, [pageId, postId, postTitle, pageType]);

  // adapter.onAutoSave 미주입 시 렌더링하지 않음
  if (!onAutoSave) return null;

  // 처음 자동 저장 전에는 아무것도 렌더링 안 함
  return (
    <Wrap>
      {!nowDate || (!pageId && !postId) ? (
        <div className="none">-</div>
      ) : (
        <>{t('autoSaveTime', lang)}: {showDateFormat(nowDate)}</>
      )}
    </Wrap>
  );
};

export default AutoSave;
