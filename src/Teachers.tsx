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
import { useAuth } from '@/contexts/AuthContext';

const API_BASE =
  import.meta.env.VITE_API_BASE ?? 'http://localhost:8079/smart_attendance_api';

type Teacher = {
  id: number;
  name: string;
  title: string;
  email: string;
  phone: string;
  department: string;
  courses: string[];
};

const resolveCourseLabel = (courses: { code: string; name: string }[], code: string) => {
  const match = courses.find((course) => course.code === code);
  return match ? `${match.code} - ${match.name}` : code;
};

export default function Teachers() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [form, setForm] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    department: '',
    courses: [] as string[],
  });
  const [showForm, setShowForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignForm, setAssignForm] = useState({ teacherId: '', courseCode: '' });
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [courseOptions, setCourseOptions] = useState<{ code: string; name: string }[]>([]);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/teachers.php`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then((rows) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        const mapped = rows.map((row: any) => ({
          id: Number(row.id),
          name: row.name ?? 'Ogretmen',
          title: row.title ?? '',
          email: row.email ?? '',
          phone: row.phone ?? '',
          department: row.department ?? '',
          courses: Array.isArray(row.courses) ? row.courses : [],
        }));
        setTeachers(mapped);
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/courses.php`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then((rows) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        const mapped = rows
          .map((row: any) => ({
            code: row.code ?? '',
            name: row.name ?? '',
          }))
          .filter((row: any) => row.code && row.name);
        if (mapped.length > 0) setCourseOptions(mapped);
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  const totalTeachers = useMemo(() => teachers.length, [teachers]);

  useEffect(() => {
    if (teachers.length === 0) return;
    setAssignForm((prev) =>
      prev.teacherId ? prev : { ...prev, teacherId: String(teachers[0].id) },
    );
  }, [teachers]);

  useEffect(() => {
    if (courseOptions.length === 0) return;
    setAssignForm((prev) =>
      prev.courseCode ? prev : { ...prev, courseCode: courseOptions[0].code },
    );
  }, [courseOptions]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.title || !form.email) {
      setSubmitError('Zorunlu alanlar bos.');
      setSubmitSuccess('');
      return;
    }

    const payload = {
      name: form.name.trim(),
      title: form.title.trim(),
      department: form.department.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      username: form.email.trim(),
      course_codes: form.courses,
    };

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch(`${API_BASE}/create_teacher.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? 'Kayit basarisiz.');
      }

      const created = data.teacher ?? {};
      const defaultPassword = created.default_password as string | undefined;
      const resolvedCourses = form.courses.map((code) => resolveCourseLabel(courseOptions, code));
      const newTeacher: Teacher = {
        id: Number(created.id),
        name: created.name ?? payload.name,
        title: created.title ?? payload.title,
        email: created.email ?? payload.email,
        phone: created.phone ?? payload.phone,
        department: created.department ?? payload.department,
        courses: resolvedCourses,
      };

      setTeachers((prev) => [newTeacher, ...prev]);
      setForm({
        name: '',
        title: '',
        email: '',
        phone: '',
        department: '',
        courses: [],
      });
      setSubmitSuccess(
        defaultPassword
          ? `Kayit olusturuldu. Varsayilan sifre: ${defaultPassword}`
          : 'Kayit olusturuldu.',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kayit basarisiz.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssign = async (e: FormEvent) => {
    e.preventDefault();
    if (!assignForm.teacherId || !assignForm.courseCode) {
      setAssignError('Zorunlu alanlar bos.');
      setAssignSuccess('');
      return;
    }

    setAssignError('');
    setAssignSuccess('');

    try {
      const res = await fetch(`${API_BASE}/assign_teacher_course.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: Number(assignForm.teacherId),
          course_code: assignForm.courseCode,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? 'Atama basarisiz.');
      }

      const courseLabel = resolveCourseLabel(courseOptions, assignForm.courseCode);
      setTeachers((prev) =>
        prev.map((teacher) =>
          teacher.id === Number(assignForm.teacherId)
            ? {
                ...teacher,
                courses: Array.from(new Set([...teacher.courses, courseLabel])),
              }
            : teacher,
        ),
      );
      setAssignSuccess('Ders atandi.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Atama basarisiz.';
      setAssignError(message);
    }
  };

  const removeCourse = async (teacherId: number, course: string) => {
    const courseCode = course.split(' - ')[0];
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch(`${API_BASE}/remove_teacher_course.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherId,
          course_code: courseCode,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? 'Kaldirma basarisiz.');
      }

      setTeachers((prev) =>
        prev.map((teacher) =>
          teacher.id === teacherId
            ? { ...teacher, courses: teacher.courses.filter((c) => c !== course) }
            : teacher,
        ),
      );
      setActionSuccess('Atama kaldirildi.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kaldirma basarisiz.';
      setActionError(message);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 lg:ml-64 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          <TopBar />
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Öğretmenler</h1>
            <p className="text-gray-500 mt-2">Öğretmen kayıt ve ders atama ekranı</p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              className="w-full sm:w-72 bg-blue-600 text-white border border-blue-600 hover:bg-blue-700"
              onClick={() => setShowForm((s) => !s)}
              disabled={!isAdmin}
            >
              {showForm ? 'Yeni Öğretmen Kaydını Gizle' : 'Yeni Öğretmen Kaydı'}
            </Button>

            <Button
              className="w-full sm:w-72 bg-blue-600 text-white border border-blue-600 hover:bg-blue-700"
              onClick={() => setShowAssignForm((s) => !s)}
              disabled={!isAdmin}
            >
              {showAssignForm ? 'Ders Atamayi Gizle' : 'Ders Ata'}
            </Button>

            </div>

            {isAdmin && showForm && (
              <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Yeni Öğretmen Kaydı</h2>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
                  <div>
                    <Label htmlFor="name">Ad Soyad</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Örn: Doç. Dr. Selim Koç"
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">Unvan</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Profesör / Doçent / Dr. Öğr. Üyesi"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="ad.soyad@uni.edu.tr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="+90 (5xx) xxx xx xx"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Bölüm</Label>
                    <Input
                      id="department"
                      value={form.department}
                      onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                      placeholder="Bilgisayar Mühendisliği"
                    />
                  </div>
                  <div>
                    <Label htmlFor="courses">Üstlendiği Dersler</Label>
                    <select
                      id="courses"
                      multiple
                      className="mt-1 w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.courses}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          courses: Array.from(e.target.selectedOptions, (o) => o.value),
                        }))
                      }
                    >
                      {courseOptions.map((course) => (
                        <option key={course.code} value={course.code}>
                          {course.code} - {course.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" className="w-full">
                      Kaydı Kaydet
                    </Button>
                  </div>
                  {submitError && (
                    <p className="text-sm text-red-600">{submitError}</p>
                  )}
                  {submitSuccess && (
                    <p className="text-sm text-green-600">{submitSuccess}</p>
                  )}
                </form>
              </Card>
            )}

            {isAdmin && showAssignForm && (
              <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Ders Atama</h2>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleAssign}>
                  <div>
                    <Label htmlFor="assignTeacher">Ogretmen</Label>
                    <select
                      id="assignTeacher"
                      className="mt-1 w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={assignForm.teacherId}
                      onChange={(e) =>
                        setAssignForm((prev) => ({ ...prev, teacherId: e.target.value }))
                      }
                    >
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="assignCourse">Ders</Label>
                    <select
                      id="assignCourse"
                      className="mt-1 w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={assignForm.courseCode}
                      onChange={(e) =>
                        setAssignForm((prev) => ({ ...prev, courseCode: e.target.value }))
                      }
                    >
                      {courseOptions.map((course) => (
                        <option key={course.code} value={course.code}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" className="w-full">
                      Dersi Ata
                    </Button>
                    {assignError && (
                      <p className="text-sm text-red-600">{assignError}</p>
                    )}
                    {assignSuccess && (
                      <p className="text-sm text-green-600">{assignSuccess}</p>
                    )}
                  </div>
                </form>
              </Card>
            )}
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Öğretmen Listesi</h2>
              <div className="text-sm text-gray-600">Toplam: {totalTeachers} öğretmen</div>
            {actionError && (
              <p className="text-sm text-red-600">{actionError}</p>
            )}
            {actionSuccess && (
              <p className="text-sm text-green-600">{actionSuccess}</p>
            )}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Unvan</TableHead>
                    <TableHead>Bölüm</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Dersler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.id} className="border-b hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">{teacher.name}</TableCell>
                      <TableCell className="text-gray-700">{teacher.title}</TableCell>
                      <TableCell className="text-gray-700">{teacher.department}</TableCell>
                      <TableCell className="text-gray-700">{teacher.email}</TableCell>
                      <TableCell className="space-y-1">
                        <div className="flex flex-wrap gap-2">
                          {teacher.courses.length === 0 && (
                            <span className="text-xs text-gray-500">Henüz atama yok</span>
                          )}
                          {teacher.courses.map((course) => (
                            <Badge
                              key={course}
                              className="bg-purple-50 text-purple-700 border border-purple-100"
                            >
                              <div className="flex items-center gap-2">
                                <span>{course}</span>
                                <button
                                  type="button"
                                  className="text-xs text-red-500 hover:text-red-700"
                                  onClick={() => removeCourse(teacher.id, course)}
                                >
                                  Kaldır
                                </button>
                              </div>
                            </Badge>
                          ))}
                        </div>
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
