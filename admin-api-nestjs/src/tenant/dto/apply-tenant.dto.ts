import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsIn,
  Matches,
  MinLength,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const ORGANIZATION_TYPES = [
  '중앙동아리',
  '가등록동아리',
  '소모임',
  '스터디',
  '연합동아리',
  '학생회',
  '기타',
] as const;

export class ApplyTenantDto {
  @IsString()
  @IsNotEmpty({ message: '단체명은 필수입니다' })
  organization_name: string;

  @IsString()
  @IsNotEmpty({ message: '단체 영문명은 필수입니다' })
  @Matches(/^[a-zA-Z0-9-]+$/, {
    message: '단체 영문명은 영문, 숫자, 하이픈만 가능합니다',
  })
  @MinLength(2, { message: '단체 영문명은 2-50자여야 합니다' })
  @MaxLength(50, { message: '단체 영문명은 2-50자여야 합니다' })
  organization_name_en: string;

  @IsString()
  @IsNotEmpty({ message: '단체 종류는 필수입니다' })
  @IsIn(ORGANIZATION_TYPES, { message: '유효한 단체 종류를 선택하세요' })
  organization_type: string;

  @IsOptional()
  @IsString()
  school?: string;

  @IsString()
  @IsNotEmpty({ message: '회장 이름은 필수입니다' })
  president_name: string;

  @IsString()
  @IsNotEmpty({ message: '연락처는 필수입니다' })
  contact_phone: string;

  @IsOptional()
  @IsEmail({}, { message: '유효한 이메일을 입력하세요' })
  @ValidateIf((o) => o.contact_email !== '' && o.contact_email != null)
  contact_email?: string;
}
