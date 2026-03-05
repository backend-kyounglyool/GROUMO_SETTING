import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CheckSubdomainDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/)
  subdomain: string;
}
