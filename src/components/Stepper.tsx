import { useI18n } from '../i18n/I18nProvider';

export function Stepper({ label, value, min = 0, max, onChange }: {
  label: string;
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const { t } = useI18n();
  const change = (amount: number) => onChange(Math.max(min, Math.min(max, value + amount)));
  return (
    <div className="flex items-center gap-1.5" aria-label={label}>
      {[-5, -1].map((amount) => <button aria-label={t('stepper.decrease', { label, amount: Math.abs(amount) })} className="h-9 min-w-9 rounded-md border border-slate-600 px-2 text-sm text-slate-200 disabled:opacity-35" disabled={value <= min} key={amount} onClick={() => change(amount)} type="button">{amount}</button>)}
      <span aria-live="polite" className="min-w-9 text-center font-semibold tabular-nums text-white" title={t('stepper.value', { label, value })}>{value}</span>
      {[1, 5].map((amount) => <button aria-label={t('stepper.increase', { label, amount })} className="h-9 min-w-9 rounded-md border border-slate-600 px-2 text-sm text-slate-200 disabled:opacity-35" disabled={value >= max} key={amount} onClick={() => change(amount)} type="button">+{amount}</button>)}
    </div>
  );
}