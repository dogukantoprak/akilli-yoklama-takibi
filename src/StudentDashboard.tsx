import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { Label } from '@/components/ui/label';

const API_BASE =
  import.meta.env.VITE_API_BASE ?? 'http://localhost:8079/smart_attendance_api';

type StudentCourse = {
  code: string;
  name: string;
};

type StudentProfile = {
  username: string;
  name: string;
  studentNo: string;
  courses: StudentCourse[];
};

type AttendanceSession = {
  id: number;
  courseCode: string;
  courseName: string;
  date: string;
  present: string[];
  absent: string[];
};

type CourseAbsenceSummary = {
  code: string;
  name: string;
  absentDates: string[];
  absenceCount: number;
  remaining: number;
  totalSessions: number;
};

const absenceLimitByCourse: Record<string, number> = {
  BM101: 3,
  BM102: 3,
  BM103: 3,
  BM104: 3,
};

const defaultAbsenceLimit = 3;

const fallbackStudent: StudentProfile = {
  username: '',
  name: 'Misafir',
  studentNo: '-',
  courses: [],
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([]);
  const [sessionRows, setSessionRows] = useState<AttendanceSession[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetch(`${API_BASE}/students.php`, { signal: controller.signal }),
      fetch(`${API_BASE}/courses.php`, { signal: controller.signal }),
      fetch(`${API_BASE}/attendance.php`, { signal: controller.signal }),
    ])
      .then(async ([studentsRes, coursesRes, attendanceRes]) => {
        if (!studentsRes.ok || !coursesRes.ok || !attendanceRes.ok) {
          throw new Error('Request failed');
        }
        const [studentRows, courseRows, attendanceRows] = await Promise.all([
          studentsRes.json(),
          coursesRes.json(),
          attendanceRes.json(),
        ]);

        const nameByCode = new Map<string, string>();
        const codeByName = new Map<string, string>();
        if (Array.isArray(courseRows)) {
          courseRows.forEach((course: any) => {
            if (course?.code && course?.name) {
              nameByCode.set(String(course.code), String(course.name));
              codeByName.set(String(course.name), String(course.code));
            }
          });
        }

        if (Array.isArray(studentRows) && studentRows.length > 0) {
          const mappedStudents = studentRows.map((row: any) => {
            const courseList = Array.isArray(row.courses) ? row.courses : [];
            const courses = courseList.map((course: string) => {
              const [codeRaw, ...nameParts] = String(course).split(' - ');
              const code = codeRaw?.trim() ?? '';
              const name =
                nameParts.join(' - ').trim() || nameByCode.get(code) || String(course);
              return { code, name };
            });
            return {
              username: row.student_no ?? '',
              name: row.name ?? 'Ogrenci',
              studentNo: row.student_no ?? '',
              courses,
            } as StudentProfile;
          });
          setStudentProfiles(mappedStudents);
        }

        if (Array.isArray(attendanceRows) && attendanceRows.length > 0) {
          const mappedSessions = attendanceRows.map((row: any) => {
            const courseName = row.course ?? '';
            const courseCode =
              row.course_code ?? codeByName.get(courseName) ?? row.courseCode ?? '';
            const presentList = Array.isArray(row.present)
              ? row.present.map((item: any) => item.name ?? item)
              : [];
            const absentList = Array.isArray(row.absent)
              ? row.absent.map((item: any) => item.name ?? item)
              : [];
            return {
              id: Number(row.id),
              courseCode,
              courseName,
              date: row.date ?? row.session_date ?? '',
              present: presentList,
              absent: absentList,
            } as AttendanceSession;
          });
          setSessionRows(mappedSessions);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [user]);

  const currentStudent = useMemo(() => {
    const normalizedUser = (user ?? '').toLowerCase();
    return (
      studentProfiles.find(
        (student) =>
          student.username === normalizedUser ||
          student.studentNo === normalizedUser ||
          student.name.toLowerCase() === normalizedUser,
      ) ?? studentProfiles[0] ?? fallbackStudent
    );
  }, [user, studentProfiles]);

  const courseCodes = currentStudent.courses.map((course) => course.code);
  const [selectedCourseCode, setSelectedCourseCode] = useState('');

  useEffect(() => {
    if (!selectedCourseCode && courseCodes.length > 0) {
      setSelectedCourseCode(courseCodes[0]);
    }
  }, [selectedCourseCode, courseCodes]);

  const attendanceRows = useMemo(() => {
    return sessionRows
      .filter((session) => courseCodes.includes(session.courseCode))
      .map((session) => {
        const isPresent = session.present.includes(currentStudent.name);
        const isAbsent = session.absent.includes(currentStudent.name);
        const status = isPresent ? 'Katildi' : isAbsent ? 'Kacirdi' : 'Bilinmiyor';
        const statusColor = isPresent
          ? 'bg-green-100 text-green-800'
          : isAbsent
          ? 'bg-red-100 text-red-700'
          : 'bg-gray-100 text-gray-700';
        return {
          ...session,
          status,
          statusColor,
        };
      });
  }, [courseCodes, currentStudent.name, sessionRows]);

  const courseSummaries = useMemo<CourseAbsenceSummary[]>(() => {
    return currentStudent.courses.map((course) => {
      const courseSessions = sessionRows.filter(
        (session) => session.courseCode === course.code,
      );
      const absentDates = courseSessions
        .filter((session) => session.absent.includes(currentStudent.name))
        .map((session) => session.date);
      const absenceCount = absentDates.length;
      const limit = absenceLimitByCourse[course.code] ?? defaultAbsenceLimit;
      return {
        code: course.code,
        name: course.name,
        absentDates,
        absenceCount,
        remaining: Math.max(0, limit - absenceCount),
        totalSessions: courseSessions.length,
      };
    });
  }, [currentStudent.courses, currentStudent.name, sessionRows]);

  const selectedCourseSummary =
    courseSummaries.find((summary) => summary.code === selectedCourseCode) ??
    courseSummaries[0];

  const attendedCount = attendanceRows.filter((row) => row.status === 'Katildi').length;
  const missedCount = attendanceRows.filter((row) => row.status === 'Kacirdi').length;

  const stats = [
    {
      label: 'Toplam Ders',
      value: String(courseCodes.length),
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Katildigim Yoklamalar',
      value: String(attendedCount),
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Devamsizlik',
      value: String(missedCount),
      color: 'bg-red-100 text-red-600',
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 lg:ml-64 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          <TopBar />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ogrenci Paneli</h1>
            <p className="text-gray-500 mt-2">
              {currentStudent.name} icin yoklama ozeti ve ders bilgileri.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-6">
                <div
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${stat.color}`}
                >
                  {stat.label}
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-3">{stat.value}</p>
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Derslerim</h2>
              <span className="text-sm text-gray-500">Toplam: {courseCodes.length}</span>
            </div>
            {currentStudent.courses.length === 0 ? (
              <p className="text-sm text-gray-500">Ders bulunamadi.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {currentStudent.courses.map((course) => (
                  <Badge
                    key={course.code}
                    className="bg-blue-50 text-blue-700 border border-blue-100"
                  >
                    {course.code} - {course.name}
                  </Badge>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Devamsizlik Detayi</h2>
              <span className="text-sm text-gray-500">Ders secin</span>
            </div>
            {courseSummaries.length === 0 ? (
              <p className="text-sm text-gray-500">Ders bulunamadi.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="courseSelect">Ders</Label>
                  <select
                    id="courseSelect"
                    className="mt-1 w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedCourseSummary?.code ?? selectedCourseCode}
                    onChange={(e) => setSelectedCourseCode(e.target.value)}
                  >
                    {courseSummaries.map((course) => (
                      <option key={course.code} value={course.code}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedCourseSummary && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Devamsizlik</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedCourseSummary.absenceCount}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Kalan Hak</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedCourseSummary.remaining}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Toplam Oturum</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedCourseSummary.totalSessions}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Devamsiz Gunler</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedCourseSummary.absentDates.length ? (
                          selectedCourseSummary.absentDates.map((date) => (
                            <Badge
                              key={date}
                              className="bg-red-50 text-red-700 border border-red-100"
                            >
                              {date}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">Devamsizlik yok</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Yoklama Gecmisi</h2>
              <span className="text-sm text-gray-500">Son oturumlar</span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ders</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-sm text-gray-500">
                        Yoklama kaydi bulunamadi.
                      </TableCell>
                    </TableRow>
                  )}
                  {attendanceRows.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium text-gray-900">
                        {session.courseName}
                      </TableCell>
                      <TableCell>{session.date}</TableCell>
                      <TableCell>
                        <Badge className={session.statusColor}>{session.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
