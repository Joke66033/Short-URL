import React, { useRef } from 'react';
import { X, Download, Copy, Check } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

export default function QrCodeModal({ url, title, onClose, showToast }) {
  const qrRef = useRef(null);
  const [copied, setCopied] = React.useState(false);

  if (!url) return null;

  const downloadQrCode = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `qrcode-${title ? title.replace(/[^a-zA-Z0-9]/g, '_') : 'shorturl'}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    showToast('ดาวน์โหลดไฟล์ QR Code (PNG) เรียบร้อยแล้ว', 'success');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast('คัดลอก URL เรียบร้อยแล้ว', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <h3>QR Code สำหรับ Short URL</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
          {title || 'สามารถใช้สมาร์ทโฟนสแกนเพื่อไปยังลิงก์ต้นทางได้ทันที'}
        </p>

        <div className="qr-wrapper" ref={qrRef}>
          <QRCodeCanvas
            value={url}
            size={200}
            bgColor="#ffffff"
            fgColor="#0f172a"
            level="H"
            includeMargin={true}
          />
        </div>

        <div style={{ wordBreak: 'break-all', fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 600, marginBottom: '1.2rem' }}>
          {url}
        </div>

        <div className="action-buttons" style={{ justifyContent: 'center' }}>
          <button className="btn-action primary" onClick={downloadQrCode}>
            <Download size={16} /> ดาวน์โหลด PNG
          </button>

          <button className="btn-action" onClick={handleCopy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'คัดลอกแล้ว' : 'คัดลอก URL'}
          </button>
        </div>
      </div>
    </div>
  );
}
