import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { FaceApi, loadFaceApiModels } from '@/lib/faceApi';

const API_BASE =
  import.meta.env.VITE_API_BASE ?? 'http://localhost:8079/smart_attendance_api';

type AttendanceSession = {
  id: number;
  courseId?: number;
  course: string;
  courseCode?: string;
  date: string;
  time: string;
  duration: string;
  attendees: number;
  absences: number;
  status: 'Devam Ediyor' | 'Tamamlandi';
  statusColor: string;
  present?: { name: string; photo_url?: string }[];
  absent?: { name: string; photo_url?: string }[];
  instructor?: string;
  classroom?: string;
};

type FaceStudent = {
  id: number;
  name: string;
  photoUrl?: string;
  descriptor: Float32Array;
};

const fallbackAvatar =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iI2U1ZTdlYiIvPjxjaXJjbGUgY3g9IjE2IiBjeT0iMTUiIHI9IjMiIGZpbGw9IiM5Y2EzYWYiLz48Y2lyY2xlIGN4PSIyNCIgY3k9IjE1IiByPSIzIiBmaWxsPSIjOWNhM2FmIi8+PHBhdGggZD0iTTEyIDI3YzQgNCAxMiA0IDE2IDAiIHN0cm9rZT0iIzk5YTI4ZiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+PC9zdmc+';

const studentPhotoByName: Record<string, string> = {};

const getStudentPhoto = (name: string) => studentPhotoByName[name] ?? fallbackAvatar;

const resolveCameraError = (error: unknown) => {
  const err = error as { name?: string; message?: string };
  switch (err?.name) {
    case 'NotAllowedError':
      return 'Kamera izni reddedildi.';
    case 'NotFoundError':
      return 'Kamera bulunamadi.';
    case 'NotReadableError':
      return 'Kamera baska bir uygulama tarafindan kullaniliyor.';
    default:
      return err?.message ? `Camera scan failed: ${err.message}` : 'Camera scan failed.';
  }
};

const mapAttendanceRows = (rows: any[]): AttendanceSession[] =>
  rows.map((row: any) => {
    const presentList = Array.isArray(row.present) ? row.present : [];
    const absentList = Array.isArray(row.absent) ? row.absent : [];
    const normalizedStatus = typeof row.status === 'string' ? row.status.toLowerCase() : '';
    const resolvedStatus = normalizedStatus.startsWith('tamam')
      ? 'Tamamlandi'
      : 'Devam Ediyor';
    const statusColor =
      row.statusColor ??
      (resolvedStatus === 'Tamamlandi'
        ? 'bg-gray-100 text-gray-800'
        : 'bg-green-100 text-green-800');
    return {
      id: Number(row.id),
      courseId: Number(row.course_id ?? row.courseId ?? 0),
      course: row.course ?? row.course_name ?? '',
      courseCode: row.course_code ?? row.courseCode ?? '',
      date: row.date ?? row.session_date ?? '',
      time: row.time ?? row.start_time ?? '',
      duration: String(row.duration ?? row.duration_minutes ?? ''),
      attendees: Number(row.attendees ?? presentList.length),
      absences: Number(row.absences ?? absentList.length),
      status: resolvedStatus,
      statusColor,
      present: presentList,
      absent: absentList,
      instructor: row.instructor ?? '',
      classroom: row.classroom ?? '',
    } as AttendanceSession;
  });

