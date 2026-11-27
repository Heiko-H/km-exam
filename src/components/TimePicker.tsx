import { useI18n } from '../i18n/I18nProvider';

export function TimePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useI18n();

  return (
    <input aria-label={t('events.startTime')} className="min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" max="20:00" min="08:00" onChange={(event) => onChange(event.target.value)} step={900} type="time" value={value} />
  );
}