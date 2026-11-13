import { useCallback, useEffect, useState } from 'react';
import { encryptedData } from 'virtual:encrypted-data';
import { Exam } from './components/Exam';
import { Login } from './components/Login';
import { Preparation } from './components/Preparation';
import { clearFailedLogins } from './lib/lockout';
import { exportKey, importSessionKey, decryptWithKey, unlockData } from './lib/crypto';
import { localDateString, selectTechniques } from './lib/random';
import { clearActiveExam, loadActiveExam, loadPreparationSettings, saveActiveExam, savePreparationSettings } from './lib/storage';
import type { ExamData, ExamSession, ExamTask, PreparationSettings } from './lib/types';

const SESSION_KEY = 'km-exam:session-key';

export default function App() {
  const [data, setData] = useState<ExamData | null>(null);
  const [settings, setSettings] = useState<PreparationSettings | null>(null);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const enterApp = useCallback((unlockedData: ExamData) => {
    setData(unlockedData);
    setSettings(loadPreparationSettings(unlockedData.techniques, unlockedData.generalTasks));
    setSession(loadActiveExam());
  }, []);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      try {
        const encodedKey = sessionStorage.getItem(SESSION_KEY);
        if (encodedKey) {
          const key = await importSessionKey(encodedKey);
          const unlockedData = await decryptWithKey(key, encryptedData);
          if (active) enterApp(unlockedData);
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

  async function unlock(password: string) {
    const result = await unlockData(password, encryptedData);
    sessionStorage.setItem(SESSION_KEY, await exportKey(result.key));
    clearFailedLogins();
    enterApp(result.data);
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
    if (!window.confirm('Möchtest du die aktuelle Prüfung wirklich beenden und eine neue Prüfung beginnen?')) return;
    clearActiveExam();
    setSession(null);
    if (settings) updateSettings({ ...settings, firstName: '', lastName: '' });
  }

  function lockApp() {
    sessionStorage.removeItem(SESSION_KEY);
    setData(null);
    setSettings(null);
    setSession(null);
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