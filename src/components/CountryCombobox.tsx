import { useMemo, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { getAlpha2Codes } from 'i18n-iso-countries';
import type { Language } from '../lib/types';

interface CountryComboboxProps {
  value: string;
  language: Language;
  label: string;
  noResultsLabel: string;
  onChange: (value: string) => void;
}

const countryCodes = Object.keys(getAlpha2Codes());

function normalized(value: string, language: Language): string {
  return value.toLocaleLowerCase(language).normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export function CountryCombobox({ value, language, label, noResultsLabel, onChange }: CountryComboboxProps) {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputId = 'profile-country';
  const listId = 'profile-country-options';
  const countries = useMemo(() => {
    const displayNames = new Intl.DisplayNames([language], { type: 'region' });
    const collator = new Intl.Collator(language, { sensitivity: 'base' });
    return countryCodes
      .map((code) => ({ code, name: displayNames.of(code) ?? code }))
      .filter((country) => country.name !== country.code)
      .sort((left, right) => collator.compare(left.name, right.name));
  }, [language]);
  const selectedCountry = countries.find((country) => country.code === value);
  const matchingCountries = useMemo(() => {
    const normalizedQuery = normalized(query.trim(), language);
    if (!normalizedQuery) return countries;
    return countries.filter((country) => normalized(country.name, language).includes(normalizedQuery) || country.code.toLocaleLowerCase(language).includes(normalizedQuery));
  }, [countries, language, query]);

  function selectCountry(code: string) {
    onChange(code);
    setQuery('');
    setEditing(false);
    setOpen(false);
    setActiveIndex(0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && matchingCountries.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => current < 0 ? 0 : (current + 1) % matchingCountries.length);
    } else if (event.key === 'ArrowUp' && matchingCountries.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => current < 0 ? matchingCountries.length - 1 : (current + matchingCountries.length - 1) % matchingCountries.length);
    } else if (event.key === 'Enter' && open && matchingCountries[activeIndex]) {
      event.preventDefault();
      selectCountry(matchingCountries[activeIndex].code);
    } else if (event.key === 'Escape') {
      setOpen(false);
      setEditing(false);
    }
  }

  function closeOnBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setOpen(false);
      setEditing(false);
    }
  }

  return (
    <div className="relative" onBlur={closeOnBlur}>
      <label className="block text-sm text-slate-300" htmlFor={inputId}>{label}
        <input aria-activedescendant={open && matchingCountries[activeIndex] ? `${listId}-${matchingCountries[activeIndex].code}` : undefined} aria-autocomplete="list" aria-controls={open ? listId : undefined} aria-expanded={open} autoComplete="off" className="mt-1.5 min-h-11 w-full rounded-md border border-slate-600 bg-field px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" id={inputId} onChange={(event) => { setQuery(event.target.value); setEditing(true); setOpen(true); setActiveIndex(0); }} onFocus={() => { setQuery(''); setEditing(true); setOpen(true); setActiveIndex(-1); }} onKeyDown={handleKeyDown} role="combobox" value={editing ? query : selectedCountry?.name ?? value} />
      </label>
      {open && <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-slate-600 bg-panel shadow-xl" id={listId} role="listbox">
        {matchingCountries.length ? matchingCountries.map((country, index) => <div aria-selected={value === country.code} className={`min-h-10 w-full cursor-pointer px-3 py-2 text-sm ${index === activeIndex ? 'bg-primary/15 text-primary' : 'text-slate-200 hover:bg-slate-700'}`} id={`${listId}-${country.code}`} key={country.code} onClick={() => selectCountry(country.code)} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveIndex(index)} role="option">{country.name}</div>) : <p className="p-3 text-sm text-slate-400" role="status">{noResultsLabel}</p>}
      </div>}
    </div>
  );
}