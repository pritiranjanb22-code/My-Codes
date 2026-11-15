import { PrismaClient, Role, UserStatus, SchoolStatus, Gender, AttendanceStatus, AcademicYearStatus, StudentStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Super Admin
  const superAdminPassword = await argon2.hash('SuperAdmin123!');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@school.com' },
    update: {},
    create: {
      email: 'superadmin@school.com',
      phone: '+919999999999',
      passwordHash: superAdminPassword,
      role: Role.SUPER_ADMIN,
      firstName: 'Super',
      lastName: 'Admin',
      status: UserStatus.ACTIVE,
      emailVerified: true,
      phoneVerified: true,
    },
  });
  console.log('✅ Super Admin created:', superAdmin.email);

  // Create Demo School
  const school = await prisma.school.upsert({
    where: { code: 'DEMO001' },
    update: {},
    create: {
      name: 'Demo High School',
      code: 'DEMO001',
      address: '123 Demo Street, Demo City',
      phone: '+919876543210',
      email: 'demo@school.com',
      registrationNo: 'REG-DEMO-001',
      status: SchoolStatus.ACTIVE,
    },
  });
  console.log('✅ Demo School created:', school.name);

  // Create Headmaster
  const hmPassword = await argon2.hash('Headmaster123!');
  const headmasterUser = await prisma.user.upsert({
    where: { email: 'headmaster@demo.com' },
    update: {},
    create: {
      email: 'headmaster@demo.com',
      phone: '+919876543211',
      passwordHash: hmPassword,
      role: Role.HEADMASTER,
      firstName: 'Principal',
      lastName: 'Sharma',
      schoolId: school.id,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      phoneVerified: true,
    },
  });
  console.log('✅ Headmaster created:', headmasterUser.email);

  // Create Academic Year
  const currentYear = new Date().getFullYear();
  const academicYear = await prisma.academicYear.upsert({
    where: { name_schoolId: { name: `${currentYear}-${currentYear + 1}`, schoolId: school.id } },
    update: {},
    create: {
      name: `${currentYear}-${currentYear + 1}`,
      startDate: new Date(`${currentYear}-04-01`),
      endDate: new Date(`${currentYear + 1}-03-31`),
      status: AcademicYearStatus.CURRENT,
      schoolId: school.id,
    },
  });
  console.log('✅ Academic Year created:', academicYear.name);

  // Create Classes
  const classes = [];
  for (let i = 1; i <= 8; i++) {
    const cls = await prisma.class.upsert({
      where: { name_academicYearId_schoolId: { name: `Class ${i}`, academicYearId: academicYear.id, schoolId: school.id } },
      update: {},
      create: {
        name: `Class ${i}`,
        level: i,
        academicYearId: academicYear.id,
        schoolId: school.id,
      },
    });
    classes.push(cls);
  }
  console.log('✅ Classes created: 8');

  // Create Sections
  for (const cls of classes) {
    for (const sectionName of ['A', 'B']) {
      await prisma.section.upsert({
        where: { name_classId_schoolId: { name: sectionName, classId: cls.id, schoolId: school.id } },
        update: {},
        create: {
          name: sectionName,
          classId: cls.id,
          schoolId: school.id,
          capacity: 40,
        },
      });
    }
  }
  console.log('✅ Sections created: 16');

  // Create Subjects
  const subjectNames = ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Computer', 'General Knowledge'];
  for (const cls of classes) {
    for (const section of ['A', 'B']) {
      const sec = await prisma.section.findFirst({ where: { classId: cls.id, name: section, schoolId: school.id } });
      for (const subjectName of subjectNames) {
        await prisma.subject.upsert({
          where: { code_schoolId: { code: subjectName.substring(0, 3).toUpperCase() + cls.level, schoolId: school.id } },
          update: {},
          create: {
            name: subjectName,
            code: subjectName.substring(0, 3).toUpperCase() + cls.level,
            schoolId: school.id,
            classId: cls.id,
            sectionId: sec.id,
            maxMarks: 100,
          },
        });
      }
    }
  }
  console.log('✅ Subjects created');

  // Create Teachers
  const teachersData = [
    { email: 'teacher1@demo.com', phone: '+919876543220', firstName: 'Rajesh', lastName: 'Kumar', employeeId: 'EMP001', subjects: ['Mathematics', 'Science'] },
    { email: 'teacher2@demo.com', phone: '+919876543221', firstName: 'Priya', lastName: 'Singh', employeeId: 'EMP002', subjects: ['English', 'Hindi'] },
    { email: 'teacher3@demo.com', phone: '+919876543222', firstName: 'Amit', lastName: 'Patel', employeeId: 'EMP003', subjects: ['Social Science', 'General Knowledge'] },
  ];

  for (let i = 0; i < teachersData.length; i++) {
    const t = teachersData[i];
    const password = await argon2.hash('Teacher123!');
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        email: t.email,
        phone: t.phone,
        passwordHash: password,
        role: Role.TEACHER,
        firstName: t.firstName,
        lastName: t.lastName,
        schoolId: school.id,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        phoneVerified: true,
      },
    });

    const teacher = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        employeeId: t.employeeId,
        dateOfJoining: new Date('2020-06-15'),
        qualification: 'M.Ed',
        experience: 5,
        schoolId: school.id,
        status: UserStatus.ACTIVE,
      },
    });

    // Assign to Class 1-A, 2-A, 3-A
    for (let classLevel = 1; classLevel <= 3; classLevel++) {
      const cls = classes[classLevel - 1];
      const section = await prisma.section.findFirst({ where: { classId: cls.id, name: 'A', schoolId: school.id } });
      for (const subjectName of t.subjects) {
        const subject = await prisma.subject.findFirst({ where: { name: subjectName, classId: cls.id, sectionId: section.id, schoolId: school.id } });
        if (subject) {
          await prisma.teacherAssignment.upsert({
            where: { teacherId_classId_sectionId_subjectId_academicYearId: { teacherId: teacher.id, classId: cls.id, sectionId: section.id, subjectId: subject.id, academicYearId: academicYear.id } },
            update: {},
            create: {
              teacherId: teacher.id,
              classId: cls.id,
              sectionId: section.id,
              subjectId: subject.id,
              schoolId: school.id,
              academicYearId: academicYear.id,
            },
          });
        }
      }
    }
  }
  console.log('✅ Teachers created: 3');

  // Create Exam Types
  const examTypes = [
    { name: 'Quarterly Examination', code: 'QUARTERLY', weightage: 25 },
    { name: 'Half Yearly Examination', code: 'HALF_YEARLY', weightage: 25 },
    { name: 'Annual Examination', code: 'ANNUAL', weightage: 50 },
  ];

  for (const et of examTypes) {
    await prisma.examType.upsert({
      where: { code_schoolId: { code: et.code, schoolId: school.id } },
      update: {},
      create: { ...et, schoolId: school.id },
    });
  }
  console.log('✅ Exam Types created: 3');

  // Create Holidays
  const holidays = [
    { name: 'Independence Day', startDate: new Date(`${currentYear}-08-15`), endDate: new Date(`${currentYear}-08-15`), description: 'National holiday' },
    { name: 'Gandhi Jayanti', startDate: new Date(`${currentYear}-10-02`), endDate: new Date(`${currentYear}-10-02`), description: 'National holiday' },
    { name: 'Diwali Break', startDate: new Date(`${currentYear}-10-31`), endDate: new Date(`${currentYear}-11-02`), description: 'Festival holidays' },
    { name: 'Christmas', startDate: new Date(`${currentYear}-12-25`), endDate: new Date(`${currentYear}-12-25`), description: 'Festival holiday' },
    { name: 'Republic Day', startDate: new Date(`${currentYear + 1}-01-26`), endDate: new Date(`${currentYear + 1}-01-26`), description: 'National holiday' },
  ];

  for (const h of holidays) {
    await prisma.holiday.upsert({
      where: { id: `${h.name}-${school.id}` },
      update: {},
      create: { ...h, schoolId: school.id },
    });
  }
  console.log('✅ Holidays created: 5');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });