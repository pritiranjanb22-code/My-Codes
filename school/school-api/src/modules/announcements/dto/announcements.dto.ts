import { IsString, IsOptional, IsEnum, IsDateString, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'School Reopening' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'School will reopen on June 1st' })
  @IsString()
  @MinLength(10)
  content: string;

  @ApiPropertyOptional({ example: 'https://example.com/notice.pdf' })
  @IsOptional()
  @IsUrl()
  attachmentUrl?: string;

  @ApiProperty({ enum: ['ALL_PARENTS', 'ALL_TEACHERS', 'ALL_STUDENTS', 'CLASS', 'SECTION'], example: 'ALL_PARENTS' })
  @IsEnum(['ALL_PARENTS', 'ALL_TEACHERS', 'ALL_STUDENTS', 'CLASS', 'SECTION'])
  targetAudience: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  targetClassId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  targetSectionId?: string;

  @ApiPropertyOptional({ example: '2024-06-01T08:00:00Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateAnnouncementDto {
  @ApiPropertyOptional({ example: 'School Reopening' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'School will reopen on June 1st' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  content?: string;

  @ApiPropertyOptional({ example: 'https://example.com/notice.pdf' })
  @IsOptional()
  @IsUrl()
  attachmentUrl?: string;

  @ApiPropertyOptional({ enum: ['ALL_PARENTS', 'ALL_TEACHERS', 'ALL_STUDENTS', 'CLASS', 'SECTION'] })
  @IsOptional()
  @IsEnum(['ALL_PARENTS', 'ALL_TEACHERS', 'ALL_STUDENTS', 'CLASS', 'SECTION'])
  targetAudience?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  targetClassId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  targetSectionId?: string;

  @ApiPropertyOptional({ example: '2024-06-01T08:00:00Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class AnnouncementQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['ALL_PARENTS', 'ALL_TEACHERS', 'ALL_STUDENTS', 'CLASS', 'SECTION'] })
  @IsOptional()
  @IsEnum(['ALL_PARENTS', 'ALL_TEACHERS', 'ALL_STUDENTS', 'CLASS', 'SECTION'])
  targetAudience?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  limit?: number = 10;
}