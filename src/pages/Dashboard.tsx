import { useEffect, useState } from 'react';
import { Users, CalendarClock, FileText, CreditCard, ArrowRight, Building2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { employeesApi, attendanceApi, leavesApi, payslipsApi } from '@/services/api';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'warning' | 'info';
  onClick?: () => void;
}

function StatCard({ title, value, subtitle, icon, color, onClick }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary border-l-primary hover:border-l-2',
    success: 'bg-success/10 text-success border-l-success hover:border-l-2',
    warning: 'bg-warning/10 text-warning border-l-warning hover:border-l-2',
    info: 'bg-info/10 text-info border-l-info hover:border-l-2',
  };

  return (
    <Card 
      className={`shadow-md border-l-4 ${colorClasses[color].split(' ')[2]} transition-all duration-500 hover:shadow-2xl hover:scale-[1.05] hover:-translate-y-2 ${onClick ? 'cursor-pointer group' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1 group-hover:translate-x-1 transition-transform duration-300">
            <p className="text-sm font-medium text-muted-foreground/80">{title}</p>
            <p className="text-4xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">{value}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground/70">{subtitle}</p>
            )}
          </div>
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${colorClasses[color].split(' ').slice(0, 2).join(' ')} flex-shrink-0 ml-4 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 origin-center`}>
            <span className="group-hover:rotate-12 transition-transform duration-300">{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
    pendingLeaves: 0,
    pendingPayslips: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [employeesRes, attendanceRes, leavesRes, payslipsRes] = await Promise.all([
        employeesApi.getAll(),
        attendanceApi.getToday(),
        leavesApi.getAll(),
        payslipsApi.getAll(),
      ]);

      const employees = employeesRes.data || [];
      const attendance = attendanceRes.data || [];
      const leaves = leavesRes.data || [];
      const payslips = payslipsRes.data || [];

      setStats({
        totalEmployees: employees.length,
        activeEmployees: employees.filter(e => e.status === 'active').length,
        presentToday: attendance.filter(a => a.status === 'present' || a.status === 'late').length,
        lateToday: attendance.filter(a => a.status === 'late').length,
        absentToday: attendance.filter(a => a.status === 'absent').length,
        pendingLeaves: leaves.filter(l => l.status === 'pending').length,
        pendingPayslips: payslips.filter(p => p.status === 'pending').length,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const attendanceRate = stats.activeEmployees > 0
    ? Math.round((stats.presentToday / stats.activeEmployees) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="space-y-2">
          <h1 className="font-display text-5xl font-bold text-foreground leading-tight">
            Dashboard
          </h1>
          <p className="text-lg text-muted-foreground/80">
            Welcome back! Here's an overview of your HR operations
          </p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          subtitle={`${stats.activeEmployees} active`}
          icon={<Users className="h-7 w-7" />}
          color="primary"
          onClick={() => navigate('/employees')}
        />
        <StatCard
          title="Today's Attendance"
          value={`${attendanceRate}%`}
          subtitle={`${stats.presentToday} present today`}
          icon={<CalendarClock className="h-7 w-7" />}
          color="success"
          onClick={() => navigate('/attendance')}
        />
        <StatCard
          title="Pending Leaves"
          value={stats.pendingLeaves}
          subtitle="Awaiting approval"
          icon={<FileText className="h-7 w-7" />}
          color="warning"
          onClick={() => navigate('/leave-applications')}
        />
        <StatCard
          title="Pending Payslips"
          value={stats.pendingPayslips}
          subtitle="Ready for review"
          icon={<CreditCard className="h-7 w-7" />}
          color="info"
          onClick={() => navigate('/payslips')}
        />
      </div>

      {/* Quick Actions & Insights */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Overview */}
        <Card className="shadow-md border-0 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 h-full">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              Workforce Overview
            </CardTitle>
          </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-primary/8 to-primary/12 p-6 border border-primary/10 transition-all duration-300 hover:border-primary/30 hover:shadow-lg group/card cursor-pointer">
                <div className="group-hover/card:translate-x-1 transition-transform duration-300">
                  <p className="font-semibold text-foreground">Active Workforce</p>
                  <p className="text-sm text-muted-foreground">Currently employed staff</p>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-bold text-primary group-hover/card:scale-110 transition-transform duration-300 origin-right">{stats.activeEmployees}</span>
                  <p className="text-sm text-muted-foreground">employees</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border-2 border-success/30 bg-gradient-to-br from-success/8 to-success/5 p-5 text-center transition-all duration-300 hover:border-success/60 hover:shadow-lg hover:scale-105 group/stat cursor-pointer">
                  <p className="text-3xl font-bold text-success group-hover/stat:scale-110 transition-transform duration-300">{stats.presentToday}</p>
                  <p className="text-xs font-medium text-muted-foreground mt-1">Present Today</p>
                </div>
                <div className="rounded-2xl border-2 border-destructive/30 bg-gradient-to-br from-destructive/8 to-destructive/5 p-5 text-center transition-all duration-300 hover:border-destructive/60 hover:shadow-lg hover:scale-105 group/stat cursor-pointer">
                  <p className="text-3xl font-bold text-destructive group-hover/stat:scale-110 transition-transform duration-300">{stats.absentToday}</p>
                  <p className="text-xs font-medium text-muted-foreground mt-1">Absent Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

        {/* Pending Actions */}
        <Card className="shadow-md border-0 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 h-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 group-hover:bg-warning/20 transition-colors">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            Pending Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {/* Leave Applications */}
            <div className="flex items-center justify-between rounded-2xl border-2 border-warning/20 bg-gradient-to-r from-warning/6 to-warning/3 p-5 transition-all duration-300 hover:border-warning/40 hover:shadow-lg hover:scale-105 group/action cursor-pointer">
              <div className="flex items-center gap-4 flex-1 group-hover/action:translate-x-1 transition-transform duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20 flex-shrink-0">
                  <FileText className="h-6 w-6 text-warning" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">Leave Applications</p>
                  <p className="text-sm text-muted-foreground">Awaiting approval</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-2xl font-bold text-warning group-hover/action:scale-110 transition-transform duration-300">{stats.pendingLeaves}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all group-hover/action:translate-x-1 duration-300"
                  onClick={() => navigate('/leave-applications')}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Payslips */}
            <div className="flex items-center justify-between rounded-2xl border-2 border-info/20 bg-gradient-to-r from-info/6 to-info/3 p-5 transition-all duration-300 hover:border-info/40 hover:shadow-lg hover:scale-105 group/action cursor-pointer">
              <div className="flex items-center gap-4 flex-1 group-hover/action:translate-x-1 transition-transform duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/20 flex-shrink-0">
                  <CreditCard className="h-6 w-6 text-info" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">Payslips</p>
                  <p className="text-sm text-muted-foreground">Ready for review</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-2xl font-bold text-info group-hover/action:scale-110 transition-transform duration-300">{stats.pendingPayslips}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all group-hover/action:translate-x-1 duration-300"
                  onClick={() => navigate('/payslips')}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Late arrivals */}
            {stats.lateToday > 0 && (
              <div className="flex items-center justify-between rounded-2xl border-2 border-muted/40 bg-muted/20 p-5 transition-all duration-300 hover:border-muted/60 hover:shadow-md hover:scale-105 group/action cursor-pointer">
                <div className="flex items-center gap-4 flex-1 group-hover/action:translate-x-1 transition-transform duration-300">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted flex-shrink-0">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">Late Arrivals</p>
                    <p className="text-sm text-muted-foreground">Arrived late today</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-muted-foreground group-hover/action:scale-110 transition-transform duration-300">{stats.lateToday}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