export default function Attendance() {
  const { role, profile } = useAuth();
    const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';
  const teacherName = profile?.name?.toLowerCase() ?? '';

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selected, setSelected] = useState<AttendanceSession | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [courseOptions, setCourseOptions] = useState<{ id: number; name: string; instructor?: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState({
    courseId: '',
    date: '',
    time: '',
    duration: '50',
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const matcherRef = useRef<FaceApi.FaceMatcher | null>(null);
  const faceStudentMapRef = useRef<Map<number, FaceStudent>>(new Map());
  const recognizedRef = useRef<Set<number>>(new Set());
  const processingRef = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [faceStudents, setFaceStudents] = useState<FaceStudent[]>([]);
  const [scanStatus, setScanStatus] = useState('');
  const [recognizedCount, setRecognizedCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_BASE}/attendance.php`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then((rows) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        const mapped = mapAttendanceRows(rows);
        setSessions(mapped);
        setSelected(mapped[0] ?? null);
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
        if (!Array.isArray(rows)) return;
        const mapped = rows
          .map((row: any) => ({
            id: Number(row.id),
            name: row.name ?? '',
            instructor: row.instructor ?? '',
          }))
          .filter((course: any) => course.id && course.name);
        setCourseOptions(mapped);
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  const teacherCourses = useMemo(() => {
    if (!teacherName) return [] as string[];
    return courseOptions
      .filter((course) => (course.instructor ?? '').toLowerCase() === teacherName)
      .map((course) => course.name);
  }, [courseOptions, teacherName]);

  const availableCourseOptions = useMemo(() => {
    if (!isTeacher) return courseOptions;
    return courseOptions.filter(
      (course) => (course.instructor ?? '').toLowerCase() === teacherName,
    );
  }, [courseOptions, isTeacher, teacherName]);

  const visibleSessions = useMemo(() => {
    if (!isTeacher) return sessions;
    if (teacherCourses.length === 0) return [];
    return sessions.filter((session) => teacherCourses.includes(session.course));
  }, [isTeacher, sessions, teacherCourses]);

  const totalSessions = useMemo(() => visibleSessions.length, [visibleSessions]);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  useEffect(() => {
    stopScanning();
  }, [selected?.id]);

  const presentList = selected?.present ?? [];
  const absentList = selected?.absent ?? [];

  useEffect(() => {
    if (!selected || !visibleSessions.some((session) => session.id === selected.id)) {
      setSelected(visibleSessions[0] ?? null);
    }
  }, [visibleSessions, selected]);

  useEffect(() => {
    if (availableCourseOptions.length === 0) return;
    if (
      form.courseId &&
      availableCourseOptions.some((course) => String(course.id) === form.courseId)
    ) {
      return;
    }
    setForm((prev) => ({ ...prev, courseId: String(availableCourseOptions[0].id) }));
  }, [availableCourseOptions, form.courseId]);

  const canCreate = isAdmin || isTeacher;
  const canScan = isTeacher;

  const appendPresent = (list: { name: string; photo_url?: string }[] | undefined, student: FaceStudent) => {
    const exists = list?.some((item) => item.name === student.name);
    if (exists) return list ?? [];
    return [...(list ?? []), { name: student.name, photo_url: student.photoUrl }];
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    matcherRef.current = null;
    faceStudentMapRef.current = new Map();
    recognizedRef.current = new Set();
    processingRef.current = false;
    setIsScanning(false);
    setScanStatus('');
    setRecognizedCount(0);
  };

  const handleEndSession = async () => {
    if (!selected) return;
    setScanError('');
    try {
      const res = await fetch(`${API_BASE}/end_attendance_session.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: selected.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error('end failed');
      }
      stopScanning();
      setSessions((prev) =>
        prev.map((session) =>
          session.id === selected.id
            ? {
                ...session,
                status: 'Tamamlandi',
                statusColor: 'bg-gray-100 text-gray-800',
              }
            : session,
        ),
      );
      setSelected((prev) =>
        prev && prev.id === selected.id
          ? {
              ...prev,
              status: 'Tamamlandi',
              statusColor: 'bg-gray-100 text-gray-800',
            }
          : prev,
      );

      const refreshRes = await fetch(`${API_BASE}/attendance.php`);
      const refreshRows = await refreshRes.json().catch(() => null);
      if (refreshRes.ok && Array.isArray(refreshRows)) {
        const mapped = mapAttendanceRows(refreshRows);
        setSessions(mapped);
        const refreshed = mapped.find((session) => session.id === selected.id);
        setSelected(refreshed ?? mapped[0] ?? null);
      }
    } catch (_error) {
      setScanError('End session failed.');
    }
  };

  const startScanning = async () => {
    if (!selected || !selected.courseId) {
      setScanError('Select a session first.');
      return;
    }
    if (selected.status !== 'Devam Ediyor') {
      setScanError('Session is not active.');
      return;
    }
    setScanError('');
    setScanStatus('Loading models...');

    try {
      await loadFaceApiModels();

      const studentsRes = await fetch(
        `${API_BASE}/course_students.php?course_id=${selected.courseId}`,
      );
      const studentsData = await studentsRes.json().catch(() => null);
      if (!studentsRes.ok || !studentsData?.ok) {
        throw new Error('Students load failed');
      }
      const rawStudents = Array.isArray(studentsData.students) ? studentsData.students : [];
      const prepared: FaceStudent[] = rawStudents
        .filter((student: any) => student.face_encoding)
        .map((student: any) => ({
          id: Number(student.id),
          name: student.name ?? 'Student',
          photoUrl: student.photo_url ?? undefined,
          descriptor: new Float32Array(JSON.parse(student.face_encoding)),
        }));

      if (prepared.length === 0) {
        setScanError('No face data for students.');
        setScanStatus('');
        return;
      }

      const labeled = prepared.map(
        (student) => new FaceApi.LabeledFaceDescriptors(String(student.id), [student.descriptor]),
      );
      matcherRef.current = new FaceApi.FaceMatcher(labeled, 0.5);
      faceStudentMapRef.current = new Map(prepared.map((s) => [s.id, s]));
      setFaceStudents(prepared);

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error('Camera not ready');
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      streamRef.current = stream;

      recognizedRef.current = new Set();
      setRecognizedCount(0);
      setIsScanning(true);
      setScanStatus('Scanning...');

      const sessionId = selected.id;

      const runScan = async () => {
        if (!videoRef.current || !matcherRef.current || processingRef.current) return;
        processingRef.current = true;
        try {
          const detections = await FaceApi
            .detectAllFaces(videoRef.current, new FaceApi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

          for (const detection of detections) {
            const match = matcherRef.current.findBestMatch(detection.descriptor);
            if (!match || match.label === 'unknown') {
              continue;
            }
            const studentId = Number(match.label);
            if (recognizedRef.current.has(studentId)) {
              continue;
            }
            recognizedRef.current.add(studentId);
            setRecognizedCount(recognizedRef.current.size);
            setScanStatus(`Recognized: ${recognizedRef.current.size}`);
            const student = faceStudentMapRef.current.get(studentId);
            if (!student) continue;

            await fetch(`${API_BASE}/record_attendance.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                session_id: sessionId,
                student_id: studentId,
                confidence: Math.max(0, 1 - match.distance),
              }),
            });

            setSessions((prev) =>
              prev.map((session) => {
                if (session.id !== sessionId) return session;
                const nextPresent = appendPresent(session.present, student);
                return {
                  ...session,
                  attendees: nextPresent.length,
                  present: nextPresent,
                };
              }),
            );
            setSelected((prev) => {
              if (!prev || prev.id !== sessionId) return prev;
              const nextPresent = appendPresent(prev.present, student);
              return {
                ...prev,
                attendees: nextPresent.length,
                present: nextPresent,
              };
            });
          }
        } finally {
          processingRef.current = false;
        }
      };

      scanIntervalRef.current = window.setInterval(() => {
        runScan().catch(() => undefined);
      }, 900);
    } catch (error) {
      stopScanning();
      setScanError(resolveCameraError(error));
      setScanStatus('');
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.courseId || !form.date || !form.time) {
      setSubmitError('Zorunlu alanlar bos.');
      return;
    }
    if (isTeacher && availableCourseOptions.length === 0) return;

    const payload = {
      course_id: Number(form.courseId),
      session_date: form.date,
      start_time: form.time,
      duration: Number(form.duration) || 50,
    };

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch(`${API_BASE}/create_attendance_session.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? 'Kayit basarisiz.');
      }

      const created = data.session ?? {};
      const courseName =
        created.course_name ??
        availableCourseOptions.find((course) => String(course.id) === form.courseId)?.name ??
        '';
      const resolvedStatus =
        typeof created.status === 'string' && created.status.toLowerCase().includes('tamam')
          ? 'Tamamlandi'
          : 'Devam Ediyor';
      const statusColor =
        resolvedStatus === 'Tamamlandi' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800';

      const newSession: AttendanceSession = {
        id: Number(created.id),
        courseId: Number(created.course_id ?? form.courseId),
        course: courseName,
        date: created.session_date ?? form.date,
        time: created.start_time ?? form.time,
        duration: String(created.duration ?? form.duration),
        attendees: 0,
        absences: 0,
        status: resolvedStatus,
        statusColor,
      };

      setSessions((prev) => [newSession, ...prev]);
      setSelected(newSession);
      setShowCreate(false);
      setForm({
        courseId: availableCourseOptions[0] ? String(availableCourseOptions[0].id) : '',
        date: '',
        time: '',
        duration: '50',
      });
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
          <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Yoklama Yönetimi</h1>
              <p className="text-gray-500 mt-2">Yoklama oluşturma ve raporlama</p>
            </div>
            {canCreate && (
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setShowCreate((s) => !s)}
                disabled={isTeacher && availableCourseOptions.length === 0}
            >
              {showCreate ? 'Formu Gizle' : '+ Yeni Yoklama Başlat'}
              </Button>
            )}
          </div>

          {showCreate && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Yeni Yoklama</h2>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleCreate}>
                                                <div className="md:col-span-2">
                  <Label htmlFor="course">Ders Adi</Label>
                  <select
                    id="course"
                    className="mt-1 w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.courseId}
                    onChange={(e) => setForm((prev) => ({ ...prev, courseId: e.target.value }))}
                    disabled={availableCourseOptions.length === 0}
                    required
                  >
                    {availableCourseOptions.length === 0 ? (
                      <option value="">Ders bulunamadi</option>
                    ) : (
                      availableCourseOptions.map((course) => (
                        <option key={course.id} value={String(course.id)}>
                          {course.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <Label htmlFor="date">Tarih</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="time">Saat</Label>
                  <Input
                    id="time"
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Süre (dk)</Label>
                  <Input
                    id="duration"
                    value={form.duration}
                    onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" className="w-full">
                    Yoklamayı Başlat
                  </Button>
                  {submitError && (
                    <p className="text-sm text-red-600">{submitError}</p>
                  )}
                </div>
              </form>
            </Card>
          )}

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Yoklama Oturumları</h2>
              <div className="text-sm text-gray-600">Toplam: {totalSessions}</div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead>Ders Adı</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Saat</TableHead>
                    <TableHead>Süre (dk)</TableHead>
                    <TableHead>Katılan</TableHead>
                    <TableHead>Devamsız</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleSessions.map((attendance) => (
                    <TableRow key={attendance.id} className="border-b hover:bg-gray-50">
                      <TableCell className="text-sm font-medium text-gray-900 py-4">
                        {attendance.course}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 py-4">
                        {attendance.date}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 py-4">
                        {attendance.time}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 py-4">
                        {attendance.duration}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 py-4 font-semibold">
                        {attendance.attendees}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 py-4 font-semibold">
                        {attendance.absences}
                      </TableCell>
                      <TableCell className="text-sm py-4">
                        <Badge className={`${attendance.statusColor} border-0`}>
                          {attendance.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm py-4">
                        <button
                          className="text-blue-600 hover:text-blue-900 font-medium"
                          onClick={() => setSelected(attendance)}
                        >
                          Detaylar
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {selected && canScan && (
            <Card className="p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Camera Attendance</h2>
                  <p className="text-sm text-gray-500">
                    Session: {selected.course} - {selected.date}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={startScanning}
                    disabled={isScanning || selected.status !== 'Devam Ediyor'}
                  >
                    Start Camera
                  </Button>
                  <Button
                    className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                    onClick={stopScanning}
                    disabled={!isScanning}
                  >
                    Stop Camera
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleEndSession}
                    disabled={selected.status !== 'Devam Ediyor'}
                  >
                    End Session
                  </Button>
                </div>
              </div>
              {scanError && <p className="mt-2 text-sm text-red-600">{scanError}</p>}
              {scanStatus && <p className="mt-2 text-sm text-gray-600">{scanStatus}</p>}
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 bg-black/5 p-2">
                  <video ref={videoRef} className="w-full rounded-lg" playsInline muted />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Recognized: {recognizedCount}</p>
                  <div className="flex flex-wrap gap-2">
                    {faceStudents.length === 0 ? (
                      <span className="text-sm text-gray-500">No student face data.</span>
                    ) : (
                      faceStudents.map((student) => (
                        <Badge
                          key={student.id}
                          className={
                            recognizedRef.current.has(student.id)
                              ? 'bg-green-100 text-green-800 border-0'
                              : 'bg-gray-100 text-gray-700 border-0'
                          }
                        >
                          {student.name}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {selected && (
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Seçilen Oturum</p>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selected.courseCode ? `${selected.courseCode} - ` : ''}
                    {selected.course}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {[
                      selected.courseCode ? `Kod: ${selected.courseCode}` : '',
                      selected.classroom ? `Sinif: ${selected.classroom}` : '',
                      selected.instructor ? `Ogretmen: ${selected.instructor}` : '',
                    ]
                      .filter((value) => Boolean(value))
                      .join(' | ')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selected.date} • {selected.time} • {selected.duration} dk
                  </p>
                </div>
                <Badge className={`${selected.statusColor} border-0`}>{selected.status}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500">Katılan</p>
                  <p className="text-2xl font-bold text-gray-900">{selected.attendees}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500">Devamsız</p>
                  <p className="text-2xl font-bold text-gray-900">{selected.absences}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500">Toplam</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selected.attendees + selected.absences}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Gelen Ogrenciler</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {presentList?.length ? (
                      presentList.map((student) => (
                        <li key={student.name} className="flex items-center gap-3">
                          <img
                            src={student.photo_url || getStudentPhoto(student.name)}
                            alt={`${student.name} fotograf`}
                            className="h-8 w-8 rounded-full object-cover border border-gray-200"
                          />
                          <span>{student.name}</span>
                        </li>
                      ))
                    ) : (
                      <li>Henuz liste yok</li>
                    )}
                  </ul>
                </div>
                                                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Gelmeyen Ogrenciler</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {absentList?.length ? (
                      absentList.map((student) => (
                        <li key={student.name} className="flex items-center gap-3">
                          <img
                            src={student.photo_url || getStudentPhoto(student.name)}
                            alt={`${student.name} fotograf`}
                            className="h-8 w-8 rounded-full object-cover border border-gray-200"
                          />
                          <span>{student.name}</span>
                        </li>
                      ))
                    ) : (
                      <li>Henuz liste yok</li>
                    )}
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
