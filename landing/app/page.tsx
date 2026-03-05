'use client';

import { useState } from 'react';
import ApplicationForm from './components/ApplicationForm';
import SuccessMessage from './components/SuccessMessage';

export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  const [applicationData, setApplicationData] = useState<any>(null);

  const handleSuccess = (data: any) => {
    setApplicationData(data);
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setApplicationData(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            GROUMO
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            동아리/단체 전용 랜덤 그룹 매칭 플랫폼
          </p>
          <p className="text-lg text-gray-500">
            단체 전용 서브도메인을 제공받아 독립적인 매칭 서비스를 운영하세요
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">🔗</div>
            <h3 className="font-bold text-lg mb-2">전용 도메인</h3>
            <p className="text-gray-600 text-sm">
              {'{'}단체명{'}'}.groumo.com 형태의<br />
              전용 서브도메인 제공
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="font-bold text-lg mb-2">독립적 운영</h3>
            <p className="text-gray-600 text-sm">
              단체별 독립 데이터베이스로<br />
              안전한 정보 관리
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold text-lg mb-2">즉시 배포</h3>
            <p className="text-gray-600 text-sm">
              승인 즉시 자동 배포로<br />
              빠른 서비스 시작
            </p>
          </div>
        </div>

        {/* Main Content */}
        {submitted ? (
          <SuccessMessage data={applicationData} onReset={handleReset} />
        ) : (
          <ApplicationForm onSuccess={handleSuccess} />
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>문의: admin@groumo.com</p>
          <p className="mt-2">© 2026 GROUMO. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}
