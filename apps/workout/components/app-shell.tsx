'use client';

/**
 * 운동 앱의 클라이언트 진입점. 탭(근육 지도 / 운동 기록)을 나누고, 기록 상태(use-workout)를 한곳에서 들고 있다.
 * 그래서 지도 탭으로 갔다 와도 타이머와 진행 중인 운동이 그대로다.
 *
 * guest(읽기 전용으로 들어온 사람)는 근육 지도만 보인다. 기록 화면은 아예 그리지 않고, 우측 상단에 로그인 버튼이 뜬다.
 *
 * 가볍게 열리도록, 기록 화면이 아닌 것은 늦게 불러온다(next/dynamic):
 *  - 근육 지도(그림 경로 데이터 포함): 지도 탭을 처음 열 때
 *  - 운동 가이드 시트: ? 를 처음 누를 때
 */
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@/lib/calc';
import { MAP_ENTRIES, type Part } from '@/lib/exercises';
import Logger from './logger';
import { useOverlays } from './use-overlays';
import { useWorkout, type PrevInfo } from './use-workout';
import type { Tab } from './top-bar';

const MuscleMapView = dynamic(() => import('./muscle-map-view'), { loading: () => <p className="lead wrap">근육 지도를 불러오는 중…</p> });
const HelpSheet = dynamic(() => import('./help-sheet'));

const TAB_KEY = 'workout-tab';
const MAP_KEY = 'workout-map-entry';
/** 지도의 처음 항목: 하체 첫 종목 (목록 0번은 "하체 데이 전체") */
const DEFAULT_ENTRY = MAP_ENTRIES[1]!.key;

export default function AppShell({ serverDraft, prevByPart, guest = false }: { serverDraft: Session | null; prevByPart: Record<Part, PrevInfo>; guest?: boolean }) {
  const overlays = useOverlays();
  const w = useWorkout({ serverDraft, prevByPart, ui: overlays });
  const [tab, setTab] = useState<Tab>(guest ? 'map' : 'log');
  const [mapEntry, setMapEntry] = useState(DEFAULT_ENTRY);
  const [help, setHelp] = useState(false);

  // 마지막으로 보던 탭·지도 항목을 기기에서 복원. 운동 중이면 항상 기록 탭.
  useEffect(() => {
    if (!w.ready) return;
    try {
      const t = localStorage.getItem(TAB_KEY);
      const m = localStorage.getItem(MAP_KEY);
      if (m && MAP_ENTRIES.some((e) => e.key === m)) setMapEntry(m);
      if (!guest && (!w.S || w.S.saved)) setTab(t === 'map' ? 'map' : 'log');
    } catch {
      /* 저장소가 막혀 있으면 기본값 */
    }
    // 처음 준비됐을 때 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w.ready]);

  const changeTab = useCallback((t: Tab) => {
    setTab(t);
    try {
      localStorage.setItem(TAB_KEY, t);
    } catch {}
  }, []);
  const changeEntry = useCallback((k: string) => {
    setMapEntry(k);
    try {
      localStorage.setItem(MAP_KEY, k);
    } catch {}
  }, []);

  if (!w.ready) return <div className="wrap" aria-busy="true" />;

  const onHelp = () => setHelp(true);
  return (
    <>
      {tab === 'map' || guest ? (
        <MuscleMapView tab={tab} onTab={changeTab} onHelp={onHelp} entryKey={mapEntry} onEntry={changeEntry} guest={guest} />
      ) : (
        <Logger
          w={w}
          tab={tab}
          onTab={changeTab}
          onHelp={onHelp}
          onMap={(name) => {
            changeEntry(name);
            changeTab('map');
            window.scrollTo(0, 0);
          }}
        />
      )}
      {help && <HelpSheet onClose={() => setHelp(false)} />}
      {overlays.node}
    </>
  );
}
