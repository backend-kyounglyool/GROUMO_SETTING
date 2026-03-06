'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminLoginPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // API Key 검증 - 실제 인증이 필요한 엔드포인트 호출
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tenants?page=1&limit=1`, {
        headers: {
          'X-API-Key': apiKey
        }
      });

      if (res.ok) {
        // API Key가 유효함
        sessionStorage.setItem('admin_api_key', apiKey);
        router.push('/admin/dashboard');
      } else if (res.status === 401 || res.status === 403) {
        setError('API Key가 올바르지 않습니다');
      } else {
        setError('서버 오류가 발생했습니다');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('서버에 연결할 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image src="/icon.svg" alt="Groumo" width={48} height={40} />
          </div>
          <h1 className="text-2xl font-bold text-[#1E1B3A] mb-2">관리자 로그인</h1>
          <p className="text-sm text-gray-500">API Key를 입력하여 관리자 페이지에 접속하세요</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setError(''); }}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] outline-none transition-all text-[#1E1B3A] placeholder-gray-400"
              placeholder="API Key 입력"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !apiKey}
            className="w-full py-3 bg-gradient-to-r from-[#6C3CE1] to-[#8B5CF6] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? '연결 중...' : '로그인'}
          </button>
        </form>
      </div>
    </main>
  );
}
