import { useI18n } from '../i18n/I18nProvider';

const HOURS = Array.from({ length: 13 }, (_, index) => index + 8);
const MINUTES = [0, 15, 30, 45];

export function TimePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useI18n();
  const [rawHour, rawMinute] = value.split(':').map(Number);
  const hour = HOURS.includes(rawHour) ? rawHour : 9;
  const minute = MINUTES.includes(rawMinute) ? rawMinute : 0;
  const setTime = (nextHour: number, nextMinute: number) => onChange(`${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`);

  return (
    <div className="space-y-3" aria-label={t('events.startTime')}>
      <div>
        <span className="mb-1.5 block text-xs font-medium text-slate-400">{t('events.hour')}</span>
        <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-7">
          {HOURS.map((item) => <button aria-pressed={hour === item} className={`min-h-9 rounded-md border text-sm tabular-nums ${hour === item ? 'border-primary bg-primary/15 font-semibold text-primary' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`} key={item} onClick={() => setTime(item, minute)} type="button">{String(item).padStart(2, '0')}</button>)}
        </div>
      </div>
      <div>
        <span className="mb-1.5 block text-xs font-medium text-slate-400">{t('events.minute')}</span>
        <div className="grid grid-cols-4 gap-1.5">
          {MINUTES.map((item) => <button aria-pressed={minute === item} className={`min-h-9 rounded-md border text-sm tabular-nums ${minute === item ? 'border-primary bg-primary/15 font-semibold text-primary' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`} key={item} onClick={() => setTime(hour, item)} type="button">:{String(item).padStart(2, '0')}</button>)}
        </div>
      </div>
      <p aria-live="polite" className="text-sm tabular-nums text-slate-300">{t('events.selectedTime')}: <span className="font-semibold text-white">{String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}</span></p>
    </div>
  );
}