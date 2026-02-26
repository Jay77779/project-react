const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Student = require('./models/student');
const Teacher = require('./models/teacher');
const Subject = require('./models/subject');

const MONGO_URI = 'mongodb://127.0.0.1:27017/studentdbupdated';

const SUBJECTS_BY_COURSE_SEMESTER = [
  { course: 'BBA', semester: 'SEM-1', name: 'Management', totalMarks: 100 },
  { course: 'BBA', semester: 'SEM-1', name: 'Accounting', totalMarks: 100 },
  { course: 'BBA', semester: 'SEM-1', name: 'Finance', totalMarks: 100 },
  { course: 'BBA', semester: 'SEM-1', name: 'HR', totalMarks: 100 },
  { course: 'BBA', semester: 'SEM-2', name: 'Economics', totalMarks: 100 },
  { course: 'BBA', semester: 'SEM-2', name: 'Marketing', totalMarks: 100 },
  { course: 'BCA', semester: 'SEM-1', name: 'Programming', totalMarks: 100 },
  { course: 'BCA', semester: 'SEM-1', name: 'Data Structures', totalMarks: 100 },
  { course: 'BCA', semester: 'SEM-2', name: 'Databases', totalMarks: 100 },
  { course: 'BCA', semester: 'SEM-2', name: 'Networks', totalMarks: 100 },
  { course: 'BCOM', semester: 'SEM-3', name: 'Taxation', totalMarks: 100 },
  { course: 'BCOM', semester: 'SEM-3', name: 'Auditing', totalMarks: 100 },
  { course: 'B.ED', semester: 'SEM-1', name: 'Pedagogy', totalMarks: 100 },
  { course: 'B.ED', semester: 'SEM-1', name: 'Psychology', totalMarks: 100 },
  { course: 'B.ED', semester: 'SEM-2', name: 'Curriculum', totalMarks: 100 },
  { course: 'B.ED', semester: 'SEM-2', name: 'Assessment', totalMarks: 100 },
];

