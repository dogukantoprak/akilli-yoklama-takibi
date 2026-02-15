import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
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
import { FaceApi, loadFaceApiModels } from '@/lib/faceApi';

const API_BASE =
  import.meta.env.VITE_API_BASE ?? 'http://localhost:8079/smart_attendance_api';

type Student = {
  id: number;
  name: string;
  studentNo: string;
  className: string;
  email: string;
  phone: string;
  photoUrl: string;
  status: 'Aktif' | 'Pasif';
  courses: string[];
};

const fallbackAvatar =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iI2U1ZTdlYiIvPjxjaXJjbGUgY3g9IjE2IiBjeT0iMTUiIHI9IjMiIGZpbGw9IiM5Y2EzYWYiLz48Y2lyY2xlIGN4PSIyNCIgY3k9IjE1IiByPSIzIiBmaWxsPSIjOWNhM2FmIi8+PHBhdGggZD0iTTEyIDI3YzQgNCAxMiA0IDE2IDAiIHN0cm9rZT0iIzk5YTI4ZiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+PC9zdmc+';

const initialStudents: Student[] = [
  {
    id: 1,
    name: 'Ahmet Yılmaz',
    studentNo: '20210001234',
    className: 'Bilgisayar Mühendisliği / 2. Sınıf',
    email: 'ahmet.yilmaz@university.edu.tr',
    phone: '+90 (555) 123-4567',
    photoUrl: fallbackAvatar,
    status: 'Aktif',
    courses: ['BM101', 'BM102'],
  },
  {
    id: 2,
    name: 'Ayşe Kaya',
    studentNo: '20210001235',
    className: 'Bilgisayar Mühendisliği / 2. Sınıf',
    email: 'ayse.kaya@university.edu.tr',
    phone: '+90 (555) 234-5678',
    photoUrl: fallbackAvatar,
    status: 'Aktif',
    courses: ['BM102'],
  },
  {
    id: 3,
    name: 'Mehmet Demir',
    studentNo: '20210001236',
    className: 'Bilgisayar Mühendisliği / 2. Sınıf',
    email: 'mehmet.demir@university.edu.tr',
    phone: '+90 (555) 345-6789',
    photoUrl: fallbackAvatar,
    status: 'Aktif',
    courses: ['BM103'],
  },
];

const defaultCourses = [
  { code: 'BM101', name: 'Bilgisayar Programlama I' },
  { code: 'BM102', name: 'Web Teknolojileri' },
  { code: 'BM103', name: 'Veri Tabanları' },
  { code: 'BM104', name: 'Algoritma Analizi' },
];

const parseClassInfo = (className: string) => {
  const [departmentRaw, classRaw] = className.split('/');
  return {
    department: (departmentRaw ?? '').trim(),
    classLevel: (classRaw ?? '').trim(),
  };
};


