import { IsString, IsUUID, IsEnum, IsDateString, IsOptional, IsArray, ValidateNested, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';

export class MarkAttendanceDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.PRESENT })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({ example: 'Late by 10 minutes' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  remarks?: string;
}

export class BulkAttendanceDto {
  @ApiProperty()
  @IsUUID()
  classId: string;

  @ApiProperty()
  @IsUUID()
  sectionId: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'MORNING' })
  @IsOptional()
  @IsString()
  period?: string = 'MORNING';

  @ApiProperty({ type: [MarkAttendanceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarkAttendanceDto)
  attendances: MarkAttendanceDto[];
}

export class UpdateAttendanceDto {
  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.PRESENT })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({ example: 'Updated by headmaster' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  remarks?: string;
}

export class AttendanceQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-01-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  limit?: number = 50;
}

export class OfflineSyncDto {
  @ApiProperty({ type: [BulkAttendanceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceDto)
  records: BulkAttendanceDto[];
}