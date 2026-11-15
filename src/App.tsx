import { useCallback, useEffect, useState } from 'react';
import { encryptedData } from 'virtual:encrypted-data';
import { Exam } from './components/Exam';
import { Login } from './components/Login';
import { Preparation } from './components/Preparation';
import { clearFailedLogins } from './lib/lockout';
import { exportKey, importSessionKey, decryptWithKey, unlockData } from './lib/crypto';
import { localDateString, selectTechniques } from './lib/random';
import { clearActiveExam, defaultPreparationSettings, loadActiveExam, loadPreparationSettings, saveActiveExam, savePreparationSettings } from './lib/storage';
import type { ExamData, ExamSession, ExamTask, PreparationSettings } from './lib/types';

const SESSION_KEY = 'km-exam:session-key';

export default function App() {
  const [data, setData] = useState<ExamData | null>(null);
  const [settings, setSettings] = useState<PreparationSettings | null>(null);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [authenticatedDate, setAuthenticatedDate] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const enterApp = useCallback((unlockedData: ExamData, restoreExistingSession: boolean, date: string) => {
    setData(unlockedData);
    setAuthenticatedDate(date);
    if (restoreExistingSession) {
      setSettings(loadPreparationSettings(unlockedData.techniques, unlockedData.generalTasks));
      setSession(loadActiveExam());
    } else {
      clearActiveExam();
      const defaults = defaultPreparationSettings(unlockedData.generalTasks);
      setSettings(defaults);
      savePreparationSettings(defaults);
      setSession(null);
    }
  }, []);

  const lockApp = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthenticatedDate(null);
    setData(null);
    setSettings(null);
    setSession(null);
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
            if (localDateString() === date) enterApp(unlockedData, true, date);
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
    enterApp(result.data, false, date);
  }

  function updateSettings(next: PreparationSettings) {
    setSettings(next);
    savePreparationSettings(next);
  }

  async function startExam() {
    if (!settings || !data) return;
    const date = localDateString();
    const chosenTechniques = await selectTechniques(data.techniques, settings.techniqueCounts, {
      firstName: settings.firstName,
      lastName: settings.lastName,
      level: settings.level,
      candidateCount: settings.candidateCount,
      date,
    });
    const beforeTasks = data.generalTasks
      .filter((task) => settings.generalTaskPlacements[task.id] === 'before')
      .map((task) => makeGeneralTask(task.id, task.text, task.details));
    const afterTasks = data.generalTasks
      .filter((task) => settings.generalTaskPlacements[task.id] === 'after')
      .map((task) => makeGeneralTask(task.id, task.text, task.details));
    const techniqueTasks = chosenTechniques.map<ExamTask>((technique) => ({
      id: `technique-${technique.level}-${technique.text}`,
      kind: 'technique',
      text: technique.text,
      level: technique.level,
      details: technique.details,
      passed: false,
      failed: false,
      repeated: false,
      note: '',
    }));
    const tasks = [...beforeTasks, ...techniqueTasks, ...afterTasks];
    if (tasks.length === 0) throw new Error('Bitte wähle mindestens eine Technik oder allgemeine Prüfungsaufgabe aus.');

    const nextSession: ExamSession = {
      firstName: settings.firstName.trim(),
      lastName: settings.lastName.trim(),
      level: settings.level,
      candidateCount: settings.candidateCount,
      date,
      tasks,
    };
    saveActiveExam(nextSession);
    setSession(nextSession);
    const nextSettings = { ...settings, firstName: '', lastName: '' };
    setSettings(nextSettings);
    savePreparationSettings(nextSettings);
  }

  function changeTask(taskId: string, changes: Partial<Pick<ExamTask, 'passed' | 'failed' | 'repeated' | 'note'>>) {
    setSession((current) => {
      if (!current) return current;
      const next = { ...current, tasks: current.tasks.map((task) => task.id === taskId ? { ...task, ...changes } : task) };
      saveActiveExam(next);
      return next;
    });
  }

  function beginAnotherExam() {
    clearActiveExam();
    setSession(null);
    if (settings) updateSettings({ ...settings, firstName: '', lastName: '' });
  }

  if (checkingSession) {
    return <main className="flex min-h-screen items-center justify-center px-4 text-slate-300">App wird geladen …</main>;
  }

  if (!data || !settings) return <Login onUnlock={unlock} />;
  if (session) return <Exam onNewExam={beginAnotherExam} onTaskChange={changeTask} session={session} />;

  return <Preparation data={data} onChange={updateSettings} onLock={lockApp} onStart={startExam} settings={settings} />;
}

function makeGeneralTask(id: string, text: string, details?: string): ExamTask {
  return {
    id: `general-${id}`,
    kind: 'general',
    text,
    details,
    passed: false,
    failed: false,
    repeated: false,
    note: '',
  };
}