export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState({
    name: '',
    studentNo: '',
    className: '',
    email: '',
    phone: '',
    photoUrl: '',
    status: 'Aktif',
  });
  const [assignment, setAssignment] = useState<{ studentId: number | ''; courseCodes: string[] }>({
    studentId: '',
    courseCodes: [],
  });
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    studentNo: '',
    className: '',
    email: '',
    phone: '',
    photoUrl: '',
    status: 'Aktif' as Student['status'],
  });
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [faceEncoding, setFaceEncoding] = useState<string | null>(null);
  const [faceError, setFaceError] = useState('');
  const [isEncoding, setIsEncoding] = useState(false);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editFaceEncoding, setEditFaceEncoding] = useState<string | null>(null);
  const [editFaceError, setEditFaceError] = useState('');
  const [isEditEncoding, setIsEditEncoding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [courseOptions, setCourseOptions] = useState(defaultCourses);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/students.php`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then((rows) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        const mapped = rows.map((row: any) => ({
          id: Number(row.id),
          name: row.name ?? 'Ogrenci',
          studentNo: row.student_no ?? '',
          className: [row.department, row.class_level].filter(Boolean).join(' / ') || '-',
          email: row.email ?? '',
          phone: row.phone ?? '',
          photoUrl: row.photo_url || fallbackAvatar,
          status: row.status === 'pasif' ? 'Pasif' : 'Aktif',
          courses: Array.isArray(row.courses)
            ? row.courses.map((course: string) => course.split(' - ')[0])
            : [],
        }));
        setStudents(mapped);
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

  useEffect(() => {
    if (!showStudentForm) return;
    let active = true;
    loadFaceApiModels()
      .then(() => {
        if (active) setFaceError('');
      })
      .catch(() => {
        if (active) setFaceError('Face models not loaded.');
      });
    return () => {
      active = false;
    };
  }, [showStudentForm]);

  useEffect(() => {
    if (!showEditForm) return;
    let active = true;
    loadFaceApiModels()
      .then(() => {
        if (active) setEditFaceError('');
      })
      .catch(() => {
        if (active) setEditFaceError('Face models not loaded.');
      });
    return () => {
      active = false;
    };
  }, [showEditForm]);

  const totalStudents = useMemo(() => students.length, [students]);

  const departmentOptions = useMemo(() => {
    const values = new Set<string>();
    students.forEach((student) => {
      const { department } = parseClassInfo(student.className);
      if (department) values.add(department);
    });
    return Array.from(values).sort();
  }, [students]);

  const classOptions = useMemo(() => {
    const values = new Set<string>();
    students.forEach((student) => {
      const { classLevel } = parseClassInfo(student.className);
      if (classLevel) values.add(classLevel);
    });
    return Array.from(values).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const { department, classLevel } = parseClassInfo(student.className);
      const matchesDepartment =
        departmentFilter === 'all' || department === departmentFilter;
      const matchesClass = classFilter === 'all' || classLevel === classFilter;
      return matchesDepartment && matchesClass;
    });
  }, [students, departmentFilter, classFilter]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.studentNo) {
      setSubmitError('Zorunlu alanlar bos.');
      setSubmitSuccess('');
      return;
    }
    if (photoFile && !faceEncoding) {
      setSubmitError('Face encoding is missing.');
      setSubmitSuccess('');
      return;
    }

    const { department, classLevel } = parseClassInfo(form.className);
    const payload = {
      name: form.name.trim(),
      student_no: form.studentNo.trim(),
      department,
      class_level: classLevel,
      email: form.email.trim(),
      phone: form.phone.trim(),
      status: form.status === 'Pasif' ? 'pasif' : 'aktif',
    };

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, value);
      });
      if (photoFile) {
        formData.append('photo', photoFile);
      }
      if (faceEncoding) {
        formData.append('face_encoding', faceEncoding);
      }

      const res = await fetch(`${API_BASE}/create_student.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? 'Kayit basarisiz.');
      }

      const created = data.student ?? {};
      const defaultPassword = created.default_password as string | undefined;
      const newStudent: Student = {
        id: Number(created.id),
        name: created.name ?? payload.name,
        studentNo: created.student_no ?? payload.student_no,
        className:
          [created.department ?? payload.department, created.class_level ?? payload.class_level]
            .filter(Boolean)
            .join(' / ') || payload.department || 'Sinif bilgisi yok',
        email: created.email ?? payload.email,
        phone: created.phone ?? payload.phone,
        photoUrl: created.photo_url || payload.photo_url || fallbackAvatar,
        status: created.status === 'pasif' ? 'Pasif' : 'Aktif',
        courses: [],
      };

      setStudents((prev) => [newStudent, ...prev]);
      setForm({
        name: '',
        studentNo: '',
        className: '',
        email: '',
        phone: '',
        photoUrl: '',
        status: 'Aktif',
      });
      setPhotoFile(null);
      setFaceEncoding(null);
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

  const startEdit = (student: Student) => {
    setEditStudent(student);
    setEditForm({
      name: student.name,
      studentNo: student.studentNo,
      className: student.className === '-' ? '' : student.className,
      email: student.email ?? '',
      phone: student.phone ?? '',
      photoUrl: student.photoUrl ?? '',
      status: student.status,
    });
    setEditPhotoFile(null);
    setEditFaceEncoding(null);
    setEditFaceError('');
    setIsEditEncoding(false);
    setUpdateError('');
    setUpdateSuccess('');
    setShowEditForm(true);
    setShowStudentForm(false);
    setShowAssignForm(false);
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;
    if (!editForm.name || !editForm.studentNo) {
      setUpdateError('Zorunlu alanlar bos.');
      setUpdateSuccess('');
      return;
    }
    if (editPhotoFile && !editFaceEncoding) {
      setUpdateError('Face encoding is missing.');
      setUpdateSuccess('');
      return;
    }

    const { department, classLevel } = parseClassInfo(editForm.className);
    const payload = {
      id: String(editStudent.id),
      name: editForm.name.trim(),
      student_no: editForm.studentNo.trim(),
      department,
      class_level: classLevel,
      email: editForm.email.trim(),
      phone: editForm.phone.trim(),
      status: editForm.status === 'Pasif' ? 'pasif' : 'aktif',
    };

    setIsUpdating(true);
    setUpdateError('');
    setUpdateSuccess('');

    try {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, value);
      });
      if (editPhotoFile) {
        formData.append('photo', editPhotoFile);
      }
      if (editFaceEncoding) {
        formData.append('face_encoding', editFaceEncoding);
      }

      const res = await fetch(`${API_BASE}/update_student.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? 'Guncelleme basarisiz.');
      }

      const updated = data.student ?? {};
      const nextClassName =
        [updated.department ?? payload.department, updated.class_level ?? payload.class_level]
          .filter(Boolean)
          .join(' / ') || payload.department || '-';
      const nextPhoto = updated.photo_url || editForm.photoUrl || fallbackAvatar;
      const nextStatus = updated.status === 'pasif' ? 'Pasif' : 'Aktif';

      setStudents((prev) =>
        prev.map((student) =>
          student.id === editStudent.id
            ? {
                ...student,
                name: updated.name ?? payload.name,
                studentNo: updated.student_no ?? payload.student_no,
                className: nextClassName,
                email: updated.email ?? payload.email,
                phone: updated.phone ?? payload.phone,
                status: nextStatus,
                photoUrl: nextPhoto,
              }
            : student,
        ),
      );

      setEditForm((prev) => ({
        ...prev,
        name: updated.name ?? payload.name,
        studentNo: updated.student_no ?? payload.student_no,
        className: nextClassName,
        email: updated.email ?? payload.email,
        phone: updated.phone ?? payload.phone,
        photoUrl: nextPhoto,
        status: nextStatus,
      }));
      setEditPhotoFile(null);
      setEditFaceEncoding(null);
      setUpdateSuccess('Ogrenci guncellendi.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Guncelleme basarisiz.';
      setUpdateError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssign = async (e: FormEvent) => {
    e.preventDefault();
    if (!assignment.studentId || assignment.courseCodes.length === 0) {
      setAssignError('Atama icin gerekli alanlari doldurun.');
      setAssignSuccess('');
      return;
    }

    setIsAssigning(true);
    setAssignError('');
    setAssignSuccess('');

    try {
      const res = await fetch(`${API_BASE}/assign_student_courses.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: assignment.studentId,
          course_codes: assignment.courseCodes,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? 'Atama basarisiz.');
      }

      setStudents((prev) =>
        prev.map((student) =>
          student.id === assignment.studentId
            ? {
                ...student,
                courses: Array.from(
                  new Set([...student.courses, ...assignment.courseCodes]),
                ),
              }
            : student,
        ),
      );
      setAssignment({ studentId: '', courseCodes: [] });
      setAssignSuccess('Atama kaydedildi.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Atama basarisiz.';
      setAssignError(message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setFaceEncoding(null);
    setFaceError('');
    setIsEncoding(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((prev) => ({ ...prev, photoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);

    const detectFace = async () => {
      try {
        await loadFaceApiModels();
        const image = new Image();
        image.src = URL.createObjectURL(file);
        await image.decode();
        const detection = await FaceApi.detectSingleFace(
          image,
          new FaceApi.TinyFaceDetectorOptions(),
        )
          .withFaceLandmarks()
          .withFaceDescriptor();
        URL.revokeObjectURL(image.src);

        if (!detection) {
          setFaceError('No face detected in photo.');
          setFaceEncoding(null);
          return;
        }

        const descriptor = Array.from(detection.descriptor);
        setFaceEncoding(JSON.stringify(descriptor));
      } catch (_error) {
        setFaceError('Face encoding failed.');
        setFaceEncoding(null);
      } finally {
        setIsEncoding(false);
      }
    };

    detectFace();
  };

  const handleEditPhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setEditPhotoFile(file);
    setEditFaceEncoding(null);
    setEditFaceError('');
    setIsEditEncoding(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditForm((prev) => ({ ...prev, photoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);

    const detectFace = async () => {
      try {
        await loadFaceApiModels();
        const image = new Image();
        image.src = URL.createObjectURL(file);
        await image.decode();
        const detection = await FaceApi.detectSingleFace(
          image,
          new FaceApi.TinyFaceDetectorOptions(),
        )
          .withFaceLandmarks()
          .withFaceDescriptor();
        URL.revokeObjectURL(image.src);

        if (!detection) {
          setEditFaceError('No face detected in photo.');
          setEditFaceEncoding(null);
          return;
        }

        const descriptor = Array.from(detection.descriptor);
        setEditFaceEncoding(JSON.stringify(descriptor));
      } catch (_error) {
        setEditFaceError('Face encoding failed.');
        setEditFaceEncoding(null);
      } finally {
        setIsEditEncoding(false);
      }
    };

    detectFace();
  };

  const removeCourse = async (studentId: number, courseCode: string) => {
    setAssignError('');
    setAssignSuccess('');
    try {
      const res = await fetch(`${API_BASE}/remove_student_course.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          course_code: courseCode,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? 'Kaldirma basarisiz.');
      }

      setStudents((prev) =>
        prev.map((student) =>
          student.id === studentId
            ? { ...student, courses: student.courses.filter((c) => c !== courseCode) }
            : student,
        ),
      );
      setAssignSuccess('Atama kaldirildi.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kaldirma basarisiz.';
      setAssignError(message);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 lg:ml-64 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          <TopBar />
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Öğrenciler</h1>
            <p className="text-gray-500 mt-2">Öğrenci kayıt, güncel liste ve ders atama işlemleri</p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <Button
                className="lg:w-60 bg-blue-600 text-white border border-blue-600 hover:bg-blue-700"
                onClick={() => setShowStudentForm((s) => !s)}
              >
                {showStudentForm ? 'Öğrenci Kaydını Gizle' : 'Öğrenci Kaydı'}
              </Button>
              <Button
                className="lg:w-60 bg-blue-600 text-white border border-blue-600 hover:bg-blue-700"
                onClick={() => setShowAssignForm((s) => !s)}
              >
                {showAssignForm ? 'Ders Atamayı Gizle' : 'Ders Atama'}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {showStudentForm && (
                <Card className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Öğrenci Kaydı</h2>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Ad Soyad</Label>
                        <Input
                          id="name"
                          value={form.name}
                          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Örn: Zeynep Şahin"
                        />
                      </div>
                      <div>
                        <Label htmlFor="studentNo">Öğrenci No</Label>
                        <Input
                          id="studentNo"
                          value={form.studentNo}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, studentNo: e.target.value }))
                          }
                          placeholder="Örn: 20210009999"
                        />
                      </div>
                      <div>
                        <Label htmlFor="className">Bölüm / Sınıf</Label>
                        <Input
                          id="className"
                          value={form.className}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, className: e.target.value }))
                          }
                          placeholder="Bilgisayar Müh. / 3. Sınıf"
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
                        <Label htmlFor="email">E-posta</Label>
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="ad.soyad@universite.edu.tr"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="photo">Fotograf</Label>
                        <Input
                          id="photo"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {form.photoUrl && (
                          <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
                            <img
                              src={form.photoUrl}
                              alt="Ogrenci fotografi onizleme"
                              className="h-10 w-10 rounded-full object-cover border border-gray-200"
                            />
                            <span>Secili fotograf</span>
                          </div>
                        )}
                        {isEncoding && (
                          <p className="mt-2 text-xs text-gray-500">Encoding face...</p>
                        )}
                        {faceError && (
                          <p className="mt-2 text-xs text-red-600">{faceError}</p>
                        )}
                        {faceEncoding && !faceError && (
                          <p className="mt-2 text-xs text-green-600">Face encoding ready.</p>
                        )}
                      </div>
                      <div>
                        <Label>Durum</Label>
                        <Select
                          value={form.status}
                          onValueChange={(val) =>
                            setForm((prev) => ({ ...prev, status: val as Student['status'] }))
                          }
                        >
                          <SelectTrigger className="mt-1" />
                          <SelectContent>
                            <SelectItem value="Aktif">Aktif</SelectItem>
                            <SelectItem value="Pasif">Pasif</SelectItem>
                          </SelectContent>
                          <SelectValue />
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting || isEncoding}>
                      Kaydı Oluştur
                    </Button>
                    {submitError && (
                      <p className="text-sm text-red-600">{submitError}</p>
                    )}
                    {submitSuccess && (
                      <p className="text-sm text-green-600">{submitSuccess}</p>
                    )}
                  </form>
                </Card>
              )}

              {showEditForm && editStudent && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Ogrenci Duzenle</h2>
                    <Button
                      type="button"
                      className="bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditStudent(null);
                        setUpdateError('');
                        setUpdateSuccess('');
                      }}
                    >
                      Kapat
                    </Button>
                  </div>
                  <form className="space-y-4" onSubmit={handleUpdate}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="editName">Ad Soyad</Label>
                        <Input
                          id="editName"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, name: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="editStudentNo">Ogrenci No</Label>
                        <Input
                          id="editStudentNo"
                          value={editForm.studentNo}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, studentNo: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="editClassName">Bolum / Sinif</Label>
                        <Input
                          id="editClassName"
                          value={editForm.className}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, className: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="editPhone">Telefon</Label>
                        <Input
                          id="editPhone"
                          value={editForm.phone}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="editEmail">E-posta</Label>
                        <Input
                          id="editEmail"
                          type="email"
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, email: e.target.value }))
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="editPhoto">Fotograf</Label>
                        <Input
                          id="editPhoto"
                          type="file"
                          accept="image/*"
                          onChange={handleEditPhotoChange}
                          className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {editForm.photoUrl && (
                          <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
                            <img
                              src={editForm.photoUrl}
                              alt="Ogrenci fotografi onizleme"
                              className="h-10 w-10 rounded-full object-cover border border-gray-200"
                            />
                            <span>Secili fotograf</span>
                          </div>
                        )}
                        {isEditEncoding && (
                          <p className="mt-2 text-xs text-gray-500">Encoding face...</p>
                        )}
                        {editFaceError && (
                          <p className="mt-2 text-xs text-red-600">{editFaceError}</p>
                        )}
                        {editFaceEncoding && !editFaceError && (
                          <p className="mt-2 text-xs text-green-600">
                            Face encoding ready.
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Durum</Label>
                        <Select
                          value={editForm.status}
                          onValueChange={(val) =>
                            setEditForm((prev) => ({ ...prev, status: val as Student['status'] }))
                          }
                        >
                          <SelectTrigger className="mt-1" />
                          <SelectContent>
                            <SelectItem value="Aktif">Aktif</SelectItem>
                            <SelectItem value="Pasif">Pasif</SelectItem>
                          </SelectContent>
                          <SelectValue />
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isUpdating || isEditEncoding}>
                      Guncelle
                    </Button>
                    {updateError && (
                      <p className="text-sm text-red-600">{updateError}</p>
                    )}
                    {updateSuccess && (
                      <p className="text-sm text-green-600">{updateSuccess}</p>
                    )}
                  </form>
                </Card>
              )}

              {showAssignForm && (
                <Card className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Ders Atama</h2>
                  <form className="space-y-4" onSubmit={handleAssign}>
                    <div>
                      <Label htmlFor="student">Öğrenci Seç</Label>
                      <select
                        id="student"
                        className="mt-1 w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={assignment.studentId}
                        onChange={(e) =>
                          setAssignment((prev) => ({
                            ...prev,
                            studentId: e.target.value ? Number(e.target.value) : '',
                          }))
                        }
                      >
                        <option value="">Seçiniz</option>
                        {filteredStudents.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.name} ({student.studentNo})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="courses">Ders Seç (çoklu)</Label>
                      <select
                        id="courses"
                        multiple
                        className="mt-1 w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={assignment.courseCodes}
                        onChange={(e) =>
                          setAssignment((prev) => ({
                            ...prev,
                            courseCodes: Array.from(e.target.selectedOptions, (o) => o.value),
                          }))
                        }
                      >
                        {courseOptions.map((course) => (
                          <option key={course.code} value={course.code}>
                            {course.code} - {course.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting || isEncoding}>
                      Dersleri Ata
                    </Button>
                    {assignError && (
                      <p className="text-sm text-red-600">{assignError}</p>
                    )}
                    {assignSuccess && (
                      <p className="text-sm text-green-600">{assignSuccess}</p>
                    )}
                  </form>
                </Card>
              )}
            </div>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Öğrenci Listesi</h2>
              <div className="text-sm text-gray-600">
                Toplam: {filteredStudents.length} / {totalStudents}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="departmentFilter">Bolum</Label>
                <select
                  id="departmentFilter"
                  className="mt-1 w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="all">Tum bolumler</option>
                  {departmentOptions.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="classFilter">Sinif</Label>
                <select
                  id="classFilter"
                  className="mt-1 w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                >
                  <option value="all">Tum siniflar</option>
                  {classOptions.map((classLevel) => (
                    <option key={classLevel} value={classLevel}>
                      {classLevel}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead>Fotograf</TableHead>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Öğrenci No</TableHead>
                    <TableHead>Bölüm / Sınıf</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Dersler</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Islem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} className="border-b hover:bg-gray-50">
                      <TableCell>
                        <img
                          src={student.photoUrl || fallbackAvatar}
                          alt={`${student.name} fotograf`}
                          className="h-10 w-10 rounded-full object-cover border border-gray-200"
                        />
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">{student.name}</TableCell>
                      <TableCell className="text-gray-700">{student.studentNo}</TableCell>
                      <TableCell className="text-gray-700">{student.className}</TableCell>
                      <TableCell className="text-gray-700">{student.email}</TableCell>
                      <TableCell className="space-y-1">
                        <div className="flex flex-wrap gap-2">
                          {student.courses.length === 0 && (
                            <span className="text-xs text-gray-500">Atama yok</span>
                          )}
                          {student.courses.map((course) => (
                            <Badge
                              key={course}
                              className="bg-blue-50 text-blue-700 border border-blue-100"
                            >
                              <div className="flex items-center gap-2">
                                <span>{course}</span>
                                <button
                                  type="button"
                                  className="text-xs text-red-500 hover:text-red-700"
                                  onClick={() => removeCourse(student.id, course)}
                                >
                                  Kaldır
                                </button>
                              </div>
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            student.status === 'Aktif'
                              ? 'bg-green-100 text-green-800 border-0'
                              : 'bg-gray-100 text-gray-800 border-0'
                          }
                        >
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          className="bg-blue-600 text-white border border-blue-600 hover:bg-blue-700"
                          onClick={() => startEdit(student)}
                        >
                          Duzenle
                        </Button>
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
