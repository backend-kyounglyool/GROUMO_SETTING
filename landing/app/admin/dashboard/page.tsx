'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { fetchTenants, approveTenant, rejectTenant, deleteTenant, Tenant } from '../lib/api';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '대기', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  approved: { label: '승인', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  deployed: { label: '배포됨', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  rejected: { label: '거부', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

const TABS = [
  { key: '', label: '전체' },
  { key: 'pending', label: '대기' },
  { key: 'approved', label: '승인' },
  { key: 'deployed', label: '배포됨' },
  { key: 'rejected', label: '거부' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('admin_api_key')) {
      router.push('/admin');
    }
  }, [router]);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTenants({ status: statusFilter || undefined, page, limit: 20 });
      setTenants(res.data);
      setPagination({ total: res.pagination.total, totalPages: res.pagination.totalPages });
    } catch {
      // API util handles 401 redirect
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const handleApprove = async (id: string) => {
    if (!confirm('이 신청을 승인하고 배포하시겠습니까?')) return;
    setActionLoading(id);
    try {
      await approveTenant(id);
      await loadTenants();
      setSelected(null);
    } catch (err: any) {
      alert(err.message || '승인 실패');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    setActionLoading(rejectModal);
    try {
      await rejectTenant(rejectModal, rejectReason);
      setRejectModal(null);
      setRejectReason('');
      await loadTenants();
      setSelected(null);
    } catch (err: any) {
      alert(err.message || '거부 실패');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setActionLoading(deleteConfirm);
    try {
      await deleteTenant(deleteConfirm);
      setDeleteConfirm(null);
      await loadTenants();
      setSelected(null);
    } catch (err: any) {
      alert(err.message || '삭제 실패');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_api_key');
    router.push('/admin');
  };

  const statusBadge = (status: string) => {
    const s = STATUS_MAP[status] || { label: status, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' };
    return (
      <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-lg border ${s.bg} ${s.color}`}>
        {s.label}
      </span>
    );
  };

  const pendingCount = tenants.filter(t => t.status === 'pending').length;

  return (
    <main className="min-h-screen bg-gray-50/50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Image src="/icon.svg" alt="Groumo" width={32} height={26} />
            </Link>
            <div className="h-6 w-px bg-gray-200" />
            <h1 className="text-lg font-bold text-[#1E1B3A]">관리자</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: '전체', value: pagination.total, color: 'from-[#6C3CE1] to-[#8B5CF6]' },
            { label: '대기', value: tenants.filter(t => t.status === 'pending').length, color: 'from-amber-400 to-amber-500' },
            { label: '배포됨', value: tenants.filter(t => t.status === 'deployed').length, color: 'from-emerald-400 to-emerald-500' },
            { label: '거부', value: tenants.filter(t => t.status === 'rejected').length, color: 'from-red-400 to-red-500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-[#1E1B3A]">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-100 p-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === tab.key
                  ? 'bg-[#6C3CE1] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {tab.key === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs bg-white/20 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">불러오는 중...</div>
          ) : tenants.length === 0 ? (
            <div className="p-12 text-center text-gray-400">신청 내역이 없습니다</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">단체</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">서브도메인</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">종류</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">회장</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">상태</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">신청일</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => setSelected(t)}
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-[#1E1B3A] text-sm">{t.organization_name}</div>
                        <div className="text-xs text-gray-400">{t.organization_name_en}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#8B5CF6] font-medium">{t.subdomain}.groumo.com</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{t.organization_type}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{t.president_name}</td>
                      <td className="px-5 py-4">{statusBadge(t.status)}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {new Date(t.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {t.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(t.id)}
                                disabled={actionLoading === t.id}
                                className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 border border-emerald-200 disabled:opacity-50 transition-colors"
                              >
                                {actionLoading === t.id ? '...' : '승인'}
                              </button>
                              <button
                                onClick={() => setRejectModal(t.id)}
                                className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 transition-colors"
                              >
                                거부
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setDeleteConfirm(t.id)}
                            className="px-3 py-1.5 text-xs font-semibold bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                전체 {pagination.total}건
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  이전
                </button>
                <span className="px-3 py-1.5 text-sm text-gray-600">
                  {page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#1E1B3A]">신청 상세</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl font-bold text-[#1E1B3A]">{selected.organization_name}</span>
                {statusBadge(selected.status)}
              </div>

              <dl className="space-y-3">
                {[
                  ['영문명', selected.organization_name_en],
                  ['서브도메인', `${selected.subdomain}.groumo.com`],
                  ['단체 종류', selected.organization_type],
                  ['학교', selected.school || '-'],
                  ['회장', selected.president_name],
                  ['연락처', selected.contact_phone],
                  ['이메일', selected.contact_email || '-'],
                  ['신청일', new Date(selected.created_at).toLocaleString('ko-KR')],
                  ...(selected.deployed_at ? [['배포일', new Date(selected.deployed_at).toLocaleString('ko-KR')]] : []),
                  ...(selected.rejection_reason ? [['거부 사유', selected.rejection_reason]] : []),
                  ...(selected.deployment_error ? [['배포 오류', selected.deployment_error]] : []),
                ].map(([label, value]) => (
                  <div key={label as string} className="flex">
                    <dt className="w-24 text-sm text-gray-500 shrink-0">{label}</dt>
                    <dd className="text-sm font-medium text-[#1E1B3A] break-all">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
              {selected.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleApprove(selected.id)}
                    disabled={actionLoading === selected.id}
                    className="flex-1 py-2.5 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {actionLoading === selected.id ? '처리 중...' : '승인 및 배포'}
                  </button>
                  <button
                    onClick={() => { setRejectModal(selected.id); setSelected(null); }}
                    className="flex-1 py-2.5 text-sm font-semibold bg-red-50 text-red-700 rounded-xl hover:bg-red-100 border border-red-200 transition-colors"
                  >
                    거부
                  </button>
                </>
              )}
              <button
                onClick={() => { setDeleteConfirm(selected.id); setSelected(null); }}
                className="px-4 py-2.5 text-sm font-semibold bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40" onClick={() => { setRejectModal(null); setRejectReason(''); }}>
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#1E1B3A]">신청 거부</h2>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">거부 사유</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] outline-none transition-all text-[#1E1B3A] placeholder-gray-400 resize-none"
                rows={3}
                placeholder="거부 사유를 입력하세요"
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2.5 text-sm font-semibold bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading === rejectModal}
                className="flex-1 py-2.5 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {actionLoading === rejectModal ? '처리 중...' : '거부'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#1E1B3A] mb-2">정말 삭제하시겠습니까?</h3>
              <p className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다. 배포된 테넌트의 경우 컨테이너도 함께 제거됩니다.</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 text-sm font-semibold bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === deleteConfirm}
                className="flex-1 py-2.5 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {actionLoading === deleteConfirm ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
