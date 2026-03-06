'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getDockerStatus, DockerContainer } from '../lib/api';

export default function DockerStatusPage() {
  const router = useRouter();
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'tenant' | 'system'>('all');

  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('admin_api_key')) {
      router.push('/admin');
    }
  }, [router]);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await getDockerStatus();
      setContainers(res.containers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_api_key');
    router.push('/admin');
  };

  const filteredContainers = containers.filter(c => {
    if (filter === 'tenant') return !!c.tenantId;
    if (filter === 'system') return !c.tenantId;
    return true;
  });

  const stateBadge = (state: string) => {
    const colors = {
      running: 'bg-green-50 text-green-700 border-green-200',
      exited: 'bg-gray-50 text-gray-700 border-gray-200',
      paused: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      restarting: 'bg-blue-50 text-blue-700 border-blue-200',
    };
    const color = colors[state as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200';
    return (
      <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-lg border ${color}`}>
        {state}
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50/50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Image src="/icon.svg" alt="Groumo" width={32} height={26} />
            </Link>
            <div className="h-6 w-px bg-gray-200" />
            <h1 className="text-lg font-bold text-[#1E1B3A]">Docker 상태</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              대시보드
            </Link>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              로그아웃
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500 mb-1">전체 컨테이너</p>
            <p className="text-2xl font-bold text-[#1E1B3A]">{containers.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500 mb-1">테넌트 컨테이너</p>
            <p className="text-2xl font-bold text-[#1E1B3A]">{containers.filter(c => c.tenantId).length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500 mb-1">실행 중</p>
            <p className="text-2xl font-bold text-[#1E1B3A]">{containers.filter(c => c.state === 'running').length}</p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-100 p-1">
          {[
            { key: 'all', label: '전체' },
            { key: 'tenant', label: '테넌트' },
            { key: 'system', label: '시스템' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === tab.key ? 'bg-[#6C3CE1] text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">불러오는 중...</div>
          ) : filteredContainers.length === 0 ? (
            <div className="p-12 text-center text-gray-400">컨테이너가 없습니다</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase">이름</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase">이미지</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase">상태</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase">서브도메인</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase">상태 메시지</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContainers.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-[#1E1B3A] text-sm">{c.name}</div>
                        <div className="text-xs text-gray-400 font-mono">{c.id}</div>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-600 font-mono max-w-xs truncate">{c.image}</td>
                      <td className="px-5 py-4">{stateBadge(c.state)}</td>
                      <td className="px-5 py-4 text-sm">
                        {c.subdomain ? (
                          <span className="text-[#8B5CF6] font-medium">{c.subdomain}.groumo.com</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={loadStatus}
            className="px-4 py-2 text-sm font-semibold bg-[#6C3CE1] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            새로고침
          </button>
        </div>
      </div>
    </main>
  );
}
