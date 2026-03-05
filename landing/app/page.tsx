import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Image src="/logo.svg" alt="Groumo" width={140} height={45} priority />
          <Link
            href="/apply"
            className="px-5 py-2.5 bg-gradient-to-r from-[#6C3CE1] to-[#8B5CF6] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            분양 신청
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <Image src="/icon.svg" alt="Groumo Icon" width={80} height={65} />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-[#1E1B3A] mb-6 leading-tight tracking-tight">
            우리 동아리만의
            <br />
            <span className="bg-gradient-to-r from-[#6C3CE1] via-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">
              관리 서비스
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            동아리, 소모임, 학생회를 위한 전용 서브도메인 기반의
            <br className="hidden md:block" />
            독립적인 동아리 관리 서비스
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="px-8 py-4 bg-gradient-to-r from-[#6C3CE1] to-[#8B5CF6] text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity text-lg shadow-lg shadow-purple-200"
            >
              무료로 시작하기
            </Link>
            <a
              href="#features"
              className="px-8 py-4 bg-gray-50 text-gray-700 font-semibold rounded-2xl hover:bg-gray-100 transition-colors text-lg border border-gray-200"
            >
              더 알아보기
            </a>
          </div>
        </div>
      </section>

      {/* Preview mockup */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-[#6C3CE1]/5 via-[#8B5CF6]/5 to-[#06B6D4]/5 rounded-3xl border border-gray-100 p-8 md:p-12">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-[#1E1B3A] mb-1">1,200+</div>
                <div className="text-sm text-gray-500">활성 사용자</div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#22D3EE] flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-[#1E1B3A] mb-1">50+</div>
                <div className="text-sm text-gray-500">입점 단체</div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C3CE1] to-[#7C3AED] flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-[#1E1B3A] mb-1">5,000+</div>
                <div className="text-sm text-gray-500">활동 관리</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-gray-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-[#8B5CF6] mb-3 tracking-wide uppercase">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1E1B3A]">
              왜 Groumo인가요?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6C3CE1] to-[#8B5CF6] flex items-center justify-center mb-5">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#1E1B3A] mb-3">전용 서브도메인</h3>
              <p className="text-gray-500 leading-relaxed">
                <span className="font-medium text-[#8B5CF6]">단체명.groumo.com</span> 형태의
                전용 URL로 우리 동아리만의 브랜드를 가진 관리 서비스를 운영할 수 있습니다.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#22D3EE] flex items-center justify-center mb-5">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#1E1B3A] mb-3">독립 데이터 관리</h3>
              <p className="text-gray-500 leading-relaxed">
                단체별 완전히 분리된 데이터베이스로 회원 정보와 활동 기록을 안전하게 관리합니다.
                다른 단체와 데이터가 섞일 걱정이 없습니다.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center mb-5">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#1E1B3A] mb-3">즉시 자동 배포</h3>
              <p className="text-gray-500 leading-relaxed">
                신청 승인 즉시 서비스가 자동으로 배포됩니다.
                복잡한 서버 설정 없이 바로 동아리 관리를 시작할 수 있습니다.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6C3CE1] to-[#06B6D4] flex items-center justify-center mb-5">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#1E1B3A] mb-3">통합 관리 도구</h3>
              <p className="text-gray-500 leading-relaxed">
                회원 관리, 일정 관리, 공지사항 등 동아리 운영에 필요한
                모든 기능을 한 곳에서 해결합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-[#06B6D4] mb-3 tracking-wide uppercase">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1E1B3A]">
              3단계로 시작하세요
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C3CE1] to-[#8B5CF6] flex items-center justify-center mx-auto mb-5 text-white text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-bold text-[#1E1B3A] mb-2">분양 신청</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                단체 정보와 원하는 서브도메인을 입력하고 신청서를 제출합니다.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center mx-auto mb-5 text-white text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-bold text-[#1E1B3A] mb-2">관리자 승인</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                관리자가 신청 내역을 검토하고 승인하면 자동으로 서비스가 배포됩니다.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#06B6D4] to-[#22D3EE] flex items-center justify-center mx-auto mb-5 text-white text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-bold text-[#1E1B3A] mb-2">서비스 이용</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                전용 도메인으로 접속해 회원을 초대하고 동아리 관리를 시작하세요.
              </p>
            </div>
          </div>

          <div className="text-center mt-14">
            <Link
              href="/apply"
              className="inline-flex px-8 py-4 bg-gradient-to-r from-[#6C3CE1] to-[#8B5CF6] text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity text-lg shadow-lg shadow-purple-200"
            >
              지금 신청하기
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Image src="/logo.svg" alt="Groumo" width={100} height={32} />
          <p className="text-sm text-gray-400">
            &copy; 2026 Groumo. All rights reserved.
          </p>
          <p className="text-sm text-gray-400">
            admin@groumo.com
          </p>
        </div>
      </footer>
    </main>
  );
}
