import { IsString, IsOptional, IsEnum, IsDateString, IsInt, Min, Max, IsEmail, Matches, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, StudentStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateStudentDto {
  @ApiProperty({ example: 'ADM2024001' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  admissionNo: string;

  @ApiProperty({ example: 'Rahul' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Sharma' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: '2015-06-15' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({ example: 'A+' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  bloodGroup?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  rollNumber: number;

  @ApiProperty({ example: '2024-04-01' })
  @IsDateString()
  admissionDate: string;

  @ApiPropertyOptional({ example: 'Previous School Name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  previousSchool?: string;

  @ApiPropertyOptional({ example: '123 Main St, Springfield' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/)
  emergencyContact?: string;

  @ApiProperty({ example: 'Rajesh Sharma' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fatherName: string;

  @ApiProperty({ example: 'Priya Sharma' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  motherName: string;

  @ApiPropertyOptional({ example: 'Rajesh Sharma' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  guardianName?: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/)
  parentPhone: string;

  @ApiPropertyOptional({ example: 'parent@email.com' })
  @IsOptional()
  @IsEmail()
  parentEmail?: string;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg' })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @ApiProperty()
  @IsUUID()
  classId: string;

  @ApiProperty()
  @IsUUID()
  sectionId: string;
}

export class UpdateStudentDto {
  @ApiPropertyOptional({ example: 'Rahul' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Sharma' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ example: '2015-06-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: 'A+' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  bloodGroup?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  rollNumber?: number;

  @ApiPropertyOptional({ example: 'Previous School Name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  previousSchool?: string;

  @ApiPropertyOptional({ example: '123 Main St, Springfield' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/)
  emergencyContact?: string;

  @ApiPropertyOptional({ example: 'Rajesh Sharma' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fatherName?: string;

  @ApiPropertyOptional({ example: 'Priya Sharma' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  motherName?: string;

  @ApiPropertyOptional({ example: 'Rajesh Sharma' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  guardianName?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/)
  parentPhone?: string;

  @ApiPropertyOptional({ example: 'parent@email.com' })
  @IsOptional()
  @IsEmail()
  parentEmail?: string;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg' })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @ApiPropertyOptional({ enum: StudentStatus })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;
}

export class BulkCreateStudentDto {
  @ApiProperty({ type: [CreateStudentDto] })
  students: CreateStudentDto[];
}

export class StudentQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiPropertyOptional({ enum: StudentStatus })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class PromoteStudentDto {
  @ApiProperty()
  @IsUUID()
  newClassId: string;

  @ApiProperty()
  @IsUUID()
  newSectionId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  newRollNumber: number;
}

export class TransferStudentDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  newSchoolName: string;

  @ApiProperty()
  @IsDateString()
  transferDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}