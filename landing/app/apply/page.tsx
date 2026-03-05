'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ApplicationForm from '../components/ApplicationForm';
import SuccessMessage from '../components/SuccessMessage';

export default function ApplyPage() {
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
    <main className="min-h-screen bg-gray-50/50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.svg" alt="Groumo" width={140} height={45} priority />
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            홈으로
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#1E1B3A] mb-3">분양 신청</h1>
          <p className="text-gray-500">
            단체 정보를 입력하고 전용 서브도메인을 신청하세요
          </p>
        </div>

        {submitted ? (
          <SuccessMessage data={applicationData} onReset={handleReset} />
        ) : (
          <ApplicationForm onSuccess={handleSuccess} />
        )}
      </div>
    </main>
  );
}
