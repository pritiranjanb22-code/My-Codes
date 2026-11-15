import { IsString, IsDateString, IsUUID, IsOptional, IsEnum, IsInt, Min, Max, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateExamTypeDto {
  @ApiProperty({ example: 'Quarterly Examination' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'QUARTERLY' })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: 25 })
  @IsInt()
  @Min(1)
  @Max(100)
  weightage: number;
}

export class CreateExamDto {
  @ApiProperty({ example: 'Quarterly Exam 2024' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty()
  @IsUUID()
  examTypeId: string;

  @ApiProperty()
  @IsUUID()
  academicYearId: string;

  @ApiProperty({ example: '2024-09-15' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-09-25' })
  @IsDateString()
  endDate: string;
}

export class CreateExamSubjectDto {
  @ApiProperty()
  @IsUUID()
  subjectId: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  @Max(500)
  maxMarks: number;

  @ApiProperty({ example: 33 })
  @IsInt()
  @Min(1)
  passMarks: number;

  @ApiProperty({ example: '2024-09-15' })
  @IsDateString()
  date: string;
}

export class ExamQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  examTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;
}