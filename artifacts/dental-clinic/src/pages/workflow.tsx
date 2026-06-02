import { useState } from "react";
import { useLocation } from "wouter";
import { useListPatients, getListPatientsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus, FileText, Stethoscope, FlaskConical, Pill, Wrench,
  Receipt, CalendarCheck, CheckCircle2, ArrowDown, ArrowRight,
  Info, Users, ClipboardList, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

type Role = "receptionist" | "doctor" | "administrator" | "any";

type WorkflowStep = {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  role: Role;
  roleLabel: string;
  color: string;
  bg: string;
  border: string;
  href: string;
  actions: string[];
  output: string;
};

const STEPS: WorkflowStep[] = [
  {
    id: 1,
    title: "Patient Registration",
    subtitle: "Create patient record in the system",
    icon: UserPlus,
    role: "receptionist",
    roleLabel: "Receptionist / Doctor / Admin",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    href: "/patients/new",
    actions: [
      "Collect patient personal details (name, age, gender, blood group)",
      "Record contact info and emergency contact",
      "Note allergies and existing medical conditions",
      "Enter reason for visit",
    ],
    output: "Patient ID auto-generated (e.g. PT-0006)",
  },
  {
    id: 2,
    title: "OP Record Creation",
    subtitle: "Open outpatient file (valid 15 days)",
    icon: FileText,
    role: "receptionist",
    roleLabel: "Receptionist / Admin",
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    href: "/op-records",
    actions: [
      "System auto-creates OP if selected during registration",
      "Or manually open OP record from OP Records page",
      "OP number assigned (e.g. OP2026060001)",
      "Valid for 15 days — patient can visit within this window",
    ],
    output: "OP Number assigned, patient queued for doctor",
  },
  {
    id: 3,
    title: "Doctor Consultation",
    subtitle: "Doctor examines and records findings",
    icon: Stethoscope,
    role: "doctor",
    roleLabel: "Doctor",
    color: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-200",
    href: "/doctor-workspace",
    actions: [
      "Open Doctor Workspace — search patient by name or ID",
      "Review patient medical history and allergies",
      "Record clinical diagnosis notes",
      "Add prescriptions (medicine, dosage, instructions)",
    ],
    output: "Diagnosis notes + prescriptions saved to patient record",
  },
  {
    id: 4,
    title: "Treatment Planning",
    subtitle: "Plan and record dental procedures",
    icon: Wrench,
    role: "doctor",
    roleLabel: "Doctor / Admin",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    href: "/treatments",
    actions: [
      "Add treatment plan from Doctor Workspace",
      "Specify tooth number, procedure type, and estimated cost",
      "Set status: Planned → In Progress → Completed",
      "Multiple treatments can be tracked simultaneously",
    ],
    output: "Treatment items linked to patient, status tracked",
  },
  {
    id: 5,
    title: "Invoice & Billing",
    subtitle: "Generate bill and collect payment",
    icon: Receipt,
    role: "receptionist",
    roleLabel: "Receptionist / Admin",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    href: "/invoices",
    actions: [
      "Create invoice from Invoices page for the patient",
      "Add line items (consultations, treatments, medicines)",
      "Patient pays — mark as Paid (Cash / Card / UPI)",
      "Invoice PDF-ready with total and itemized breakdown",
    ],
    output: "Invoice number generated, payment status recorded",
  },
  {
    id: 6,
    title: "Follow-up Scheduling",
    subtitle: "Schedule next appointment",
    icon: CalendarCheck,
    role: "any",
    roleLabel: "Doctor / Receptionist",
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    href: "/followups",
    actions: [
      "Doctor recommends follow-up date from workspace",
      "Receptionist schedules it in the Follow-ups page",
      "System flags overdue follow-ups automatically",
      "Notifications alert staff when follow-ups are missed",
    ],
    output: "Follow-up date set, notifications triggered if overdue",
  },
  {
    id: 7,
    title: "Discharge / Completion",
    subtitle: "Close the treatment episode",
    icon: CheckCircle2,
    role: "any",
    roleLabel: "Any Staff",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    href: "/patients",
    actions: [
      "All treatments marked Completed",
      "Invoice marked Paid",
      "Follow-up completed or no further follow-up needed",
      "Patient record remains for future visits",
    ],
    output: "Episode closed — patient can return any time",
  },
];

const ROLE_COLORS: Record<string, string> = {
  receptionist: "bg-blue-100 text-blue-800",
  doctor: "bg-green-100 text-green-800",
  administrator: "bg-purple-100 text-purple-800",
  any: "bg-gray-100 text-gray-700",
};

function RoleChip({ label }: { label: string }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/70 border text-muted-foreground">
      {label}
    </span>
  );
}

