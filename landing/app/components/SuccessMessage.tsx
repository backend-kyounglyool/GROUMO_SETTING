'use client';

interface Props {
  data: any;
  onReset: () => void;
}

export default function SuccessMessage({ data, onReset }: Props) {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-6">
        <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
          <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">신청이 완료되었습니다!</h2>
        <p className="text-gray-600">
          관리자 승인 후 서비스를 이용하실 수 있습니다.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="font-bold text-lg mb-4 text-gray-800">신청 정보</h3>
        <dl className="space-y-3">
          <div className="flex">
            <dt className="w-32 text-gray-600 font-medium">단체명:</dt>
            <dd className="flex-1 text-gray-900">{data.organization_name}</dd>
          </div>
          <div className="flex">
            <dt className="w-32 text-gray-600 font-medium">단체 영문명:</dt>
            <dd className="flex-1 text-gray-900">{data.organization_name_en}</dd>
          </div>
          <div className="flex">
            <dt className="w-32 text-gray-600 font-medium">서브도메인:</dt>
            <dd className="flex-1 text-blue-600 font-medium">
              {data.subdomain}.groumo.com
            </dd>
          </div>
          <div className="flex">
            <dt className="w-32 text-gray-600 font-medium">단체 종류:</dt>
            <dd className="flex-1 text-gray-900">{data.organization_type}</dd>
          </div>
          {data.school && (
            <div className="flex">
              <dt className="w-32 text-gray-600 font-medium">학교:</dt>
              <dd className="flex-1 text-gray-900">{data.school}</dd>
            </div>
          )}
          <div className="flex">
            <dt className="w-32 text-gray-600 font-medium">회장:</dt>
            <dd className="flex-1 text-gray-900">{data.president_name}</dd>
          </div>
          <div className="flex">
            <dt className="w-32 text-gray-600 font-medium">연락처:</dt>
            <dd className="flex-1 text-gray-900">{data.contact_phone}</dd>
          </div>
          {data.contact_email && (
            <div className="flex">
              <dt className="w-32 text-gray-600 font-medium">이메일:</dt>
              <dd className="flex-1 text-gray-900">{data.contact_email}</dd>
            </div>
          )}
          <div className="flex">
            <dt className="w-32 text-gray-600 font-medium">신청 일시:</dt>
            <dd className="flex-1 text-gray-900">
              {new Date(data.created_at).toLocaleString('ko-KR')}
            </dd>
          </div>
        </dl>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-bold text-blue-900 mb-2">다음 단계</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>관리자가 신청 내역을 검토합니다</li>
          <li>승인 완료 시 연락처로 안내 메시지를 발송합니다</li>
          <li>승인 즉시 {data.subdomain}.groumo.com에서 서비스를 이용하실 수 있습니다</li>
        </ol>
      </div>

      <button
        onClick={onReset}
        className="w-full py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
      >
        다른 신청 하기
      </button>
    </div>
  );
}
