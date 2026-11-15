import { IsString, IsOptional, IsInt, Min, Max, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateClassDto {
  @ApiProperty({ example: 'Class 5' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Max(8)
  level: number;

  @ApiProperty()
  @IsUUID()
  academicYearId: string;
}

export class UpdateClassDto {
  @ApiPropertyOptional({ example: 'Class 5' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  level?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  classTeacherId?: string;
}

export class ClassQueryDto {
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