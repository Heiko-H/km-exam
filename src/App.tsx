import { useCallback, useEffect, useState } from 'react';
import { encryptedData } from 'virtual:encrypted-data';
import { Exam } from './components/Exam';
import { Login } from './components/Login';
import { Preparation } from './components/Preparation';
import { GeneralExamList } from './components/GeneralExamList';
import { GeneralExamEditor } from './components/GeneralExamEditor';
import { GeneralExamRun } from './components/GeneralExamRun';
import { TechniqueManager } from './components/TechniqueManager';
import { Placeholder } from './components/Placeholder';
import { Home } from './components/Home';
import type { AppRoute } from './components/NavigationMenu';
import { clearFailedLogins } from './lib/lockout';
import { exportKey, importSessionKey, decryptWithKey, unlockData } from './lib/crypto';
import { levelOf, localDateString, selectTechniques } from './lib/random';
import { clearActiveExam, defaultPreparationSettings, loadActiveExam, loadPreparationSettings, saveActiveExam, savePreparationSettings } from './lib/storage';
import type { ExamData, ExamSession, ExamTask, GeneralExam, GeneralTask, PreparationSettings, Tag, Technique } from './lib/types';
import { useI18n } from './i18n/I18nProvider';
import { loadSecureValue, saveSecureValue } from './lib/secureStorage';
import { mergeByModificationDate } from './lib/dataStore';

const SESSION_KEY = 'km-exam:session-key';
const ACTIVE_KIND_KEY = 'km-exam:active-kind';
const LOCAL_DATA_KEY = 'km-exam:local-data';
const GENERAL_EXAMS_KEY = 'km-exam:general-exams';

