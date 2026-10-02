import React from 'react';
import { Link2, MousePointerClick, TrendingUp } from 'lucide-react';

export default function StatsCards({ history }) {
  const totalUrls = history.length;
  const totalClicks = history.reduce((sum, item) => sum + (Number(item.click_count) || 0), 0);
  
  const topLink = history.reduce((prev, current) => {
    return (Number(current.click_count) || 0) > (Number(prev?.click_count) || 0) ? current : prev;
  }, null);

  return (
    <div className="stats-grid">
      <div className="stat-card-item">
        <div className="stat-header">
          <span className="stat-label">Short URLs ทั้งหมด</span>
          <Link2 size={22} className="stat-icon-subtle" />
        </div>
        <div className="stat-value">{totalUrls.toLocaleString()}</div>
      </div>

      <div className="stat-card-item">
        <div className="stat-header">
          <span className="stat-label">ยอดคลิกรวม</span>
          <MousePointerClick size={22} className="stat-icon-subtle" />
        </div>
        <div className="stat-value">{totalClicks.toLocaleString()}</div>
      </div>

      <div className="stat-card-item">
        <div className="stat-header">
          <span className="stat-label">
            {topLink ? `ยอดนิยม (/${topLink.short_code})` : 'ยอดนิยม'}
          </span>
          <TrendingUp size={22} className="stat-icon-subtle" />
        </div>
        <div className="stat-value">
          {topLink ? `${topLink.click_count} คลิก` : '0 คลิก'}
        </div>
      </div>
    </div>
  );
}
