import { useI18n } from '../i18n/I18nProvider';

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

export function Stepper({ label, value, min, max, onChange }: StepperProps) {
  const { t } = useI18n();
  const buttonClass = 'min-h-11 min-w-11 rounded-md border border-slate-600 bg-field px-2 text-sm font-semibold text-slate-100 hover:border-primary hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-40';

  function changeBy(amount: number) {
    onChange(Math.max(min, Math.min(max, value + amount)));
  }

  return (
    <div aria-label={label} className="flex items-center gap-1.5" role="group">
      {[-5, -1].map((amount) => (
        <button
          aria-label={t('stepper.decrease', { label, amount: Math.abs(amount) })}
          className={buttonClass}
          disabled={value <= min}
          key={amount}
          onClick={() => changeBy(amount)}
          type="button"
        >
          {amount}
        </button>
      ))}
      <output aria-label={t('stepper.value', { label, value })} className="min-w-10 px-1 text-center text-lg font-bold tabular-nums text-white" aria-live="polite">
        {value}
      </output>
      {[1, 5].map((amount) => (
        <button
          aria-label={t('stepper.increase', { label, amount })}
          className={buttonClass}
          disabled={value >= max}
          key={amount}
          onClick={() => changeBy(amount)}
          type="button"
        >
          +{amount}
        </button>
      ))}
    </div>
  );
}