'use client';

import { useState } from 'react';

const ORGANIZATION_TYPES = [
  '중앙동아리',
  '가등록동아리',
  '소모임',
  '스터디',
  '연합동아리',
  '학생회',
  '기타'
];

interface FormData {
  organization_name: string;
  organization_name_en: string;
  organization_type: string;
  school: string;
  president_name: string;
  contact_phone: string;
  contact_email: string;
}

interface Props {
  onSuccess: (data: any) => void;
}

export default function ApplicationForm({ onSuccess }: Props) {
  const [formData, setFormData] = useState<FormData>({
    organization_name: '',
    organization_name_en: '',
    organization_type: '',
    school: '',
    president_name: '',
    contact_phone: '',
    contact_email: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (name === 'organization_name_en') {
      setSubdomainAvailable(null);
    }
  };

  const checkSubdomain = async () => {
    if (!formData.organization_name_en) return;

    setCheckingSubdomain(true);
    setSubdomainAvailable(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tenants/check/subdomain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        },
        body: JSON.stringify({ subdomain: formData.organization_name_en.toLowerCase() })
      });

      const data = await res.json();

      if (data.success) {
        setSubdomainAvailable(data.available);
      }
    } catch (error) {
      console.error('Subdomain check failed:', error);
    } finally {
      setCheckingSubdomain(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.organization_name.trim()) {
      newErrors.organization_name = '단체명은 필수입니다';
    }

    if (!formData.organization_name_en.trim()) {
      newErrors.organization_name_en = '단체 영문명은 필수입니다';
    } else if (!/^[a-zA-Z0-9-]+$/.test(formData.organization_name_en)) {
      newErrors.organization_name_en = '영문, 숫자, 하이픈만 사용 가능합니다';
    }

    if (!formData.organization_type) {
      newErrors.organization_type = '단체 종류를 선택하세요';
    }

    if (!formData.president_name.trim()) {
      newErrors.president_name = '회장 이름은 필수입니다';
    }

    if (!formData.contact_phone.trim()) {
      newErrors.contact_phone = '연락처는 필수입니다';
    }

    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = '유효한 이메일 주소를 입력하세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (subdomainAvailable === false) {
      setErrors({ organization_name_en: '이미 사용 중인 영문명입니다' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tenants/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        onSuccess(data.data);
      } else {
        if (data.errors) {
          const errorMap: Record<string, string> = {};
          data.errors.forEach((err: any) => {
            errorMap[err.field] = err.message;
          });
          setErrors(errorMap);
        } else {
          alert(data.error || '신청 중 오류가 발생했습니다');
        }
      }
    } catch (error) {
      console.error('Application failed:', error);
      alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] outline-none transition-all text-[#1E1B3A] placeholder-gray-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-2";

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 단체명 */}
        <div>
          <label className={labelClass}>
            단체명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="organization_name"
            value={formData.organization_name}
            onChange={handleChange}
            className={inputClass}
            placeholder="예: 컴퓨터공학과 중앙동아리"
          />
          {errors.organization_name && (
            <p className="mt-1.5 text-sm text-red-500">{errors.organization_name}</p>
          )}
        </div>

        {/* 단체 영문명 */}
        <div>
          <label className={labelClass}>
            단체 영문명 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="organization_name_en"
              value={formData.organization_name_en}
              onChange={handleChange}
              className={`flex-1 ${inputClass}`}
              placeholder="예: computer-club"
            />
            <button
              type="button"
              onClick={checkSubdomain}
              disabled={!formData.organization_name_en || checkingSubdomain}
              className="px-4 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap border border-gray-200"
            >
              {checkingSubdomain ? '확인 중...' : '중복 확인'}
            </button>
          </div>
          {subdomainAvailable !== null && (
            <p className={`mt-1.5 text-sm ${subdomainAvailable ? 'text-emerald-600' : 'text-red-500'}`}>
              {subdomainAvailable ? '사용 가능한 영문명입니다' : '이미 사용 중인 영문명입니다'}
            </p>
          )}
          <p className="mt-1.5 text-sm text-gray-400">
            {formData.organization_name_en ?
              `도메인: ${formData.organization_name_en.toLowerCase()}.groumo.com` :
              '영문, 숫자, 하이픈만 사용 가능'
            }
          </p>
          {errors.organization_name_en && (
            <p className="mt-1.5 text-sm text-red-500">{errors.organization_name_en}</p>
          )}
        </div>

        {/* 단체 종류 */}
        <div>
          <label className={labelClass}>
            단체 종류 <span className="text-red-500">*</span>
          </label>
          <select
            name="organization_type"
            value={formData.organization_type}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">선택하세요</option>
            {ORGANIZATION_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.organization_type && (
            <p className="mt-1.5 text-sm text-red-500">{errors.organization_type}</p>
          )}
        </div>

        {/* 학교 */}
        <div>
          <label className={labelClass}>학교 (선택)</label>
          <input
            type="text"
            name="school"
            value={formData.school}
            onChange={handleChange}
            className={inputClass}
            placeholder="예: 서울대학교"
          />
        </div>

        {/* 회장 */}
        <div>
          <label className={labelClass}>
            회장 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="president_name"
            value={formData.president_name}
            onChange={handleChange}
            className={inputClass}
            placeholder="이름 입력"
          />
          {errors.president_name && (
            <p className="mt-1.5 text-sm text-red-500">{errors.president_name}</p>
          )}
        </div>

        {/* 연락처 */}
        <div>
          <label className={labelClass}>
            연락처 <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="contact_phone"
            value={formData.contact_phone}
            onChange={handleChange}
            className={inputClass}
            placeholder="010-1234-5678"
          />
          {errors.contact_phone && (
            <p className="mt-1.5 text-sm text-red-500">{errors.contact_phone}</p>
          )}
        </div>

        {/* 이메일 */}
        <div>
          <label className={labelClass}>이메일 (선택)</label>
          <input
            type="email"
            name="contact_email"
            value={formData.contact_email}
            onChange={handleChange}
            className={inputClass}
            placeholder="example@email.com"
          />
          {errors.contact_email && (
            <p className="mt-1.5 text-sm text-red-500">{errors.contact_email}</p>
          )}
        </div>

        {/* 제출 */}
        <button
          type="submit"
          disabled={loading || subdomainAvailable === false}
          className="w-full py-3.5 bg-gradient-to-r from-[#6C3CE1] to-[#8B5CF6] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg shadow-purple-200"
        >
          {loading ? '신청 중...' : '분양 신청하기'}
        </button>

        <p className="text-sm text-gray-400 text-center">
          신청 후 관리자 승인이 완료되면 서비스를 이용하실 수 있습니다.
        </p>
      </form>
    </div>
  );
}
