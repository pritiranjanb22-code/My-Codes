import { IsString, IsInt, Min, Max, IsUUID, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSectionDto {
  @ApiProperty({ example: 'A' })
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  name: string;

  @ApiProperty()
  @IsUUID()
  classId: string;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  capacity?: number = 40;
}

export class UpdateSectionDto {
  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  name?: string;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  capacity?: number;
}

export class SectionQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  classId?: string;

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