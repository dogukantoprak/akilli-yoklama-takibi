import { FormEvent, useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';

const API_BASE =
  import.meta.env.VITE_API_BASE ?? 'http://localhost:8079/smart_attendance_api';

type Course = {
  id: number;
  teacherId?: number;
  code: string;
  name: string;
  instructor: string;
  classroom: string;
  students: number;
  semester: string;
  status: 'Aktif' | 'Tamamlandi';
};

export default function Courses() {
  const { role, user } = useAuth();
  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';
  const [searchParams] = useSearchParams();

  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState({
    code: '',
    name: '',
    teacherId: '',
    classroom: '',
    semester: 'Güz 2024',
    status: 'Aktif',
  });
  const [selected, setSelected] = useState<Course | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [teacherOptions, setTeacherOptions] = useState<{ id: number; name: string; username?: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [courseStudents, setCourseStudents] = useState<string[]>([]);
  const [studentsError, setStudentsError] = useState('');
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_BASE}/courses.php`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then((rows) => {
        if (!Array.isArray(rows)) return;
        const mapped = rows.map((row: any) => ({
          id: Number(row.id),
          teacherId: Number(row.teacher_id ?? 0),
          code: row.code ?? '',
          name: row.name ?? '',
          instructor: row.instructor ?? '-',
          classroom: row.classroom ?? '-',
          students: Number(row.students ?? 0),
          semester: row.semester ?? '-',
          status:
            typeof row.status === 'string' && row.status.toLowerCase() === 'aktif'
              ? 'Aktif'
              : 'Tamamlandi',
        }));

        if (mapped.length > 0) {
          setCourses(mapped);
          setSelected(mapped[0]);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/teachers.php`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then((rows) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        const mapped = rows
          .map((row: any) => ({
            id: Number(row.id),
            name: row.name ?? 'Ogretmen',
            username: row.username ?? '',
          }))
          .filter((teacher: any) => teacher.id && teacher.name);
        if (mapped.length > 0) {
          setTeacherOptions(mapped);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (teacherOptions.length === 0) return;
    setForm((prev) =>
      prev.teacherId ? prev : { ...prev, teacherId: String(teacherOptions[0].id) },
    );
  }, [teacherOptions]);

  useEffect(() => {
    if (!selected) {
      setCourseStudents([]);
      return;
    }
    const controller = new AbortController();
    setIsLoadingStudents(true);
    setStudentsError('');

    fetch(`${API_BASE}/course_students.php?course_id=${selected.id}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then((data) => {
        if (!data?.ok || !Array.isArray(data.students)) {
          throw new Error('Invalid response');
        }
        const names = data.students.map((student: any) => student.name ?? 'Ogrenci');
        setCourseStudents(names);
      })
      .catch(() => {
        setStudentsError('Ogrenci listesi alinamadi.');
        setCourseStudents([]);
      })
      .finally(() => {
        setIsLoadingStudents(false);
      });

    return () => controller.abort();
  }, [selected?.id]);

    const currentTeacher = useMemo(
    () =>
      teacherOptions.find((teacher) =>
        user ? teacher.username?.toLowerCase() === user.toLowerCase() : false,
      ) ?? teacherOptions[0] ?? null,
    [teacherOptions, user],
  );

  const currentTeacherName = currentTeacher?.name ?? '';

  const visibleCourses = useMemo(() => {
    if (!isTeacher || !currentTeacher) return courses;
    return courses.filter((course) => course.instructor === currentTeacherName);
  }, [courses, currentTeacherName, isTeacher]);

  const selectedIdParam = searchParams.get('selected');

  const totalCourses = useMemo(() => visibleCourses.length, [visibleCourses]);

  useEffect(() => {
    if (!selected || !visibleCourses.some((course) => course.id === selected.id)) {
      setSelected(visibleCourses[0] ?? null);
    }
  }, [selected, visibleCourses]);

  useEffect(() => {
    if (!selectedIdParam) return;
    const parsedId = Number(selectedIdParam);
    if (Number.isNaN(parsedId)) return;
    const nextCourse =
      visibleCourses.find((course) => course.id === parsedId) ??
      courses.find((course) => course.id === parsedId);
    if (nextCourse) {
      setSelected(nextCourse);
    }
  }, [selectedIdParam, visibleCourses, courses]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!form.code || !form.name || !form.teacherId) {
      setSubmitError('Zorunlu alanlar bos.');
      setSubmitSuccess('');
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      teacher_id: Number(form.teacherId),
      classroom: form.classroom.trim(),
      semester: form.semester.trim(),
      status: form.status === 'Aktif' ? 'aktif' : 'pasif',
    };

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const res = await fetch(`${API_BASE}/create_course.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? 'Kayit basarisiz.');
      }

      const created = data.course ?? {};
      const instructorName =
        created.instructor ??
        teacherOptions.find((t) => t.id === Number(payload.teacher_id))?.name ??
        '-';

      const newCourse: Course = {
        id: Number(created.id),
        code: created.code ?? payload.code,
        name: created.name ?? payload.name,
        instructor: instructorName,
        classroom: (created.classroom ?? payload.classroom) || '-',
        students: Number(created.students ?? 0),
        semester: (created.semester ?? payload.semester) || '-',
        status:
          typeof created.status === 'string' && created.status.toLowerCase() === 'aktif'
            ? 'Aktif'
            : 'Tamamlandi',
        teacherId: Number(created.teacher_id ?? payload.teacher_id),
      };

      setCourses((prev) => [newCourse, ...prev]);
      setSelected(newCourse);
      setShowCreateForm(false);
      setForm({
        code: '',
        name: '',
        teacherId: String(teacherOptions[0]?.id ?? ''),
        classroom: '',
        semester: 'Guz 2024',
        status: 'Aktif',
      });
      setSubmitSuccess('Ders olusturuldu.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kayit basarisiz.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 lg:ml-64 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          <TopBar />
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Dersler</h1>
            <p className="text-gray-500 mt-2">Ders kayıt ve atama ekranı (öğretmen seçimi)</p>
          </div>

          <div className="space-y-4">
            <Button
              className="w-full sm:w-60 bg-blue-600 text-white border border-blue-600 hover:bg-blue-700"
              onClick={() => setShowCreateForm((s) => !s)}
              disabled={!isAdmin}
            >
              {showCreateForm ? 'Ders Oluşturmayı Gizle' : 'Ders Oluştur'}
            </Button>

            {isAdmin && showCreateForm && (
              <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Ders Oluştur</h2>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
                  <div>
                    <Label htmlFor="code">Ders Kodu</Label>
                    <Input
                      id="code"
                      value={form.code}
                      onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                      placeholder="Örn: BM210"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Ders Adı</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Örn: Mobil Uygulama Geliştirme"
                    />
                  </div>
                  <div>
                    <Label>Öğretmen</Label>
                    <Select
                      value={form.teacherId}
                      onValueChange={(val) => setForm((prev) => ({ ...prev, teacherId: val }))}
                    >
                      <SelectTrigger className="mt-1" />
                      <SelectContent>
                        {teacherOptions.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                      <SelectValue />
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="classroom">Sınıf</Label>
                    <Input
                      id="classroom"
                      value={form.classroom}
                      onChange={(e) => setForm((prev) => ({ ...prev, classroom: e.target.value }))}
                      placeholder="Örn: A-102"
                    />
                  </div>
                  <div>
                    <Label htmlFor="semester">Dönem</Label>
                    <Input
                      id="semester"
                      value={form.semester}
                      onChange={(e) => setForm((prev) => ({ ...prev, semester: e.target.value }))}
                      placeholder="Güz 2024"
                    />
                  </div>
                  <div>
                    <Label>Durum</Label>
                    <Select
                      value={form.status}
                      onValueChange={(val) =>
                        setForm((prev) => ({ ...prev, status: val as Course['status'] }))
                      }
                    >
                      <SelectTrigger className="mt-1" />
                      <SelectContent>
                        <SelectItem value="Aktif">Aktif</SelectItem>
                        <SelectItem value="Tamamlandi">Tamamlandi</SelectItem>
                      </SelectContent>
                      <SelectValue />
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" className="w-full">
                      Dersi Kaydet
                    </Button>
                    {submitError && (
                      <p className="text-sm text-red-600">{submitError}</p>
                    )}
                    {submitSuccess && (
                      <p className="text-sm text-green-600">{submitSuccess}</p>
                    )}
                  </div>
                </form>
              </Card>
            )}
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Ders Listesi</h2>
              <div className="text-sm text-gray-600">Toplam: {totalCourses} ders</div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead>Ders Kodu</TableHead>
                    <TableHead>Ders Adı</TableHead>
                    <TableHead>Öğretmen</TableHead>
                    <TableHead>Sınıf</TableHead>
                    <TableHead>Öğrenci Sayısı</TableHead>
                    <TableHead>Dönem</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleCourses.map((course) => (
                    <TableRow key={course.id} className="border-b hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">{course.code}</TableCell>
                      <TableCell className="text-gray-700">{course.name}</TableCell>
                      <TableCell className="text-gray-700">{course.instructor}</TableCell>
                      <TableCell className="text-gray-700">{course.classroom}</TableCell>
                      <TableCell className="text-gray-700">{course.students}</TableCell>
                      <TableCell className="text-gray-700">{course.semester}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            course.status === 'Aktif'
                              ? 'bg-green-100 text-green-800 border-0'
                              : 'bg-gray-100 text-gray-800 border-0'
                          }
                        >
                          {course.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          className="text-blue-600 hover:text-blue-900 font-medium"
                          onClick={() => setSelected(course)}
                        >
                          Detay
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {selected && (
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">Seçilen Ders</p>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selected.code} - {selected.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selected.instructor} • {selected.semester} • {selected.classroom}
                  </p>
                </div>
                <Badge
                  className={
                    selected.status === 'Aktif'
                      ? 'bg-green-100 text-green-800 border-0'
                      : 'bg-gray-100 text-gray-800 border-0'
                  }
                >
                  {selected.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500">Öğrenci Sayısı</p>
                  <p className="text-2xl font-bold text-gray-900">{selected.students}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500">Sınıf</p>
                  <p className="text-lg font-semibold text-gray-900">{selected.classroom}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500">Dönem</p>
                  <p className="text-lg font-semibold text-gray-900">{selected.semester}</p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Dersi Alan Öğrenciler</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {isLoadingStudents && (
                    <div className="text-sm text-gray-500">Yukleniyor...</div>
                  )}
                  {!isLoadingStudents && studentsError && (
                    <div className="text-sm text-red-600">{studentsError}</div>
                  )}
                  {!isLoadingStudents && !studentsError && courseStudents.length === 0 && (
                    <div className="text-sm text-gray-500">Ogrenci bulunamadi.</div>
                  )}
                  {!isLoadingStudents && !studentsError && courseStudents.map((student) => (
                    <div
                      key={student}
                      className="p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800"
                    >
                      {student}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
