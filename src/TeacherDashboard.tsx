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

const API_BASE =
  import.meta.env.VITE_API_BASE ?? 'http://localhost:8079/smart_attendance_api';

type TeacherCourse = {
  id: number;
  code: string;
  name: string;
  schedule: string;
  room: string;
  students: string[];
  status: string;
  statusColor: string;
  presentCount: number;
  absentCount: number;
};

type TeacherProfile = {
  username: string;
  name: string;
  courses: TeacherCourse[];
};

const fallbackTeacher: TeacherProfile = {
  username: '',
  name: 'Ogretmen',
  courses: [],
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [teacherProfiles, setTeacherProfiles] = useState<TeacherProfile[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchJson = async (url: string) => {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error('Request failed');
      return res.json();
    };

    Promise.all([
      fetchJson(`${API_BASE}/teachers.php`).catch(() => []),
      fetchJson(`${API_BASE}/courses.php`).catch(() => []),
      fetchJson(`${API_BASE}/attendance.php`).catch(() => []),
    ])
      .then(async ([teacherRows, courseRows, attendanceRows]) => {
        if (!Array.isArray(teacherRows) || teacherRows.length === 0) {
          setTeacherProfiles([]);
          return;
        }

        const coursesArray = Array.isArray(courseRows) ? courseRows : [];
        const attendanceArray = Array.isArray(attendanceRows) ? attendanceRows : [];

        const studentMap = new Map<number, string[]>();
        await Promise.all(
          coursesArray.map(async (course: any) => {
            const courseId = Number(course.id);
            if (!courseId) return;
            const res = await fetch(
              `${API_BASE}/course_students.php?course_id=${courseId}`,
              { signal: controller.signal },
            ).catch(() => null);
            if (!res || !res.ok) return;
            const data = await res.json().catch(() => null);
            if (!data?.ok || !Array.isArray(data.students)) return;
            const names = data.students.map((student: any) => student.name ?? 'Ogrenci');
            studentMap.set(courseId, names);
          }),
        );

        const attendanceByCourse = new Map<
          number,
          { id: number; presentCount: number; absentCount: number; isActive: boolean }
        >();

        attendanceArray.forEach((session: any) => {
          const courseId = Number(session.course_id ?? session.courseId ?? 0);
          const sessionId = Number(session.id ?? 0);
          if (!courseId || !sessionId) return;

          const presentList = Array.isArray(session.present) ? session.present : [];
          const absentList = Array.isArray(session.absent) ? session.absent : [];
          const presentCount = presentList.length || Number(session.attendees ?? 0);
          const absentCount = absentList.length || Number(session.absences ?? 0);
          const isActive =
            typeof session.status === 'string' &&
            session.status.toLowerCase().includes('devam');

          const existing = attendanceByCourse.get(courseId);
          if (!existing || sessionId > existing.id) {
            attendanceByCourse.set(courseId, {
              id: sessionId,
              presentCount,
              absentCount,
              isActive,
            });
          }
        });

        const mappedTeachers = teacherRows.map((teacher: any) => {
          const teacherCourses = coursesArray
            .filter((course: any) => course.instructor === teacher.name)
            .map((course: any) => {
              const courseId = Number(course.id);
              const attendanceInfo = attendanceByCourse.get(courseId);
              const students = studentMap.get(courseId) ?? [];
              const isActive = attendanceInfo?.isActive ?? false;
              return {
                id: courseId,
                code: course.code ?? '',
                name: course.name ?? '',
                schedule: course.semester ?? '-',
                room: course.classroom ?? '-',
                students,
                status: isActive ? 'Yoklama Acik' : 'Planlandi',
                statusColor: isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800',
                presentCount: attendanceInfo?.presentCount ?? 0,
                absentCount: attendanceInfo?.absentCount ?? 0,
              } as TeacherCourse;
            });

          return {
            username: teacher.username ?? '',
            name: teacher.name ?? 'Ogretmen',
            courses: teacherCourses,
          } as TeacherProfile;
        });

        setTeacherProfiles(mappedTeachers);
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [user]);

  const currentTeacher = useMemo(() => {
    const normalizedUser = (user ?? '').toLowerCase();
    return (
      teacherProfiles.find(
        (teacher) =>
          teacher.username === normalizedUser ||
          teacher.name.toLowerCase() === normalizedUser,
      ) ?? teacherProfiles[0] ?? fallbackTeacher
    );
  }, [user, teacherProfiles]);

  const totalStudents = currentTeacher.courses.reduce(
    (sum, course) => sum + course.students.length,
    0,
  );

  const activeSessions = currentTeacher.courses.filter(
    (course) => course.status === 'Yoklama Acik',
  ).length;

  const stats = [
    {
      label: 'Derslerim',
      value: String(currentTeacher.courses.length),
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Bugun Yoklama',
      value: String(activeSessions),
      color: 'bg-orange-100 text-orange-600',
    },
    {
      label: 'Toplam Ogrenci',
      value: String(totalStudents),
      color: 'bg-green-100 text-green-600',
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 lg:ml-64 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          <TopBar />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ogretmen Paneli</h1>
            <p className="text-gray-500 mt-2">
              {currentTeacher.name} icin ders ve yoklama ozetleri.
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
              <span className="text-sm text-gray-500">Bu hafta</span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ders</TableHead>
                    <TableHead>Gun/Saat</TableHead>
                    <TableHead>Sinif</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTeacher.courses.length == 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-sm text-gray-500">
                        Ders bulunamadi.
                      </TableCell>
                    </TableRow>
                  )}
                  {currentTeacher.courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium text-gray-900">
                        {course.code} - {course.name}
                      </TableCell>
                      <TableCell>{course.schedule}</TableCell>
                      <TableCell>{course.room}</TableCell>
                      <TableCell>
                        <Badge className={course.statusColor}>{course.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Derslerde Ogrenci ve Yoklama Durumu
              </h2>
              <span className="text-sm text-gray-500">Son durum</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {currentTeacher.courses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Ders</p>
                      <p className="text-base font-semibold text-gray-900">
                        {course.code} - {course.name}
                      </p>
                    </div>
                    <Badge className={course.statusColor}>{course.status}</Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    Son yoklama: {course.presentCount} katildi, {course.absentCount} devamsiz
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {course.students.length === 0 ? (
                      <span className="text-sm text-gray-500">Ogrenci yok</span>
                    ) : (
                      course.students.map((student) => (
                        <Badge
                          key={student}
                          className="bg-gray-100 text-gray-700 border border-gray-200"
                        >
                          {student}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
