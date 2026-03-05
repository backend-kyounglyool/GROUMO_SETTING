'use client';

interface Props {
  data: any;
  onReset: () => void;
}

export default function SuccessMessage({ data, onReset }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 mb-5">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#1E1B3A] mb-2">신청이 완료되었습니다</h2>
        <p className="text-gray-500">
          관리자 승인 후 서비스를 이용하실 수 있습니다.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-4">신청 정보</h3>
        <dl className="space-y-3">
          <div className="flex">
            <dt className="w-28 text-gray-500 text-sm">단체명</dt>
            <dd className="flex-1 text-[#1E1B3A] font-medium text-sm">{data.organization_name}</dd>
          </div>
          <div className="flex">
            <dt className="w-28 text-gray-500 text-sm">단체 영문명</dt>
            <dd className="flex-1 text-[#1E1B3A] font-medium text-sm">{data.organization_name_en}</dd>
          </div>
          <div className="flex">
            <dt className="w-28 text-gray-500 text-sm">서브도메인</dt>
            <dd className="flex-1 text-[#8B5CF6] font-semibold text-sm">
              {data.subdomain}.groumo.com
            </dd>
          </div>
          <div className="flex">
            <dt className="w-28 text-gray-500 text-sm">단체 종류</dt>
            <dd className="flex-1 text-[#1E1B3A] font-medium text-sm">{data.organization_type}</dd>
          </div>
          {data.school && (
            <div className="flex">
              <dt className="w-28 text-gray-500 text-sm">학교</dt>
              <dd className="flex-1 text-[#1E1B3A] font-medium text-sm">{data.school}</dd>
            </div>
          )}
          <div className="flex">
            <dt className="w-28 text-gray-500 text-sm">회장</dt>
            <dd className="flex-1 text-[#1E1B3A] font-medium text-sm">{data.president_name}</dd>
          </div>
          <div className="flex">
            <dt className="w-28 text-gray-500 text-sm">연락처</dt>
            <dd className="flex-1 text-[#1E1B3A] font-medium text-sm">{data.contact_phone}</dd>
          </div>
          {data.contact_email && (
            <div className="flex">
              <dt className="w-28 text-gray-500 text-sm">이메일</dt>
              <dd className="flex-1 text-[#1E1B3A] font-medium text-sm">{data.contact_email}</dd>
            </div>
          )}
          <div className="flex">
            <dt className="w-28 text-gray-500 text-sm">신청 일시</dt>
            <dd className="flex-1 text-[#1E1B3A] font-medium text-sm">
              {new Date(data.created_at).toLocaleString('ko-KR')}
            </dd>
          </div>
        </dl>
      </div>

      <div className="bg-[#8B5CF6]/5 border border-[#8B5CF6]/10 rounded-xl p-5 mb-6">
        <h4 className="font-bold text-[#6C3CE1] text-sm mb-3">다음 단계</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-[#6C3CE1]/80">
          <li>관리자가 신청 내역을 검토합니다</li>
          <li>승인 완료 시 연락처로 안내 메시지를 발송합니다</li>
          <li>승인 즉시 <span className="font-semibold">{data.subdomain}.groumo.com</span>에서 서비스 이용 가능</li>
        </ol>
      </div>

      <button
        onClick={onReset}
        className="w-full py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors border border-gray-200"
      >
        다른 신청 하기
      </button>
    </div>
  );
}
