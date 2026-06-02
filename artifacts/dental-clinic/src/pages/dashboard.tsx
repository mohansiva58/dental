import { useGetDashboardStats, useGetRecentPatients, useGetTodayAppointments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Activity, Bell, DollarSign, CalendarCheck, UserCheck } from "lucide-react";
import { Link } from "wouter";

function StatCard({ title, value, icon: Icon, color, loading }: { title: string; value?: number | string; icon: any; color: string; loading: boolean }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">{value}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recentPatients, isLoading: patientsLoading } = useGetRecentPatients();
  const { data: todayAppts, isLoading: apptsLoading } = useGetTodayAppointments();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of clinic operations today</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Patients" value={stats?.totalPatients} icon={Users} color="bg-primary" loading={statsLoading} />
        <StatCard title="Today's Patients" value={stats?.todayPatients} icon={UserCheck} color="bg-teal-500" loading={statsLoading} />
        <StatCard title="Active Treatments" value={stats?.activeTreatments} icon={Activity} color="bg-blue-500" loading={statsLoading} />
        <StatCard title="Upcoming Follow-ups" value={stats?.upcomingFollowups} icon={Bell} color="bg-amber-500" loading={statsLoading} />
        <StatCard title="Active OPs" value={stats?.activeOps} icon={FileText} color="bg-indigo-500" loading={statsLoading} />
        <StatCard title="Pending Invoices" value={stats?.pendingInvoices} icon={CalendarCheck} color="bg-orange-500" loading={statsLoading} />
        <StatCard title="Total Revenue" value={stats ? `₹${Number(stats.totalRevenue).toLocaleString()}` : undefined} icon={DollarSign} color="bg-green-600" loading={statsLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Patients</CardTitle>
          </CardHeader>
          <CardContent>
            {patientsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : recentPatients && recentPatients.length > 0 ? (
              <div className="divide-y divide-border">
                {recentPatients.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <Link href={`/patients/${p.id}`} className="font-medium text-sm hover:text-primary transition-colors">{p.fullName}</Link>
                      <p className="text-xs text-muted-foreground">{p.patientId} · {p.gender} · {p.age}y</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{p.contactNumber}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No patients registered yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {apptsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : todayAppts && todayAppts.length > 0 ? (
              <div className="divide-y divide-border">
                {todayAppts.slice(0, 5).map((op) => (
                  <div key={op.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <Link href={`/op-records/${op.id}`} className="font-medium text-sm hover:text-primary transition-colors">{op.opNumber}</Link>
                      <p className="text-xs text-muted-foreground">{op.patientName} · {op.visitReason}</p>
                    </div>
                    <Badge variant={op.status === "active" ? "default" : "secondary"} className="text-xs capitalize">{op.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No appointments today</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
