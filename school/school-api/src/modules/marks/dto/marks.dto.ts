import { IsNumber, IsOptional, IsString, IsUUID, IsEnum, Min, Max, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateMarkDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty()
  @IsUUID()
  examId: string;

  @ApiProperty()
  @IsUUID()
  subjectId: string;

  @ApiProperty({ example: 85 })
  @IsNumber()
  @Min(0)
  obtainedMarks: number;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  maxMarks: number;

  @ApiPropertyOptional({ example: 'Good effort' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  remarks?: string;
}

export class BulkMarksDto {
  @ApiProperty()
  @IsUUID()
  examId: string;

  @ApiProperty()
  @IsUUID()
  subjectId: string;

  @ApiProperty({ type: [CreateMarkDto] })
  marks: CreateMarkDto[];
}

export class UpdateMarkDto {
  @ApiPropertyOptional({ example: 85 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  obtainedMarks?: number;

  @ApiPropertyOptional({ example: 'Updated remarks' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  remarks?: string;

  @ApiPropertyOptional({ example: 'DRAFT' })
  @IsOptional()
  @IsEnum(['DRAFT', 'SUBMITTED', 'APPROVED', 'PUBLISHED'])
  status?: string;
}

export class MarksQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  examId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'PUBLISHED'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'SUBMITTED', 'APPROVED', 'PUBLISHED'])
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 50;
}