function StepCard({ step, active, onClick }: { step: WorkflowStep; active: boolean; onClick: () => void }) {
  const Icon = step.icon;
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md",
        active ? `${step.border} ${step.bg} shadow-md` : "border-border bg-card hover:border-primary/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0", step.bg, step.border, "border")}>
          <Icon className={cn("h-5 w-5", step.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-muted-foreground">STEP {step.id}</span>
          </div>
          <p className="font-semibold text-sm leading-tight">{step.title}</p>
          <p className="text-xs text-muted-foreground">{step.subtitle}</p>
        </div>
        {active && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
      </div>
    </div>
  );
}

function DetailPanel({ step }: { step: WorkflowStep }) {
  const [, setLocation] = useLocation();
  const Icon = step.icon;

  return (
    <div className={cn("rounded-2xl border-2 p-6 h-full", step.border, step.bg)}>
      <div className="flex items-start gap-4 mb-5">
        <div className={cn("h-12 w-12 rounded-xl border-2 flex items-center justify-center flex-shrink-0 bg-white/70", step.border)}>
          <Icon className={cn("h-6 w-6", step.color)} />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge className="text-[10px] h-5" variant="secondary">Step {step.id} of {STEPS.length}</Badge>
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-white/70", step.color)}>
              {step.roleLabel}
            </span>
          </div>
          <h2 className={cn("text-xl font-bold", step.color)}>{step.title}</h2>
          <p className="text-sm text-muted-foreground">{step.subtitle}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">What happens at this step</p>
          <ul className="space-y-2">
            {step.actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className={cn("h-4 w-4 mt-0.5 flex-shrink-0", step.color)} />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={cn("rounded-lg p-3 bg-white/60 border", step.border)}>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Output / Result</p>
          <p className="text-sm font-medium">{step.output}</p>
        </div>

        <Button
          className={cn("w-full")}
          onClick={() => setLocation(step.href)}
        >
          Go to {step.title} <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function MiniFlow() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex flex-wrap items-center gap-1 justify-center">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={s.id} className="flex items-center gap-1">
            <button
              onClick={() => setLocation(s.href)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition hover:shadow-sm",
                s.bg, s.border, s.color
              )}
            >
              <Icon className="h-3 w-3" />
              {s.title}
            </button>
            {i < STEPS.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

export default function Workflow() {
  const [active, setActive] = useState(0);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: patients } = useListPatients({}, {
    query: { queryKey: getListPatientsQueryKey() }
  });

  const totalPatients = patients?.length ?? 0;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Patient Workflow
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Complete journey from registration to discharge — interactive guide for all staff roles</p>
        </div>
        <Button onClick={() => setLocation("/patients/new")}>
          <UserPlus className="h-4 w-4 mr-1" /> Register New Patient
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPatients}</p>
              <p className="text-xs text-muted-foreground">Total Patients Registered</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">7</p>
              <p className="text-xs text-muted-foreground">Steps in Patient Journey</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <Info className="h-5 w-5 text-violet-700" />
            </div>
            <div>
              <p className="text-sm font-semibold capitalize">{user?.role ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Your current role</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex items-center gap-2 min-w-max p-4 bg-muted/30 rounded-xl border">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <button
                  onClick={() => setActive(i)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all min-w-[88px]",
                    active === i ? `${s.border} ${s.bg}` : "border-transparent hover:border-border"
                  )}
                >
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", s.bg, s.border, "border")}>
                    <Icon className={cn("h-4 w-4", s.color)} />
                  </div>
                  <p className={cn("text-[10px] font-bold text-center leading-tight", active === i ? s.color : "text-muted-foreground")}>{s.title}</p>
                  <RoleChip label={`Step ${s.id}`} />
                </button>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">All Steps — click to explore</p>
          {STEPS.map((step, idx) => (
            <div key={step.id}>
              <StepCard step={step} active={active === idx} onClick={() => setActive(idx)} />
              {idx < STEPS.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="lg:col-span-3">
          <div className="sticky top-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-2">Step Details</p>
            <DetailPanel step={STEPS[active]} />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Role Guide</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                role: "Receptionist",
                color: "border-blue-200 bg-blue-50",
                textColor: "text-blue-800",
                tasks: ["Register patients", "Create OP records", "Schedule follow-ups", "Generate invoices"],
              },
              {
                role: "Doctor",
                color: "border-green-200 bg-green-50",
                textColor: "text-green-800",
                tasks: ["Use Doctor Workspace", "Record diagnosis", "Add prescriptions", "Plan treatments", "Recommend follow-ups"],
              },
              {
                role: "Administrator",
                color: "border-purple-200 bg-purple-50",
                textColor: "text-purple-800",
                tasks: ["All of the above", "View reports & charts", "Manage staff accounts", "Full system access"],
              },
            ].map((r) => (
              <div key={r.role} className={cn("rounded-lg border p-3", r.color)}>
                <p className={cn("font-semibold text-sm mb-2", r.textColor)}>{r.role}</p>
                <ul className="space-y-1">
                  {r.tasks.map((t) => (
                    <li key={t} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className={cn("h-3 w-3 mt-0.5 flex-shrink-0", r.textColor)} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
