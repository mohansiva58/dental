import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/layout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import PatientDetail from "@/pages/patient-detail";
import OpRecords from "@/pages/op-records";
import OpRecordDetail from "@/pages/op-record-detail";
import DoctorWorkspace from "@/pages/doctor-workspace";
import Treatments from "@/pages/treatments";
import Invoices from "@/pages/invoices";
import InvoiceDetail from "@/pages/invoice-detail";
import FollowUps from "@/pages/followups";
import Reports from "@/pages/reports";
import Notifications from "@/pages/notifications";
import AdminUsers from "@/pages/admin-users";
import AddPatient from "@/pages/add-patient";
import Workflow from "@/pages/workflow";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function ProtectedRoute({ component: Component, roles }: { component: React.ComponentType; roles?: string[] }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Loading...</p>
      </div>
    </div>
  );
  if (!user) return <Redirect to="/login" />;
  if (roles && !roles.includes(user.role)) return <Redirect to="/dashboard" />;
  return <AppLayout><Component /></AppLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/patients" component={() => <ProtectedRoute component={Patients} />} />
      <Route path="/patients/new" component={() => <ProtectedRoute component={AddPatient} />} />
      <Route path="/patients/:id" component={() => <ProtectedRoute component={PatientDetail} />} />
      <Route path="/workflow" component={() => <ProtectedRoute component={Workflow} />} />
      <Route path="/op-records" component={() => <ProtectedRoute component={OpRecords} />} />
      <Route path="/op-records/:id" component={() => <ProtectedRoute component={OpRecordDetail} />} />
      <Route path="/doctor-workspace" component={() => <ProtectedRoute component={DoctorWorkspace} />} />
      <Route path="/treatments" component={() => <ProtectedRoute component={Treatments} />} />
      <Route path="/invoices" component={() => <ProtectedRoute component={Invoices} />} />
      <Route path="/invoices/:id" component={() => <ProtectedRoute component={InvoiceDetail} />} />
      <Route path="/followups" component={() => <ProtectedRoute component={FollowUps} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={Reports} roles={["administrator"]} />} />
      <Route path="/notifications" component={() => <ProtectedRoute component={Notifications} />} />
      <Route path="/admin/users" component={() => <ProtectedRoute component={AdminUsers} roles={["administrator"]} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
