import { useMemo, useRef, useState } from 'react';
import { localize } from '../i18n/localize';
import { useI18n } from '../i18n/I18nProvider';
import { formatDate } from '../lib/date';
import { LEVELS, type Category, type GeneralExam, type Level, type Technique } from '../lib/types';
import { Icon, IconButton } from './Icons';
import { Modal } from './Modal';
import { PageHeader } from './PageHeader';
import type { AppRoute } from './NavigationMenu';

const greekNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega'];

function suggestedName(): string {
  return `${greekNames[Math.floor(Math.random() * greekNames.length)]} ${Math.floor(Math.random() * 900) + 100}`;
}

function categoryName(category: Category, t: ReturnType<typeof useI18n>['t']): string {
  if (category === 'general') return t('exam.generalTask');
  if (category === 'other') return t('category.other');
  return t('preparation.levelOption', { level: Number(category.slice(-1)) });
}

interface GeneralExamEditorProps {
  exam: GeneralExam | null;
  techniques: Technique[];
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onLock: () => void;
  onCancel: () => void;
  onSave: (exam: GeneralExam) => void;
}

export function GeneralExamEditor({ exam, techniques, activeRoute, onNavigate, onLock, onCancel, onSave }: GeneralExamEditorProps) {
  const { t, language } = useI18n();
  const [name, setName] = useState(exam?.name ?? suggestedName());
  const [level, setLevel] = useState<Level>(exam?.level ?? 1);
  const [date, setDate] = useState(exam?.date ?? '');
  const [selectedIds, setSelectedIds] = useState<string[]>(exam?.techniqueIds ?? []);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const dateInputRef = useRef<HTMLInputElement>(null);
  const byId = useMemo(() => new Map(techniques.map((technique) => [technique.id, technique])), [techniques]);
  const eligible = techniques.filter((technique) => technique.category !== 'other');
  const visible = eligible.filter((technique) => {
    const localized = localize(technique, language);
    const categoryMatches = category === 'all' || technique.category === category;
    return categoryMatches && localized.text.toLocaleLowerCase(language).includes(query.trim().toLocaleLowerCase(language));
  });
  const selected = selectedIds.map((id) => byId.get(id)).filter((item): item is Technique => Boolean(item));

  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= selectedIds.length) return;
    setSelectedIds((ids) => {
      const next = [...ids];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function reorderItem(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= selectedIds.length || to >= selectedIds.length) return;
    setSelectedIds((ids) => {
      const next = [...ids];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function toggleTechnique(id: string) {
    setSelectedIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  }

  function save() {
    const trimmedName = name.trim();
    if (!trimmedName || selectedIds.length === 0) return;
    onSave({
      id: exam?.id ?? crypto.randomUUID(),
      name: trimmedName,
      level,
      techniqueIds: selectedIds,
      date: date || undefined,
      modification_date: new Date().toISOString(),
    });
  }

  return (
    <>
      <PageHeader activeRoute={activeRoute} onLock={onLock} onNavigate={onNavigate} title={t('general.editor')} actions={(
        <button className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800" onClick={onCancel} type="button">{t('exam.cancel')}</button>
      )} />
      <main className="mx-auto max-w-5xl space-y-6 px-3 py-5 sm:px-6 sm:py-8">
        <div className="grid items-end gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="block space-y-2 text-sm font-medium text-slate-300">
            <span>{t('general.name')}</span>
            <input autoFocus className="min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white outline-none focus:border-primary" onChange={(event) => setName(event.target.value)} placeholder={t('general.namePlaceholder')} value={name} />
          </label>
          <div className="block space-y-2 text-sm font-medium text-slate-300">
            <span className="block">{t('general.date')}</span>
            <div className="flex items-center gap-2">
              <button
                aria-label={t('general.pickDate')}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-600 bg-field px-3 text-left text-white outline-none hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary"
                onClick={() => {
                  const input = dateInputRef.current;
                  if (!input) return;
                  if ('showPicker' in input) {
                    try {
                      input.showPicker();
                      return;
                    } catch {
                      // Fall back to the native input interaction below.
                    }
                  }
                  input.focus();
                  input.click();
                }}
                type="button"
              >
                <Icon className="h-4 w-4 shrink-0 text-slate-400" name="calendar" />
                <span className="whitespace-nowrap">{date ? formatDate(date, language) : t('general.pickDate')}</span>
              </button>
              <input aria-label={t('general.date')} className="absolute h-px w-px opacity-0" onChange={(event) => setDate(event.target.value)} ref={dateInputRef} tabIndex={-1} type="date" value={date} />
              {date && <button aria-label={t('general.clearDate')} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary" onClick={() => setDate('')} type="button">×</button>}
            </div>
          </div>
        </div>
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-300">{t('general.level')}</h2>
          <div className="grid grid-cols-5 gap-2">
            {LEVELS.map((item) => (
              <button aria-pressed={level === item} className={`min-h-11 rounded-md border font-semibold ${level === item ? 'border-primary bg-primary/15 text-primary' : 'border-slate-600 text-slate-300 hover:bg-slate-800'}`} key={item} onClick={() => setLevel(item)} type="button">{t('preparation.levelOption', { level: item })}</button>
            ))}
          </div>
        </section>
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-white">{t('general.selectedTechniques')}</h2>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 font-semibold text-white hover:bg-primary-hover" onClick={() => setPickerOpen(true)} type="button"><span aria-hidden="true">＋</span>{t('general.addTechniques')}</button>
          </div>
          {selected.length === 0 ? <p className="rounded-lg border border-slate-700 bg-panel p-4 text-slate-400">{t('general.noTechniques')}</p> : (
            <ol className="space-y-2">
              {selected.map((technique, index) => {
                const title = localize(technique, language).text;
                return (
                  <li
                    className={`flex items-center gap-2 rounded-lg border bg-panel p-2 ${dropIndex === index ? 'border-primary' : 'border-slate-700'} ${draggingIndex === index ? 'opacity-50' : ''}`}
                    key={technique.id}
                    onDragEnd={() => { setDraggingIndex(null); setDropIndex(null); }}
                    onDragOver={(event) => { event.preventDefault(); setDropIndex(index); }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const source = Number(event.dataTransfer.getData('text/plain'));
                      reorderItem(Number.isInteger(source) ? source : draggingIndex ?? -1, index);
                      setDraggingIndex(null);
                      setDropIndex(null);
                    }}
                  >
                    <button
                      aria-label={t('general.dragHandle')}
                      className="hidden h-9 w-8 shrink-0 cursor-grab items-center justify-center rounded-md text-slate-400 hover:bg-slate-700 active:cursor-grabbing sm:inline-flex"
                      draggable
                      onDragStart={(event) => { setDraggingIndex(index); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(index)); }}
                      type="button"
                    ><Icon name="drag" /></button>
                    <span className="w-7 shrink-0 text-center text-sm tabular-nums text-primary/80">{index + 1}.</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">{title}</p>
                      <p className="text-xs text-slate-400">{categoryName(technique.category, t)}</p>
                    </div>
                    <IconButton disabled={index === 0} icon="up" label={`${t('general.moveUp')}: ${title}`} onClick={() => moveItem(index, -1)} />
                    <IconButton disabled={index === selected.length - 1} icon="down" label={`${t('general.moveDown')}: ${title}`} onClick={() => moveItem(index, 1)} />
                    <IconButton className="border-red-900/80 text-red-300" icon="delete" label={`${t('general.remove')}: ${title}`} onClick={() => toggleTechnique(technique.id)} />
                  </li>
                );
              })}
            </ol>
          )}
        </section>
        <div className="flex justify-center border-t border-slate-700 pt-5">
          <button className="min-h-11 rounded-md bg-primary px-6 font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40" disabled={!name.trim() || selectedIds.length === 0} onClick={save} type="button">{t('general.save')}</button>
        </div>
      </main>
      {pickerOpen && (
        <Modal onClose={() => setPickerOpen(false)} size="large" title={t('general.addTechniques')}>
          <div className="grid gap-3 sm:grid-cols-[1fr_14rem]">
            <label className="text-sm font-medium text-slate-300">
              {t('general.techniqueSearch')}
              <input autoFocus className="mt-1 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white outline-none focus:border-primary" onChange={(event) => setQuery(event.target.value)} value={query} />
            </label>
            <label className="text-sm font-medium text-slate-300">
              {t('general.categoryFilter')}
              <select className="mt-1 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white" onChange={(event) => setCategory(event.target.value)} value={category}>
                <option value="all">{t('general.allCategories')}</option>
                {['level-1', 'level-2', 'level-3', 'level-4', 'level-5', 'general'].map((item) => (
                  <option key={item} value={item}>{item === 'general' ? t('exam.generalTask') : t('preparation.levelOption', { level: item.slice(-1) })}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {visible.map((technique) => {
              const title = localize(technique, language).text;
              const added = selectedIds.includes(technique.id);
              return (
                <button aria-pressed={added} className={`flex min-h-12 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left ${added ? 'border-primary bg-primary/10' : 'border-slate-700 bg-field hover:bg-slate-800'}`} key={technique.id} onClick={() => toggleTechnique(technique.id)} type="button">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${added ? 'border-primary bg-primary text-white' : 'border-slate-500 text-transparent'}`}><span aria-hidden="true">✓</span></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-white">{title}</span>
                    <span className="block text-xs text-slate-400">{categoryName(technique.category, t)}</span>
                  </span>
                  <span className="text-xs text-primary">{added ? t('general.remove') : t('general.add')}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <IconButton className="border-primary text-primary hover:bg-primary/10" icon="save" label={t('general.saveSelection')} onClick={() => setPickerOpen(false)} />
          </div>
        </Modal>
      )}
    </>
  );
}