export default function App() {
  const { t } = useI18n();
  const [data, setData] = useState<ExamData | null>(null);
  const [settings, setSettings] = useState<PreparationSettings | null>(null);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [generalExams, setGeneralExams] = useState<GeneralExam[]>([]);
  const [route, setRoute] = useState<AppRoute>('home');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<GeneralExam | null>(null);
  const [pendingRun, setPendingRun] = useState<GeneralExam | null>(null);
  const [authenticatedDate, setAuthenticatedDate] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const enterApp = useCallback(async (unlockedData: ExamData, key: CryptoKey, restoreExistingSession: boolean, date: string) => {
    const localData = await loadSecureValue<Partial<ExamData>>(LOCAL_DATA_KEY, key);
    const mergedData: ExamData = {
      techniques: mergeByModificationDate(unlockedData.techniques, localData?.techniques ?? []),
      generalTasks: mergeByModificationDate(unlockedData.generalTasks, localData?.generalTasks ?? []),
      tags: mergeByModificationDate(unlockedData.tags, localData?.tags ?? []),
    };
    const savedGeneralExams = await loadSecureValue<GeneralExam[]>(GENERAL_EXAMS_KEY, key);
    setData(mergedData);
    setCryptoKey(key);
    setGeneralExams(Array.isArray(savedGeneralExams) ? savedGeneralExams : []);
    setAuthenticatedDate(date);
    if (restoreExistingSession) {
      setSettings(loadPreparationSettings(mergedData.techniques, mergedData.generalTasks));
      const activeKind = sessionStorage.getItem(ACTIVE_KIND_KEY);
      const generalSession = loadActiveExam('general');
      const randomSession = loadActiveExam('random');
      const restored = activeKind === 'general' ? generalSession ?? randomSession : activeKind === 'random' ? randomSession ?? generalSession : randomSession ?? generalSession;
      setSession(restored);
      setRoute(restored ? (restored.kind === 'general' ? 'general' : 'random') : 'home');
    } else {
      clearActiveExam();
      sessionStorage.removeItem(ACTIVE_KIND_KEY);
      const defaults = defaultPreparationSettings(mergedData.generalTasks);
      setSettings(defaults);
      savePreparationSettings(defaults);
      setSession(null);
      setRoute('home');
    }
  }, []);

  const lockApp = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthenticatedDate(null);
    setData(null);
    setSettings(null);
    setSession(null);
    setCryptoKey(null);
    setEditorOpen(false);
    setPendingRun(null);
  }, []);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      try {
        const encodedKey = sessionStorage.getItem(SESSION_KEY);
        if (encodedKey) {
          const storedSession = JSON.parse(encodedKey) as { key?: unknown; date?: unknown };
          const date = localDateString();
          if (typeof storedSession.key !== 'string' || storedSession.date !== date) {
            sessionStorage.removeItem(SESSION_KEY);
            return;
          }
          const key = await importSessionKey(storedSession.key);
          const unlockedData = await decryptWithKey(key, encryptedData);
          if (active) {
            if (localDateString() === date) await enterApp(unlockedData, key, true, date);
            else sessionStorage.removeItem(SESSION_KEY);
          }
        }
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      } finally {
        if (active) setCheckingSession(false);
      }
    }
    void restoreSession();
    return () => { active = false; };
  }, [enterApp]);

  useEffect(() => {
    if (!authenticatedDate) return;

    const checkDate = () => {
      if (localDateString() !== authenticatedDate) lockApp();
    };
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeoutId = window.setTimeout(checkDate, midnight.getTime() - now.getTime());
    window.addEventListener('focus', checkDate);
    document.addEventListener('visibilitychange', checkDate);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('focus', checkDate);
      document.removeEventListener('visibilitychange', checkDate);
    };
  }, [authenticatedDate, lockApp]);

  async function unlock(password: string) {
    const result = await unlockData(password, encryptedData);
    const date = localDateString();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ key: await exportKey(result.key), date }));
    clearFailedLogins();
    await enterApp(result.data, result.key, false, date);
  }

  function updateSettings(next: PreparationSettings) {
    setSettings(next);
    savePreparationSettings(next);
  }

  function navigate(nextRoute: AppRoute) {
    setRoute(nextRoute);
    setEditorOpen(false);
    setPendingRun(null);
  }

  function persistData(next: ExamData) {
    setData(next);
    if (cryptoKey) void saveSecureValue(LOCAL_DATA_KEY, next, cryptoKey);
  }

  function persistGeneralExams(next: GeneralExam[]) {
    setGeneralExams(next);
    if (cryptoKey) void saveSecureValue(GENERAL_EXAMS_KEY, next, cryptoKey);
  }

  function editTechnique(item: Technique) {
    if (!data) return;
    const changed = { ...item, modification_date: item.modification_date || new Date().toISOString() };
    const techniques = data.techniques.filter((current) => current.id !== changed.id);
    const generalTasks = data.generalTasks.filter((current) => current.id !== changed.id);
    if (changed.category === 'general') {
      const { level: _level, ...generalTask } = changed;
      generalTasks.push(generalTask as GeneralTask);
    } else {
      const level = levelOf(changed);
      techniques.push({ ...changed, level });
    }
    persistData({ ...data, techniques, generalTasks });
  }

  function editTag(tag: Tag) {
    if (!data) return;
    const tags = [...data.tags.filter((current) => current.id !== tag.id), tag];
    persistData({ ...data, tags });
  }

  function saveGeneralExam(exam: GeneralExam) {
    persistGeneralExams([...generalExams.filter((current) => current.id !== exam.id), exam]);
    setEditorOpen(false);
    setEditingExam(null);
    setRoute('general');
  }

  function startGeneralExam(exam: GeneralExam, candidateName: string) {
    if (!data) return;
    const editableItems: Technique[] = [
      ...data.techniques,
      ...data.generalTasks.map((task) => ({ ...task, category: 'general' as const })),
    ];
    const itemMap = new Map(editableItems.map((item) => [item.id, item]));
    const tasks = exam.techniqueIds.map((id) => itemMap.get(id)).filter((item): item is Technique => Boolean(item)).map(makeTechniqueTask);
    if (tasks.length === 0) return;
    const nextSession: ExamSession = {
      firstName: candidateName,
      lastName: '',
      candidateName,
      kind: 'general',
      examName: exam.name,
      level: exam.level,
      candidateCount: 1,
      date: exam.date ?? localDateString(),
      tasks,
      generalNote: '',
      examId: exam.id,
    };
    sessionStorage.setItem(ACTIVE_KIND_KEY, 'general');
    saveActiveExam(nextSession);
    setSession(nextSession);
    setPendingRun(null);
    setRoute('general');
  }

  async function startExam() {
    if (!settings || !data) return;
    const date = localDateString();
    let chosenTechniques;
    try {
      chosenTechniques = await selectTechniques(data.techniques, settings.techniqueCounts, {
        firstName: settings.firstName,
        lastName: settings.lastName,
        level: settings.level,
        candidateCount: settings.candidateCount,
        date,
      });
    } catch {
      throw new Error(t('preparation.startError'));
    }
    const beforeTasks = data.generalTasks
      .filter((task) => settings.generalTaskPlacements[task.id] === 'before')
      .map((task) => makeGeneralTask(task));
    const afterTasks = data.generalTasks
      .filter((task) => settings.generalTaskPlacements[task.id] === 'after')
      .map((task) => makeGeneralTask(task));
    const techniqueTasks = chosenTechniques.map(makeTechniqueTask);
    const tasks = [...beforeTasks, ...techniqueTasks, ...afterTasks];
    if (tasks.length === 0) throw new Error(t('preparation.noTasksError'));

    const nextSession: ExamSession = {
      firstName: settings.firstName.trim(),
      lastName: settings.lastName.trim(),
      level: settings.level,
      candidateCount: settings.candidateCount,
      date,
      tasks,
      kind: 'random',
    };
    sessionStorage.setItem(ACTIVE_KIND_KEY, 'random');
    saveActiveExam(nextSession);
    setSession(nextSession);
    setRoute('random');
    const nextSettings = { ...settings, firstName: '', lastName: '' };
    setSettings(nextSettings);
    savePreparationSettings(nextSettings);
  }

  function changeTask(taskId: string, changes: Partial<Pick<ExamTask, 'passed' | 'failed' | 'repeated' | 'note' | 'ratings'>>) {
    setSession((current) => {
      if (!current) return current;
      const next = { ...current, tasks: current.tasks.map((task) => task.id === taskId ? { ...task, ...changes } : task) };
      saveActiveExam(next);
      return next;
    });
  }

  function changeGeneralNote(generalNote: string) {
    setSession((current) => {
      if (!current) return current;
      const next = { ...current, generalNote };
      saveActiveExam(next);
      return next;
    });
  }

  function beginAnotherExam() {
    const kind = session?.kind === 'general' ? 'general' : 'random';
    if (kind === 'general') {
      const exam = generalExams.find((item) => item.id === session?.examId) ?? generalExams.find((item) => item.name === session?.examName);
      if (exam) setPendingRun(exam);
      return;
    }
    clearActiveExam(kind);
    sessionStorage.removeItem(ACTIVE_KIND_KEY);
    setSession(null);
    if (settings) updateSettings({ ...settings, firstName: '', lastName: '' });
    setRoute('random');
  }

  function endExam() {
    const kind = session?.kind === 'general' ? 'general' : 'random';
    clearActiveExam(kind);
    sessionStorage.removeItem(ACTIVE_KIND_KEY);
    setSession(null);
    setPendingRun(null);
    if (settings && kind === 'random') updateSettings({ ...settings, firstName: '', lastName: '' });
    setRoute(kind === 'general' ? 'general' : 'random');
  }

  if (checkingSession) {
    return <main className="flex min-h-screen items-center justify-center px-4 text-slate-300">{t('app.loading')}</main>;
  }

  if (!data || !settings) return <Login onUnlock={unlock} />;
  if (session?.kind === 'random' && route === 'random') {
    return <Exam onEndExam={endExam} onGeneralNoteChange={changeGeneralNote} onNewExam={beginAnotherExam} onTaskChange={changeTask} session={session} />;
  }

  if (session?.kind === 'general' && route === 'general') {
    return (
      <>
        <Exam onEndExam={endExam} onGeneralNoteChange={changeGeneralNote} onNewExam={beginAnotherExam} onTaskChange={changeTask} session={session} />
        {pendingRun && <GeneralExamRun exam={pendingRun} onCancel={() => setPendingRun(null)} onStart={(candidateName) => startGeneralExam(pendingRun, candidateName)} />}
      </>
    );
  }

  if (route === 'home') {
    return <Home activeRoute={route} onLock={lockApp} onNavigate={navigate} />;
  }

  if (route === 'random') {
    return <Preparation activeRoute={route} data={data} onChange={updateSettings} onLock={lockApp} onNavigate={navigate} onStart={startExam} settings={settings} />;
  }

  if (editorOpen) {
    const editableItems: Technique[] = [
      ...data.techniques,
      ...data.generalTasks.map((task) => ({ ...task, category: 'general' as const })),
    ];
    return <GeneralExamEditor activeRoute={route} exam={editingExam} onCancel={() => { setEditorOpen(false); setEditingExam(null); setRoute('general'); }} onLock={lockApp} onNavigate={navigate} onSave={saveGeneralExam} techniques={editableItems} />;
  }

  if (route === 'general') {
    const editableItems: Technique[] = [
      ...data.techniques,
      ...data.generalTasks.map((task) => ({ ...task, category: 'general' as const })),
    ];
    return (
      <>
        <GeneralExamList
          activeRoute={route}
          exams={generalExams}
          onDelete={(examId) => persistGeneralExams(generalExams.filter((exam) => exam.id !== examId))}
          onEdit={(exam) => { setEditingExam(exam); setEditorOpen(true); setRoute('general'); }}
          onImport={(imported) => persistGeneralExams(mergeByModificationDate(generalExams, imported))}
          onLock={lockApp}
          onNavigate={navigate}
          onNew={() => { setEditingExam(null); setEditorOpen(true); setRoute('general'); }}
          onRun={(exam) => setPendingRun(exam)}
          techniques={editableItems}
        />
        {pendingRun && <GeneralExamRun exam={pendingRun} onCancel={() => setPendingRun(null)} onStart={(candidateName) => startGeneralExam(pendingRun, candidateName)} />}
      </>
    );
  }

  if (route === 'techniques') {
    const editableItems: Technique[] = [
      ...data.techniques,
      ...data.generalTasks.map((task) => ({ ...task, category: 'general' as const })),
    ];
    return <TechniqueManager activeRoute={route} items={editableItems} onLock={lockApp} onNavigate={navigate} onSaveItem={editTechnique} onSaveTag={editTag} tags={data.tags} />;
  }

  return <Placeholder onLock={lockApp} onNavigate={navigate} route={route} />;
}

function makeGeneralTask(task: GeneralTask): ExamTask {
  return {
    id: task.id,
    kind: 'general',
    text: task.text,
    details: task.details,
    translations: task.translations,
    passed: false,
    failed: false,
    repeated: false,
    note: '',
    ratings: {},
  };
}

function makeTechniqueTask(technique: Technique): ExamTask {
  const level = levelOf(technique);
  return {
    id: technique.id,
    kind: technique.category === 'general' ? 'general' : 'technique',
    text: technique.text,
    level,
    details: technique.details,
    translations: technique.translations,
    passed: false,
    failed: false,
    repeated: false,
    note: '',
    ratings: {},
  };
}