async function seed() {
  await mongoose.connect(MONGO_URI);

  // Clear existing
  await Student.deleteMany({});
  await Teacher.deleteMany({});
  await Subject.deleteMany({});
  await Subject.insertMany(SUBJECTS_BY_COURSE_SEMESTER);

  // Create teacher
  const teacher = new Teacher({
    name: 'Test Teacher',
    email: 't@test.com',
    password: await bcrypt.hash('t123456', 10),
  });
  await teacher.save();

  // Create sample students across courses/divisions/semesters
  // Now uses only the new `exams` structure for marks
  const studentsData = [
    {
      name: 'Alice BBA A1',
      dob: '2006-02-10',
      email: 'alice.bba.a1@test.com',
      course: 'BBA',
      phone: '1234567890',
      address: '12 King St',
      semester: 'SEM-1',
      division: 'A',
      exams: [
        {
          examName: 'Mid Term',
          perSubjectTotalMarks: 100,
          subjects: [
            { name: 'Management', totalMarks: 100, obtainedMarks: 82 },
            { name: 'Accounting', totalMarks: 100, obtainedMarks: 76 },
          ],
          totalMarks: 200,
          obtainedMarks: 158,
          percentage: 79,
        },
      ],
    },
    {
      name: 'Bob BBA A2',
      dob: '2006-05-20',
      email: 'bob.bba.a2@test.com',
      course: 'BBA',
      phone: '1234509876',
      address: '34 Queen St',
      semester: 'SEM-2',
      division: 'A',
      exams: [
        {
          examName: 'Mid Term',
          perSubjectTotalMarks: 100,
          subjects: [
            { name: 'Economics', totalMarks: 100, obtainedMarks: 88 },
            { name: 'Marketing', totalMarks: 100, obtainedMarks: 79 },
          ],
          totalMarks: 200,
          obtainedMarks: 167,
          percentage: 83.5,
        },
      ],
    },
    {
      name: 'Cara BBA B1',
      dob: '2005-12-01',
      email: 'cara.bba.b1@test.com',
      course: 'BBA',
      phone: '9998887776',
      address: '56 Lake Rd',
      semester: 'SEM-1',
      division: 'B',
      exams: [
        {
          examName: 'Mid Term',
          perSubjectTotalMarks: 100,
          subjects: [
            { name: 'Finance', totalMarks: 100, obtainedMarks: 91 },
            { name: 'HR', totalMarks: 100, obtainedMarks: 84 },
          ],
          totalMarks: 200,
          obtainedMarks: 175,
          percentage: 87.5,
        },
      ],
    },
    {
      name: 'Dan BCA A1',
      dob: '2006-03-15',
      email: 'dan.bca.a1@test.com',
      course: 'BCA',
      phone: '8887776665',
      address: '78 Hill Ave',
      semester: 'SEM-1',
      division: 'A',
      exams: [
        {
          examName: 'Mid Term',
          perSubjectTotalMarks: 100,
          subjects: [
            { name: 'Programming', totalMarks: 100, obtainedMarks: 92 },
            { name: 'Data Structures', totalMarks: 100, obtainedMarks: 86 },
          ],
          totalMarks: 200,
          obtainedMarks: 178,
          percentage: 89,
        },
      ],
    },
    {
      name: 'Eva BCA B1',
      dob: '2006-07-30',
      email: 'eva.bca.b1@test.com',
      course: 'BCA',
      phone: '7776665554',
      address: '90 River Rd',
      semester: 'SEM-2',
      division: 'B',
      exams: [
        {
          examName: 'Mid Term',
          perSubjectTotalMarks: 100,
          subjects: [
            { name: 'Databases', totalMarks: 100, obtainedMarks: 80 },
            { name: 'Networks', totalMarks: 100, obtainedMarks: 74 },
          ],
          totalMarks: 200,
          obtainedMarks: 154,
          percentage: 77,
        },
      ],
    },
    {
      name: 'Fred BCOM A1',
      dob: '2005-11-11',
      email: 'fred.bcom.a1@test.com',
      course: 'BCOM',
      phone: '6665554443',
      address: '21 Park Ln',
      semester: 'SEM-3',
      division: 'A',
      exams: [
        {
          examName: 'Mid Term',
          perSubjectTotalMarks: 100,
          subjects: [
            { name: 'Taxation', totalMarks: 100, obtainedMarks: 85 },
            { name: 'Auditing', totalMarks: 100, obtainedMarks: 78 },
          ],
          totalMarks: 200,
          obtainedMarks: 163,
          percentage: 81.5,
        },
      ],
    },
    {
      name: 'Gina B.ED A1',
      dob: '2005-09-09',
      email: 'gina.bed.a1@test.com',
      course: 'B.ED',
      phone: '5554443332',
      address: '43 Sunset Blvd',
      semester: 'SEM-1',
      division: 'A',
      exams: [
        {
          examName: 'Mid Term',
          perSubjectTotalMarks: 100,
          subjects: [
            { name: 'Pedagogy', totalMarks: 100, obtainedMarks: 87 },
            { name: 'Psychology', totalMarks: 100, obtainedMarks: 90 },
          ],
          totalMarks: 200,
          obtainedMarks: 177,
          percentage: 88.5,
        },
      ],
    },
    {
      name: 'Henry B.ED B1',
      dob: '2006-04-04',
      email: 'henry.bed.b1@test.com',
      course: 'B.ED',
      phone: '4443332221',
      address: '65 Sunrise Ave',
      semester: 'SEM-2',
      division: 'B',
      exams: [
        {
          examName: 'Mid Term',
          perSubjectTotalMarks: 100,
          subjects: [
            { name: 'Curriculum', totalMarks: 100, obtainedMarks: 83 },
            { name: 'Assessment', totalMarks: 100, obtainedMarks: 77 },
          ],
          totalMarks: 200,
          obtainedMarks: 160,
          percentage: 80,
        },
      ],
    },
  ];

  const studentPassword = await bcrypt.hash('student123', 10);
  const students = await Student.insertMany(
    studentsData.map((s) => ({
      ...s,
      password: studentPassword,
    }))
  );

  console.log(`Seeded teacher, ${students.length} students, and ${SUBJECTS_BY_COURSE_SEMESTER.length} subjects.`);
  mongoose.disconnect();
}

seed();
