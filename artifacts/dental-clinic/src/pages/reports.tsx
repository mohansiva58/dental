import { useState } from "react";
import { useGetDailyReport, useGetMonthlyReport } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function Reports() {
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(thisMonth);

  const { data: daily, isLoading: dailyLoading } = useGetDailyReport(
    { date: selectedDate },
    { query: { queryKey: ["daily-report", selectedDate] } }
  );

  const { data: monthly, isLoading: monthlyLoading } = useGetMonthlyReport(
    { month: selectedMonth },
    { query: { queryKey: ["monthly-report", selectedMonth] } }
  );

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground text-sm">Daily and monthly operational reports</p>
      </div>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <Label>Date:</Label>
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-44" />
          </div>
          {dailyLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}</div>
          ) : daily ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "New Patients", value: daily.newPatients },
                  { label: "Total Visits", value: daily.totalVisits },
                  { label: "Completed Treatments", value: daily.completedTreatments },
                  { label: "Total Revenue", value: `₹${Number(daily.totalRevenue).toLocaleString()}` },
                ].map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="pt-5">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No data for this date</p>
          )}
        </TabsContent>

        <TabsContent value="monthly" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <Label>Month:</Label>
            <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-44" />
          </div>
          {monthlyLoading ? (
            <div className="space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>
          ) : monthly ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: "Total Patients", value: monthly.totalPatients },
                  { label: "Total Visits", value: monthly.totalVisits },
                  { label: "Total Revenue", value: `₹${Number(monthly.totalRevenue).toLocaleString()}` },
                ].map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="pt-5">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {monthly.dailyStats && monthly.dailyStats.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Daily Visits</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={monthly.dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(8)} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {monthly.dailyStats && monthly.dailyStats.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Daily Revenue (₹)</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={monthly.dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(8)} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, "Revenue"]} />
                        <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {monthly.treatmentBreakdown && monthly.treatmentBreakdown.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Treatment Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={monthly.treatmentBreakdown} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="procedure" type="category" width={120} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 3, 3, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No data for this month</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
