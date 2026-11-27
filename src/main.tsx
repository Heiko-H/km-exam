import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UpdatePrompt } from './components/UpdatePrompt';
import { ToastProvider } from './components/Toast';
import { I18nProvider } from './i18n/I18nProvider';
import './style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <ToastProvider>
        <App />
        <UpdatePrompt />
      </ToastProvider>
    </I18nProvider>
  </React.StrictMode>,
);