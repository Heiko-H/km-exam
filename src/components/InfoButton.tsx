import { useState } from 'react';
import { Modal } from './Modal';

interface InfoButtonProps {
  title: string;
  details: string;
}

export function InfoButton({ title, details }: InfoButtonProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <button
        aria-label={`Details zu ${title} anzeigen`}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary/15 focus:outline-none focus:ring-2 focus:ring-primary print:hidden"
        onClick={() => setShowDetails(true)}
        type="button"
      >
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M12 11v5m0-8h.01" />
        </svg>
      </button>
      {showDetails && (
        <Modal onClose={() => setShowDetails(false)} title={title}>
          <p className="whitespace-pre-wrap">{details}</p>
        </Modal>
      )}
    </>
  );
}