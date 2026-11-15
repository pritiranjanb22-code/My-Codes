import { IsString, IsOptional, IsDateString, IsUUID, MinLength, MaxLength, Matches, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserStatus } from '@prisma/client';

export class CreateTeacherDto {
  @ApiProperty({ example: 'EMP001' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  employeeId: string;

  @ApiProperty({ example: '2020-06-15' })
  @IsDateString()
  dateOfJoining: string;

  @ApiPropertyOptional({ example: 'M.Sc Mathematics' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  qualification?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(50)
  experience?: number;

  @ApiPropertyOptional({ example: ['MATHEMATICS', 'PHYSICS'] })
  @IsOptional()
  @IsUUID('4', { each: true })
  subjectIds?: string[];

  @ApiPropertyOptional({ example: ['CLASS_5_A', 'CLASS_6_B'] })
  @IsOptional()
  classSectionIds?: string[];

  @ApiProperty({ example: 'teacher@school.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/)
  phone: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  password: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;
}

export class UpdateTeacherDto {
  @ApiPropertyOptional({ example: 'M.Sc Mathematics' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  qualification?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(50)
  experience?: number;

  @ApiPropertyOptional({ example: ['MATHEMATICS', 'PHYSICS'] })
  @IsOptional()
  @IsUUID('4', { each: true })
  subjectIds?: string[];

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  status?: UserStatus;
}

export class TeacherAssignmentDto {
  @ApiProperty()
  @IsUUID()
  teacherId: string;

  @ApiProperty()
  @IsUUID()
  classId: string;

  @ApiProperty()
  @IsUUID()
  sectionId: string;

  @ApiProperty()
  @IsUUID()
  subjectId: string;

  @ApiProperty()
  @IsUUID()
  academicYearId: string;
}

export class TeacherQueryDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  status?: UserStatus;

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