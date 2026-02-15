import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, ClipboardList, Smartphone } from 'lucide-react';

const API_BASE =
  import.meta.env.VITE_API_BASE ?? 'http://localhost:8079/smart_attendance_api';

type StatItem = {
  label: string;
  value: string;
  icon: typeof Users;
  color: string;
  to: string;
};

type SessionRow = {
  id: number;
  courseId?: number;
  name: string;
  teacher: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  status: string;
  statusColor: string;
};

const baseStats: StatItem[] = [
  {
    label: 'Toplam Ogrenci',
    value: '0',
    icon: Users,
    color: 'bg-blue-100 text-blue-600',
    to: '/students',
  },
  {
    label: 'Toplam Ders',
    value: '0',
    icon: BookOpen,
    color: 'bg-green-100 text-green-600',
    to: '/courses',
  },
  {
    label: 'Aktif Yoklamalar',
    value: '0',
    icon: ClipboardList,
    color: 'bg-orange-100 text-orange-600',
    to: '/attendance',
  },
  {
    label: 'Bagli Cihazlar',
    value: '0',
    icon: Smartphone,
    color: 'bg-purple-100 text-purple-600',
    to: '/devices',
  },
];

const toShortTime = (value?: string) => {
  if (!value) return '-';
  return value.slice(0, 5);
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatItem[]>(baseStats);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoadError('');

    Promise.all([
      fetch(`${API_BASE}/stats.php`, { signal: controller.signal }),
      fetch(`${API_BASE}/attendance.php`, { signal: controller.signal }),
    ])
      .then(async ([statsRes, attendanceRes]) => {
        if (!statsRes.ok || !attendanceRes.ok) {
          throw new Error('Request failed');
        }
        const [statsData, attendanceRows] = await Promise.all([
          statsRes.json(),
          attendanceRes.json(),
        ]);
        setLoadError('');

        const totalStudents = Number(statsData?.students ?? 0);
        const totalCourses = Number(statsData?.courses ?? 0);
        const activeSessions = Number(statsData?.active_sessions ?? 0);
        const activeDevices = Number(statsData?.active_devices ?? 0);

        setStats((prev) =>
          prev.map((stat) => {
            if (stat.label === 'Toplam Ogrenci') {
              return { ...stat, value: String(totalStudents) };
            }
            if (stat.label === 'Toplam Ders') {
              return { ...stat, value: String(totalCourses) };
            }
            if (stat.label === 'Aktif Yoklamalar') {
              return { ...stat, value: String(activeSessions) };
            }
            if (stat.label === 'Bagli Cihazlar') {
              return { ...stat, value: String(activeDevices) };
            }
            return stat;
          }),
        );

        if (Array.isArray(attendanceRows)) {
          const mapped = attendanceRows.map((row: any) => {
            const status = row.status === 'Tamamlandi' ? 'Tamamlandi' : 'Devam Ediyor';
            return {
              id: Number(row.id),
              courseId: Number(row.course_id ?? row.courseId ?? 0),
              name: row.course ?? row.course_name ?? '-',
              teacher: row.instructor ?? '-',
              date: row.date ?? row.session_date ?? '',
              startTime: toShortTime(row.time ?? row.start_time ?? ''),
              endTime: toShortTime(row.end_time ?? ''),
              room: row.classroom ?? '-',
              status,
              statusColor:
                status === 'Tamamlandi'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-green-100 text-green-800',
            } as SessionRow;
          });
          setSessions(mapped.slice(0, 6));
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setLoadError('Dashboard verileri alinamadi.');
      });

    return () => controller.abort();
  }, []);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todaySessions = useMemo(
    () => sessions.filter((session) => session.status === 'Devam Ediyor' && session.date === today),
    [sessions, today],
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 lg:ml-64 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          <TopBar className="mb-6" />
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Ana Panel</h1>
            <p className="text-gray-500 mt-2">Yoklama sisteminizin ozet bilgileri</p>
          </div>

          {loadError && (
            <p className="mb-4 text-sm text-red-600">{loadError}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(stat.to)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      navigate(stat.to);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <Icon size={24} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Son Yoklama Oturumlari
                </h2>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b">
                        <TableHead className="text-xs font-semibold text-gray-600">
                          Ders Adi
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">
                          Tarih
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">
                          Baslangic
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">
                          Bitis
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">
                          Oda
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">
                          Durum
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-sm text-gray-500">
                            Oturum bulunamadi.
                          </TableCell>
                        </TableRow>
                      )}
                      {sessions.map((course) => (
                        <TableRow key={course.id} className="border-b hover:bg-gray-50">
                          <TableCell className="text-sm font-medium text-gray-900 py-4">
                            <button
                              type="button"
                              className="text-blue-700 hover:text-blue-900 font-semibold"
                              onClick={() =>
                                navigate(`/courses?selected=${course.courseId ?? course.id}`)
                              }
                            >
                              {course.name}
                            </button>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 py-4">
                            {course.date || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 py-4">
                            {course.startTime}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 py-4">
                            {course.endTime}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 py-4">
                            {course.room}
                          </TableCell>
                          <TableCell className="text-sm py-4">
                            <Badge className={`${course.statusColor} border-0`}>
                              {course.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>

            <div>
              <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Bugun Devam Edecek Dersler
                </h2>
                <div className="space-y-4">
                  {todaySessions.length === 0 && (
                    <p className="text-sm text-gray-500">Bugun aktif ders yok.</p>
                  )}
                  {todaySessions.map((course) => (
                    <div
                      key={course.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <p className="text-sm font-semibold text-gray-900">{course.name}</p>
                      <p className="text-xs text-gray-600 mt-1">{course.teacher}</p>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-gray-600">
                          {course.startTime} - {course.endTime}
                        </span>
                        <Badge className="bg-green-100 text-green-800 border-0">
                          Devam Ediyor
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
