import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto, TeacherAssignmentDto, TeacherQueryDto } from './dto/teachers.dto';
import { Role, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTeacherDto, schoolId: string, createdById: string) {
    const [existingUser, existingEmployee] = await Promise.all([
      this.prisma.user.findFirst({ where: { OR: [{ email: dto.email }, { phone: dto.phone }] } }),
      this.prisma.teacher.findFirst({ where: { employeeId: dto.employeeId, schoolId } }),
    ]);

    if (existingUser) throw new ConflictException('Email or phone already registered');
    if (existingEmployee) throw new ConflictException('Employee ID already exists');

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: Role.TEACHER,
        firstName: dto.firstName,
        lastName: dto.lastName,
        schoolId,
        createdById,
        status: UserStatus.PENDING,
      },
    });

    const teacher = await this.prisma.teacher.create({
      data: {
        userId: user.id,
        employeeId: dto.employeeId,
        dateOfJoining: new Date(dto.dateOfJoining),
        qualification: dto.qualification,
        experience: dto.experience,
        schoolId,
        status: UserStatus.PENDING,
      },
    });

    if (dto.subjectIds && dto.classSectionIds) {
      const academicYear = await this.prisma.academicYear.findFirst({ where: { schoolId, status: 'CURRENT' } });
      if (academicYear) {
        for (const subjectId of dto.subjectIds) {
          for (const classSectionId of dto.classSectionIds) {
            const [classId, sectionId] = classSectionId.split('_');
            await this.prisma.teacherAssignment.create({
              data: {
                teacherId: teacher.id,
                classId,
                sectionId,
                subjectId,
                schoolId,
                academicYearId: academicYear.id,
              },
            });
          }
        }
      }
    }

    return { user: this.sanitizeUser(user), teacher };
  }

  async findAll(query: TeacherQueryDto, schoolId: string) {
    const { search, classId, sectionId, subjectId, status, page = 1, limit = 10 } = query;
    const where: any = { schoolId };

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      };
    }

    if (classId || sectionId || subjectId) {
      where.assignments = {
        some: {},
      };
      if (classId) where.assignments.some.classId = classId;
      if (sectionId) where.assignments.some.sectionId = sectionId;
      if (subjectId) where.assignments.some.subjectId = subjectId;
    }

    if (status) where.status = status;

    const [teachers, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where,
        include: {
          user: true,
          assignments: { include: { class: true, section: true, subject: true } },
          classes: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.teacher.count({ where }),
    ]);

    return { data: teachers.map(t => ({ ...t, user: this.sanitizeUser(t.user) })), meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, schoolId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id, schoolId },
      include: {
        user: true,
        assignments: { include: { class: true, section: true, subject: true, academicYear: true } },
        classes: true,
        subjects: true,
      },
    });

    if (!teacher) throw new NotFoundException('Teacher not found');
    return { ...teacher, user: this.sanitizeUser(teacher.user) };
  }

  async findByUserId(userId: string, schoolId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId, schoolId },
      include: {
        user: true,
        assignments: { include: { class: true, section: true, subject: true, academicYear: true } },
        classes: true,
        subjects: true,
      },
    });

    if (!teacher) throw new NotFoundException('Teacher not found');
    return { ...teacher, user: this.sanitizeUser(teacher.user) };
  }

  async update(id: string, dto: UpdateTeacherDto, schoolId: string) {
    await this.findOne(id, schoolId);

    if (dto.subjectIds) {
      const academicYear = await this.prisma.academicYear.findFirst({ where: { schoolId, status: 'CURRENT' } });
      if (academicYear) {
        await this.prisma.teacherAssignment.deleteMany({ where: { teacherId: id, academicYearId: academicYear.id } });
        for (const subjectId of dto.subjectIds) {
          const assignments = await this.prisma.teacherAssignment.findMany({ where: { teacherId: id, subjectId, academicYearId: academicYear.id } });
          for (const a of assignments) {
            await this.prisma.teacherAssignment.create({
              data: { teacherId: id, classId: a.classId, sectionId: a.sectionId, subjectId, schoolId, academicYearId: academicYear.id },
            });
          }
        }
      }
    }

    const updated = await this.prisma.teacher.update({
      where: { id },
      data: dto,
      include: { user: true, assignments: { include: { class: true, section: true, subject: true } } },
    });

    return { ...updated, user: this.sanitizeUser(updated.user) };
  }

  async approve(id: string, schoolId: string) {
    const teacher = await this.findOne(id, schoolId);

    if (teacher.status === UserStatus.ACTIVE) throw new ConflictException('Teacher is already active');

    await this.prisma.user.update({ where: { id: teacher.userId }, data: { status: UserStatus.ACTIVE } });
    return this.prisma.teacher.update({ where: { id }, data: { status: UserStatus.ACTIVE } });
  }

  async suspend(id: string, schoolId: string) {
    const teacher = await this.findOne(id, schoolId);

    if (teacher.status === UserStatus.SUSPENDED) throw new ConflictException('Teacher is already suspended');

    await this.prisma.user.update({ where: { id: teacher.userId }, data: { status: UserStatus.SUSPENDED } });
    return this.prisma.teacher.update({ where: { id }, data: { status: UserStatus.SUSPENDED } });
  }

  async activate(id: string, schoolId: string) {
    const teacher = await this.findOne(id, schoolId);

    if (teacher.status === UserStatus.ACTIVE) throw new ConflictException('Teacher is already active');

    await this.prisma.user.update({ where: { id: teacher.userId }, data: { status: UserStatus.ACTIVE } });
    return this.prisma.teacher.update({ where: { id }, data: { status: UserStatus.ACTIVE } });
  }

  async assignSubject(dto: TeacherAssignmentDto, schoolId: string) {
    const [teacher, classExists, sectionExists, subjectExists, academicYear] = await Promise.all([
      this.prisma.teacher.findFirst({ where: { id: dto.teacherId, schoolId } }),
      this.prisma.class.findFirst({ where: { id: dto.classId, schoolId } }),
      this.prisma.section.findFirst({ where: { id: dto.sectionId, schoolId, classId: dto.classId } }),
      this.prisma.subject.findFirst({ where: { id: dto.subjectId, schoolId } }),
      this.prisma.academicYear.findFirst({ where: { id: dto.academicYearId, schoolId } }),
    ]);

    if (!teacher) throw new NotFoundException('Teacher not found');
    if (!classExists) throw new NotFoundException('Class not found');
    if (!sectionExists) throw new NotFoundException('Section not found');
    if (!subjectExists) throw new NotFoundException('Subject not found');
    if (!academicYear) throw new NotFoundException('Academic year not found');

    const existing = await this.prisma.teacherAssignment.findUnique({
      where: {
        teacherId_classId_sectionId_subjectId_academicYearId: {
          teacherId: dto.teacherId,
          classId: dto.classId,
          sectionId: dto.sectionId,
          subjectId: dto.subjectId,
          academicYearId: dto.academicYearId,
        },
      },
    });

    if (existing) throw new ConflictException('Assignment already exists');

    return this.prisma.teacherAssignment.create({ data: { ...dto, schoolId } });
  }

  async removeAssignment(teacherId: string, assignmentId: string, schoolId: string) {
    const assignment = await this.prisma.teacherAssignment.findFirst({ where: { id: assignmentId, teacherId, schoolId } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return this.prisma.teacherAssignment.delete({ where: { id: assignmentId } });
  }

  async getMyClasses(teacherId: string, schoolId: string) {
    const academicYear = await this.prisma.academicYear.findFirst({ where: { schoolId, status: 'CURRENT' } });
    if (!academicYear) return [];

    return this.prisma.teacherAssignment.findMany({
      where: { teacherId, schoolId, academicYearId: academicYear.id },
      include: { class: true, section: true, subject: true },
    });
  }

  async getStats(schoolId: string) {
    const [total, active, pending, suspended, bySubject] = await Promise.all([
      this.prisma.teacher.count({ where: { schoolId } }),
      this.prisma.teacher.count({ where: { schoolId, status: UserStatus.ACTIVE } }),
      this.prisma.teacher.count({ where: { schoolId, status: UserStatus.PENDING } }),
      this.prisma.teacher.count({ where: { schoolId, status: UserStatus.SUSPENDED } }),
      this.prisma.teacherAssignment.groupBy({ by: ['subjectId'], where: { schoolId }, _count: true }),
    ]);

    const subjectStats = await Promise.all(
      bySubject.map(async (s) => {
        const sub = await this.prisma.subject.findUnique({ where: { id: s.subjectId } });
        return { subject: sub?.name, count: s._count };
      })
    );

    return { total, active, pending, suspended, bySubject: subjectStats };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, refreshToken, resetToken, resetTokenExpiry, ...sanitized } = user;
    return sanitized;
  }
}