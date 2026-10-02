import React, { useState, useEffect } from 'react';
import Header from './components/header';
import StatsCards from './components/stats';
import UrlShortenerForm from './components/form';
import HistoryList from './components/history';
import QrCodeModal from './components/qr-modal';
import { fetchShortUrls, incrementClickCount } from './services/api';

export default function App() {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [toast, setToast] = useState(null);
  
  // Modal state
  const [qrModalData, setQrModalData] = useState(null); // { url, title }

  // Toast trigger
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Load History
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const items = await fetchShortUrls();
      setHistory(items);
    } catch (err) {
      console.log('Fetch history status:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Handle client-side hash redirect (e.g. /#/synerry) -> Record click to MySQL DB first!
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#/')) {
        const code = hash.replace('#/', '').trim();
        if (code) {
          try {
            await incrementClickCount(code);
          } catch {
            // ignore
          }
          const match = history.find(i => i.short_code.toLowerCase() === code.toLowerCase());
          if (match && match.original_url) {
            window.location.href = match.original_url;
          } else {
            const apiBase = import.meta.env.VITE_API_BASE_URL || '/backend/api';
            window.location.href = `${apiBase}/redirect.php?code=${encodeURIComponent(code)}`;
          }
        }
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [history]);

  return (
    <div className="container">
      <Header />

      <main>
        <section id="shortener">
          <UrlShortenerForm
            onCreated={loadHistory}
            onOpenQr={(url, title) => setQrModalData({ url, title })}
            showToast={showToast}
          />
        </section>

        <section id="stats">
          <StatsCards history={history} />
        </section>

        <section id="history">
          <HistoryList
            history={history}
            onRefresh={loadHistory}
            onOpenQr={(url, title) => setQrModalData({ url, title })}
            showToast={showToast}
          />
        </section>
      </main>
      
      {qrModalData && (
        <QrCodeModal
          url={qrModalData.url}
          title={qrModalData.title}
          onClose={() => setQrModalData(null)}
          showToast={showToast}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <span>{toast.type === 'success' ? '✓' : '✕'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
