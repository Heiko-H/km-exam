import { Modal } from './Modal';

export function ConfirmModal({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel }: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal actions={<>
      <button className="min-h-10 rounded-md border border-slate-600 px-4 text-slate-200 hover:bg-slate-700" onClick={onCancel} type="button">{cancelLabel}</button>
      <button className="min-h-10 rounded-md border border-red-700 bg-red-950/60 px-4 font-semibold text-red-200 hover:bg-red-900/60" onClick={onConfirm} type="button">{confirmLabel}</button>
    </>} onClose={onCancel} title={title}>
      <p className="text-slate-200">{message}</p>
    </Modal>
  );
}