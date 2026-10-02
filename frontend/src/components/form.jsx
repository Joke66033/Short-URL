import React, { useState } from 'react';
import { Link2, Sparkles, Copy, QrCode, ExternalLink, Check } from 'lucide-react';
import { createShortUrl, getFullShortUrl, incrementClickCount } from '../services/api';

export default function UrlShortenerForm({ onCreated, onOpenQr, showToast }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      showToast('กรุณากรอก URL ต้นทางที่ต้องการย่อ', 'error');
      return;
    }

    setLoading(true);
    try {
      const createdItem = await createShortUrl(url);
      setResult(createdItem);
      setUrl('');
      showToast('สร้าง Short URL สำเร็จแล้ว!', 'success');
      if (onCreated) onCreated();
    } catch (err) {
      showToast(err.message || 'เกิดข้อผิดพลาดในการสร้าง Short URL', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResult = (fullUrl) => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    showToast('คัดลอก Short URL ลง Clipboard แล้ว!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestLinkClick = async (shortCode) => {
    await incrementClickCount(shortCode);
    if (onCreated) onCreated();
  };

  return (
    <div className="glass-card shortener-section">
      <h1 className="hero-title">
        ย่อลิงก์ของคุณให้สั้นลง
      </h1>
      <p className="hero-subtitle">
        เปลี่ยน URL ที่ยาวให้เป็น Short URL และ QR Code ที่แชร์ง่าย พร้อมติดตามยอดคลิกได้ทันที
      </p>

      <form onSubmit={handleSubmit} className="input-group-wrapper">
        <div className="input-row">
          <div className="url-input-container">
            <Link2 className="url-input-icon" size={18} />
            <input
              type="text"
              className="main-input"
              placeholder="https://example.com/my-long-link-address..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              'กำลังสร้าง...'
            ) : (
              <>
                <Link2 size={16} /> ย่อลิงก์
              </>
            )}
          </button>
        </div>
      </form>

      {result && (
        <div className="result-card">
          <div className="result-header">
            <span className="badge badge-success">
              <Check size={14} /> สร้างสำเร็จ
            </span>
          </div>

          <div className="result-main">
            <div className="result-top-row">
              <a
                href={result.original_url}
                target="_blank"
                rel="noreferrer"
                className="short-url-link"
                onClick={() => handleTestLinkClick(result.short_code)}
              >
                {getFullShortUrl(result.short_code)}
              </a>

              <div className="action-buttons">
                <button
                  className="btn-action primary"
                  onClick={() => handleCopyResult(getFullShortUrl(result.short_code))}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
                </button>

                <button
                  className="btn-action"
                  onClick={() => onOpenQr(getFullShortUrl(result.short_code), result.title || result.original_url)}
                >
                  <QrCode size={15} /> QR Code
                </button>

                <a
                  href={result.original_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-action"
                  onClick={() => handleTestLinkClick(result.short_code)}
                >
                  <ExternalLink size={15} /> ทดลองเปิด
                </a>
              </div>
            </div>

            <div className="result-bottom-row">
              <strong>ปลายทาง:</strong> {result.original_url}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
