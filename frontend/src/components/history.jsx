import React, { useState } from 'react';
import { Search, Copy, QrCode, Trash2, ExternalLink, MousePointerClick, Calendar, Check, RefreshCw } from 'lucide-react';
import { getFullShortUrl, deleteShortUrl, incrementClickCount } from '../services/api';

export default function HistoryList({ history, onRefresh, onOpenQr, showToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const filteredHistory = history.filter(item => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (item.title && item.title.toLowerCase().includes(q)) ||
      item.short_code.toLowerCase().includes(q) ||
      item.original_url.toLowerCase().includes(q)
    );
  });

  const handleCopy = (id, shortCode) => {
    const fullUrl = getFullShortUrl(shortCode);
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    showToast('คัดลอก Short URL เรียบร้อยแล้ว', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id, shortCode) => {
    if (!window.confirm(`คุณต้องการลบ Short URL "/${shortCode}" ใช่หรือไม่?`)) return;
    try {
      await deleteShortUrl(id, shortCode);
      showToast('ลบรายการเรียบร้อยแล้ว', 'success');
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || 'ลบรายการไม่สำเร็จ', 'error');
    }
  };

  const handleLinkClick = async (shortCode) => {
    await incrementClickCount(shortCode);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="card-section">
      <div className="history-header">
        <h2 className="section-title">
          ประวัติการสร้าง ({filteredHistory.length})
        </h2>

        <div className="history-actions">
          <div className="search-box">
            <Search className="search-icon" size={14} />
            <input
              type="text"
              className="search-input"
              placeholder="ค้นหาตามชื่อ, รหัส, หรือ URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="icon-btn" onClick={onRefresh} title="รีเฟรชข้อมูล">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? 'ไม่พบข้อมูลที่ตรงกับการค้นหา' : 'ยังไม่มีประวัติการสร้าง Short URL'}
        </div>
      ) : (
        <div className="table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>รายการ URL</th>
                <th>Short Code</th>
                <th>ยอดคลิก</th>
                <th style={{ textAlign: 'center' }}>วันที่สร้าง</th>
                <th style={{ textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => {
                const fullShortUrl = getFullShortUrl(item.short_code);
                return (
                  <tr key={item.id || item.short_code}>
                    <td>
                      <span className="url-title">{item.title || 'Untitled Link'}</span>
                      <a
                        href={item.original_url}
                        target="_blank"
                        rel="noreferrer"
                        className="url-original"
                        title={item.original_url}
                        onClick={() => handleLinkClick(item.short_code)}
                      >
                        {item.original_url}
                      </a>
                    </td>

                    <td>
                      <a
                        href={item.original_url}
                        target="_blank"
                        rel="noreferrer"
                        className="url-short-link"
                        onClick={() => handleLinkClick(item.short_code)}
                      >
                        code/{item.short_code} <ExternalLink size={13} />
                      </a>
                    </td>

                    <td>
                      <span className="click-count-badge">
                        {item.click_count || 0} ครั้ง
                      </span>
                    </td>

                    <td className="created-date" style={{ textAlign: 'center' }}>
                      {item.created_at ? item.created_at.substring(0, 16) : '-'}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div className="action-buttons-inline">
                        <button
                          className="table-action-btn"
                          onClick={() => handleCopy(item.id, item.short_code)}
                          title="คัดลอก Short URL"
                        >
                          {copiedId === item.id ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                        </button>

                        <button
                          className="table-action-btn"
                          onClick={() => onOpenQr(fullShortUrl, item.title || item.original_url)}
                          title="ดู QR Code"
                        >
                          <QrCode size={14} />
                        </button>

                        <button
                          className="table-action-btn danger"
                          onClick={() => handleDelete(item.id, item.short_code)}
                          title="ลบรายการ"
                        >
                          <Trash2 size={14} color="var(--danger)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
