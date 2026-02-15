import { useEffect, useState } from 'react';
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
import { Smartphone } from 'lucide-react';

const API_BASE =
  import.meta.env.VITE_API_BASE ?? 'http://localhost:8079/smart_attendance_api';

type Device = {
  id: number;
  deviceId: string;
  name: string;
  type: string;
  location: string;
  ipAddress: string;
  lastSeen: string;
  status: 'online' | 'offline';
  statusLabel: string;
  statusColor: string;
};

const defaultDeviceData: Device[] = [];


export default function Devices() {
  const [deviceData, setDeviceData] = useState<Device[]>(defaultDeviceData);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoadError('');
    fetch(`${API_BASE}/devices.php`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then((rows) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        const mapped = rows.map((row: any) => {
          const isOnline = row.status !== 'pasif';
          return {
            id: Number(row.id),
            deviceId: row.device_id ?? `DEV-${row.id}`,
            name: row.name ?? `Device ${row.id}`,
            type: row.type ?? 'Tablet',
            location: row.location ?? '-',
            ipAddress: row.ip_address ?? '-',
            lastSeen: row.last_seen ?? '-',
            status: isOnline ? 'online' : 'offline',
            statusLabel: isOnline ? 'Cevrimici' : 'Cevrimdisi',
            statusColor: isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800',
          } as Device;
        });
        setDeviceData(mapped);
        setLoadError('');
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setLoadError('Cihaz listesi alinamadi.');
      });

    return () => controller.abort();
  }, []);

  const totalDevices = deviceData.length;
  const onlineCount = deviceData.filter((d) => d.status === 'online').length;
  const offlineCount = deviceData.filter((d) => d.status === 'offline').length;


  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 lg:ml-64 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          <TopBar className="mb-6" />
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Cihazlar</h1>
            <p className="text-gray-500 mt-2">Sistem bağlı cihazların yönetimi</p>
          </div>

          {/* Device Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Toplam Cihaz</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {totalDevices}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                  <Smartphone size={24} />
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Çevrimiçi</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {onlineCount}
                  </p>
                </div>
                <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                  <Smartphone size={24} />
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Çevrimdışı</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {offlineCount}
                  </p>
                </div>
                <div className="p-3 bg-gray-100 text-gray-600 rounded-lg">
                  <Smartphone size={24} />
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">Cihaz Listesi</h2>
              {loadError && (
                <p className="mt-2 text-sm text-red-600">{loadError}</p>
              )}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="text-xs font-semibold text-gray-600">
                      Cihaz ID
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">
                      Cihaz Adı
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">
                      Tür
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">
                      Konum
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">
                      IP Adresi
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">
                      Son Görülme
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">
                      Durum
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deviceData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-sm text-gray-500">
                      Cihaz bulunamadi.
                    </TableCell>
                  </TableRow>
                  )}
                  {deviceData.map((device) => (
                    <TableRow key={device.id} className="border-b hover:bg-gray-50">
                      <TableCell className="text-sm font-medium text-gray-900 py-4">
                        {device.deviceId}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 py-4">
                        {device.name}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 py-4">
                        {device.type}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 py-4">
                        {device.location}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 py-4 font-mono">
                        {device.ipAddress}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 py-4">
                        {device.lastSeen}
                      </TableCell>
                      <TableCell className="text-sm py-4">
                        <Badge className={`${device.statusColor} border-0`}>
                          {device.statusLabel}
                        </Badge>
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
