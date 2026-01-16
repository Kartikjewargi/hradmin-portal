import { useEffect, useState, useMemo } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { attendanceApi } from '@/services/api';
import { AttendanceRecord } from '@/types';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      const response = await attendanceApi.getToday();
      if (response.success && response.data) {
        setAttendance(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load attendance data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return (
          <Badge className="bg-success/15 text-success border border-success/30 hover:bg-success/20">
            <CheckCircle className="mr-1.5 h-3 w-3" />
            Present
          </Badge>
        );
      case 'absent':
        return (
          <Badge className="bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/20">
            <XCircle className="mr-1.5 h-3 w-3" />
            Absent
          </Badge>
        );
      case 'late':
        return (
          <Badge className="bg-warning/15 text-warning border border-warning/30 hover:bg-warning/20">
            <AlertCircle className="mr-1.5 h-3 w-3" />
            Late
          </Badge>
        );
      case 'half-day':
        return (
          <Badge className="bg-info/15 text-info border border-info/30 hover:bg-info/20">
            <Clock className="mr-1.5 h-3 w-3" />
            Half Day
          </Badge>
        );
      default:
        return null;
    }
  };

  const stats = useMemo(() => ({
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    halfDay: attendance.filter(a => a.status === 'half-day').length,
    total: attendance.length,
  }), [attendance]);

  const attendanceRate = stats.total > 0 
    ? Math.round(((stats.present + stats.late + stats.halfDay) / stats.total) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold text-foreground">Attendance</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.present}</p>
              <p className="text-sm text-muted-foreground">Present</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.absent}</p>
              <p className="text-sm text-muted-foreground">Absent</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
              <AlertCircle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.late}</p>
              <p className="text-sm text-muted-foreground">Late</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-info">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
              <Clock className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.halfDay}</p>
              <p className="text-sm text-muted-foreground">Half Day</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Rate */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today's Attendance Rate</p>
              <p className="text-3xl font-bold text-foreground">{attendanceRate}%</p>
            </div>
            <div className="h-3 flex-1 mx-8 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-success to-success/70 transition-all duration-500"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{stats.present + stats.late + stats.halfDay} / {stats.total}</p>
              <p className="text-xs text-muted-foreground">employees present</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card className="shadow-card overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg font-semibold">
            Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead className="font-semibold">Employee</TableHead>
                  <TableHead className="font-semibold">Department</TableHead>
                  <TableHead className="font-semibold">Check In</TableHead>
                  <TableHead className="font-semibold">Check Out</TableHead>
                  <TableHead className="font-semibold">Hours</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="h-10 w-10 text-muted-foreground/50" />
                        <p className="font-medium text-muted-foreground">No attendance records for today</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  attendance.map((record) => {
                    // Calculate hours worked
                    let hoursWorked = '—';
                    if (record.checkIn && record.checkOut) {
                      const [inH, inM] = record.checkIn.split(':').map(Number);
                      const [outH, outM] = record.checkOut.split(':').map(Number);
                      const totalMins = (outH * 60 + outM) - (inH * 60 + inM);
                      const hours = Math.floor(totalMins / 60);
                      const mins = totalMins % 60;
                      hoursWorked = `${hours}h ${mins}m`;
                    }

                    return (
                      <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                              {record.employeeName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-medium">{record.employeeName}</p>
                              <p className="text-sm text-muted-foreground">{record.employeeId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{record.department}</span>
                        </TableCell>
                        <TableCell>
                          {record.checkIn ? (
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-success" />
                              <span className="font-medium">{record.checkIn}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.checkOut ? (
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-destructive" />
                              <span className="font-medium">{record.checkOut}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={hoursWorked !== '—' ? 'font-medium' : 'text-muted-foreground'}>
                            {hoursWorked}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
