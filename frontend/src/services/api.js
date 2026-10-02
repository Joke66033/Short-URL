// API Service for Short URL Application

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/backend/api';

const CLIENT_TOKEN_KEY = 'shortly_client_token';

export function getClientToken() {
  try {
    let token = localStorage.getItem(CLIENT_TOKEN_KEY);
    if (!token) {
      token = 'cli_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem(CLIENT_TOKEN_KEY, token);
    }
    return token;
  } catch {
    return 'cli_default_browser';
  }
}

// Helper LocalStorage สำหรับกรณีทดสอบรันบน Vite Dev Server โดยยังไม่ได้เปิด PHP/MySQL
const STORAGE_KEY = 'shortly_mock_db';

const INITIAL_MOCK_ITEMS = [];

function getLocalData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_ITEMS));
      return INITIAL_MOCK_ITEMS;
    }
    return JSON.parse(stored);
  } catch {
    return INITIAL_MOCK_ITEMS;
  }
}

function saveLocalData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function createMockShortUrl(originalUrl, customCode, title) {
  const list = getLocalData();
  const code = customCode.trim() || Math.random().toString(36).substring(2, 8);
  const token = getClientToken();
  
  let targetUrl = originalUrl.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }

  let linkTitle = title.trim();
  if (!linkTitle) {
    try {
      linkTitle = new URL(targetUrl).hostname;
    } catch {
      linkTitle = 'Web Link';
    }
  }

  const newItem = {
    id: Date.now(),
    client_token: token,
    original_url: targetUrl,
    short_code: code,
    title: linkTitle,
    click_count: 0,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    last_clicked_at: null
  };

  list.unshift(newItem);
  saveLocalData(list);
  return newItem;
}

// 1. สร้าง Short URL
export async function createShortUrl(originalUrl, customCode = '', title = '') {
  const token = getClientToken();
  try {
    const res = await fetch(`${API_BASE_URL}/create.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Token': token
      },
      body: JSON.stringify({ original_url: originalUrl, custom_code: customCode, title, client_token: token })
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data) return data;
    if (data.error) throw new Error(data.error);
    throw new Error(`ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (Status ${res.status})`);
  } catch (err) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('เชื่อมต่อ')) {
      throw err;
    }
    // หากไม่สามารถเชื่อมต่อ API Backend ได้เลย จะใช้ Mock LocalStorage เพื่อทดสอบบน Dev Server
    console.warn('Backend API connection failed, using LocalStorage fallback');
    return createMockShortUrl(originalUrl, customCode, title);
  }
}

// 2. ดึงประวัติรายการ Short URL ทั้งหมดจากฐานข้อมูล MySQL
export async function fetchShortUrls(searchQuery = '') {
  const token = getClientToken();
  try {
    const query = searchQuery
      ? `?q=${encodeURIComponent(searchQuery)}&client_token=${encodeURIComponent(token)}`
      : `?client_token=${encodeURIComponent(token)}`;

    const res = await fetch(`${API_BASE_URL}/list.php${query}`, {
      headers: { 'X-Client-Token': token }
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data && Array.isArray(data.items)) {
      return data.items;
    }
    if (data.error) {
      console.error('Fetch error:', data.error);
    }
  } catch (err) {
    console.warn('Backend API connection failed for list, using LocalStorage fallback', err);
  }

  // LocalStorage Fallback สำหรับกรณีรัน Dev Server โดยไม่มี PHP/MySQL
  let list = getLocalData();
  list = list.filter(i => i.client_token === token);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(
      i =>
        i.original_url.toLowerCase().includes(q) ||
        i.short_code.toLowerCase().includes(q) ||
        (i.title && i.title.toLowerCase().includes(q))
    );
  }
  return list;
}

// 3. ลบรายการ Short URL จากฐานข้อมูล MySQL
export async function deleteShortUrl(id, shortCode) {
  const token = getClientToken();
  try {
    const res = await fetch(`${API_BASE_URL}/delete.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Token': token
      },
      body: JSON.stringify({ id, short_code: shortCode, client_token: token })
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data) return data;
    if (data.error) throw new Error(data.error);
  } catch (err) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('เชื่อมต่อ')) {
      throw err;
    }
  }

  // LocalStorage Fallback
  let list = getLocalData();
  list = list.filter(i => i.id !== id && i.short_code !== shortCode);
  saveLocalData(list);
  return { message: 'ลบรายการสำเร็จ' };
}

// 4. บันทึกจำนวนการคลิกลิงก์ลงฐานข้อมูล MySQL (ตาราง clicks)
export async function incrementClickCount(shortCode) {
  if (!shortCode) return;
  let success = false;

  try {
    const res = await fetch(`${API_BASE_URL}/click.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ short_code: shortCode })
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data && data.success) {
      success = true;
      return data;
    }
  } catch (err) {
    console.error('API click recording failed:', err);
  }

  // หาก API ไม่สำเร็จ ค่อยสลับไปอัปเดต LocalStorage
  if (!success) {
    let list = getLocalData();
    const index = list.findIndex(i => i.short_code.toLowerCase() === shortCode.toLowerCase());
    if (index !== -1) {
      list[index].click_count = (Number(list[index].click_count) || 0) + 1;
      list[index].last_clicked_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
    }
    saveLocalData(list);
  }
}

// Helper: สร้าง URL สั้นแบบสมบูรณ์สำหรับ QR Code และแชร์
export function getFullShortUrl(shortCode) {
  return `${window.location.origin}/short-url/${shortCode}`;
}
