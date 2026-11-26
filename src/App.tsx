import { useCallback, useEffect, useRef, useState } from 'react';
import { encryptedData } from 'virtual:encrypted-data';
import { useI18n } from './i18n/I18nProvider';
import { Login } from './components/Login';
import { Home } from './components/Home';
import { ExamsPage } from './components/ExamsPage';
import { TechniqueManager } from './components/TechniqueManager';
import { Placeholder } from './components/Placeholder';
import { Profile } from './components/Profile';
import type { AppRoute } from './components/NavigationMenu';
import type { ExamData, ExamEvent, Examiner, Tag, Technique } from './lib/types';
import { clearFailedLogins } from './lib/lockout';
import { decryptWithKey, exportKey, importSessionKey, unlockData } from './lib/crypto';
import { localDateString } from './lib/random';
import { loadSecureValue, saveSecureValue } from './lib/secureStorage';
import { mergeByModificationDate } from './lib/dataStore';

const SESSION_KEY = 'km-exam:session-key';
const LOCAL_DATA_KEY = 'km-exam:v2:local-data';
const EVENTS_KEY = 'km-exam:v2:events';

function mergeData(bundle: ExamData, local: Partial<ExamData> | null): ExamData {
  return {
    techniques: mergeByModificationDate(bundle.techniques, local?.techniques ?? []),
    tags: mergeByModificationDate(bundle.tags, local?.tags ?? []),
    examiners: mergeByModificationDate(bundle.examiners, local?.examiners ?? []),
    generalTasks: [],
  };
}

export default function App() {
  const { t } = useI18n();
  const [data, setData] = useState<ExamData | null>(null);
  const [events, setEvents] = useState<ExamEvent[]>([]);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [examinerId, setExaminerId] = useState<string | null>(null);
  const [route, setRoute] = useState<AppRoute>('home');
  const [checkingSession, setCheckingSession] = useState(true);
  const [readyToPersist, setReadyToPersist] = useState(false);
  const persistQueue = useRef(Promise.resolve());

  const enterApp = useCallback(async (unlockedData: ExamData, key: CryptoKey, nextExaminerId: string) => {
    const localData = await loadSecureValue<Partial<ExamData>>(LOCAL_DATA_KEY, key);
    const mergedData = mergeData(unlockedData, localData);
    const activeExaminer = mergedData.examiners.find((item) => item.id === nextExaminerId);
    if (!activeExaminer) throw new Error('Das Prüferprofil ist nicht mehr verfügbar.');
    const savedEvents = await loadSecureValue<ExamEvent[]>(EVENTS_KEY, key);
    setData(mergedData);
    setEvents(Array.isArray(savedEvents) ? savedEvents : []);
    setCryptoKey(key);
    setExaminerId(activeExaminer.id);
    setRoute('home');
    setReadyToPersist(true);
  }, []);

  const lockApp = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setReadyToPersist(false);
    setData(null);
    setEvents([]);
    setCryptoKey(null);
    setExaminerId(null);
    setRoute('home');
  }, []);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      try {
        const serialized = sessionStorage.getItem(SESSION_KEY);
        if (!serialized) return;
        const stored = JSON.parse(serialized) as { key?: unknown; date?: unknown; examinerId?: unknown };
        const date = localDateString();
        if (typeof stored.key !== 'string' || typeof stored.examinerId !== 'string' || stored.date !== date) {
          sessionStorage.removeItem(SESSION_KEY);
          return;
        }
        const key = await importSessionKey(stored.key);
        const unlockedData = await decryptWithKey(key, encryptedData);
        if (active && localDateString() === date) await enterApp(unlockedData, key, stored.examinerId);
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      } finally {
        if (active) setCheckingSession(false);
      }
    }
    void restoreSession();
    return () => { active = false; };
  }, [enterApp]);

  const unlock = useCallback(async (email: string, password: string) => {
    const { data: unlockedData, key } = await unlockData(password, encryptedData);
    const localData = await loadSecureValue<Partial<ExamData>>(LOCAL_DATA_KEY, key);
    const mergedData = mergeData(unlockedData, localData);
    const examiner = mergedData.examiners.find((item) => item.email.trim().toLocaleLowerCase() === email.trim().toLocaleLowerCase());
    if (!examiner) throw new Error('Login failed.');
    const date = localDateString();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ key: await exportKey(key), date, examinerId: examiner.id }));
    clearFailedLogins();
    await enterApp(unlockedData, key, examiner.id);
  }, [enterApp]);

  useEffect(() => {
    if (!data || !cryptoKey || !readyToPersist) return;
    const snapshotData = data;
    const snapshotEvents = events;
    persistQueue.current = persistQueue.current.then(async () => {
      await Promise.all([
        saveSecureValue(LOCAL_DATA_KEY, snapshotData, cryptoKey),
        saveSecureValue(EVENTS_KEY, snapshotEvents, cryptoKey),
      ]);
    }).catch(() => undefined);
  }, [cryptoKey, data, events, readyToPersist]);

  useEffect(() => {
    if (!examinerId) return;
    const expectedDate = localDateString();
    let timeout = 0;
    const checkDate = () => {
      if (localDateString() !== expectedDate) lockApp();
    };
    timeout = window.setTimeout(checkDate, Math.max(1000, new Date().setHours(24, 0, 0, 0) - Date.now()));
    window.addEventListener('focus', checkDate);
    document.addEventListener('visibilitychange', checkDate);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('focus', checkDate);
      document.removeEventListener('visibilitychange', checkDate);
    };
  }, [examinerId, lockApp]);

  if (checkingSession) return <main className="p-8 text-center text-slate-300">{t('app.loading')}</main>;
  if (!data || !examinerId || !cryptoKey) return <Login onUnlock={unlock} />;
  const examiner = data.examiners.find((item) => item.id === examinerId);
  if (!examiner) {
    lockApp();
    return <Login onUnlock={unlock} />;
  }

  const navigate = (nextRoute: AppRoute) => setRoute(nextRoute);
  const saveItem = (item: Technique) => setData((current) => current ? ({ ...current, techniques: current.techniques.some((existing) => existing.id === item.id) ? current.techniques.map((existing) => existing.id === item.id ? item : existing) : [...current.techniques, item] }) : current);
  const saveTag = (tag: Tag) => setData((current) => current ? ({ ...current, tags: current.tags.some((existing) => existing.id === tag.id) ? current.tags.map((existing) => existing.id === tag.id ? tag : existing) : [...current.tags, tag] }) : current);
  const saveExaminer = (updated: Examiner) => setData((current) => current ? ({ ...current, examiners: current.examiners.map((item) => item.id === updated.id ? updated : item) }) : current);

  if (route === 'home') return <Home activeRoute="home" examinerShortcode={examiner.shortcode} onLock={lockApp} onNavigate={navigate} />;
  if (route === 'exams') return <ExamsPage events={events} examiners={data.examiners} techniques={data.techniques} examiner={examiner} onEventsChange={setEvents} onLock={lockApp} onNavigate={navigate} />;
  if (route === 'techniques') return <TechniqueManager activeRoute="techniques" items={data.techniques} tags={data.tags} onLock={lockApp} onNavigate={navigate} onSaveItem={saveItem} onSaveTag={saveTag} />;
  if (route === 'profile') return <Profile examiner={examiner} examiners={data.examiners} onLock={lockApp} onNavigate={navigate} onSave={saveExaminer} />;
  return <Placeholder route={route} onLock={lockApp} onNavigate={navigate} />;
}