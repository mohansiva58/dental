import { useState } from "react";
import { useLocation } from "wouter";
import {
  useCreatePatient, useCreateOpRecord,
  useListPatients, getListPatientsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
  User, Phone, Heart, ClipboardList, CheckCircle2,
  ChevronRight, ChevronLeft, ArrowRight, Stethoscope,
  AlertCircle, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Personal Info", icon: User, description: "Basic patient details" },
  { id: 2, label: "Contact", icon: Phone, description: "Phone, email & address" },
  { id: 3, label: "Medical", icon: Heart, description: "Health background" },
  { id: 4, label: "First Visit", icon: Stethoscope, description: "Reason & OP registration" },
  { id: 5, label: "Review", icon: CheckCircle2, description: "Confirm & register" },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const VISIT_REASONS = [
  "Tooth pain / Ache",
  "Routine check-up & cleaning",
  "Cavity / Filling",
  "Root canal treatment",
  "Tooth extraction",
  "Orthodontic consultation",
  "Gum disease / Gingivitis",
  "Broken / Chipped tooth",
  "Dental implant consultation",
  "Teeth whitening",
  "Crown / Bridge",
  "Child dental check",
  "Emergency",
  "Other",
];

type FormData = {
  fullName: string;
  age: string;
  gender: string;
  bloodGroup: string;
  contactNumber: string;
  email: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  allergies: string;
  existingConditions: string;
  currentMedications: string;
  visitReason: string;
  visitNotes: string;
  createOp: boolean;
};

const initial: FormData = {
  fullName: "", age: "", gender: "male", bloodGroup: "",
  contactNumber: "", email: "", address: "", emergencyContact: "", emergencyPhone: "",
  allergies: "", existingConditions: "", currentMedications: "",
  visitReason: "", visitNotes: "", createOp: true,
};

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const done = step.id < current;
        const active = step.id === current;
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all",
                done && "bg-primary border-primary text-primary-foreground",
                active && "bg-primary/10 border-primary text-primary",
                !done && !active && "bg-muted border-border text-muted-foreground"
              )}>
                {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <div className="text-center hidden sm:block">
                <p className={cn("text-xs font-medium leading-tight", active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground")}>{step.label}</p>
                <p className="text-[10px] text-muted-foreground">{step.description}</p>
              </div>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={cn("h-0.5 w-10 sm:w-16 mx-1 mt-[-18px] sm:mt-[-22px] transition-colors", done ? "bg-primary" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; color: string }> = {
    receptionist: { label: "Receptionist", color: "bg-blue-50 text-blue-700 border-blue-200" },
    doctor: { label: "Doctor", color: "bg-green-50 text-green-700 border-green-200" },
    administrator: { label: "Administrator", color: "bg-purple-50 text-purple-700 border-purple-200" },
  };
  const info = map[role] ?? { label: role, color: "bg-gray-50 text-gray-700 border-gray-200" };
  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded border", info.color)}>
      {info.label}
    </span>
  );
}

function Step1({ data, set }: { data: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700">Fields marked <span className="font-bold">*</span> are required. A unique Patient ID will be auto-generated upon registration.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <Label>Full Name <span className="text-destructive">*</span></Label>
          <Input
            placeholder="e.g. Ramesh Kumar"
            value={data.fullName}
            onChange={(e) => set("fullName", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Age <span className="text-destructive">*</span></Label>
          <Input
            type="number"
            placeholder="Years"
            min={1}
            max={120}
            value={data.age}
            onChange={(e) => set("age", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Gender <span className="text-destructive">*</span></Label>
          <Select value={data.gender} onValueChange={(v) => set("gender", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Blood Group</Label>
          <Select value={data.bloodGroup || "unknown"} onValueChange={(v) => set("bloodGroup", v === "unknown" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unknown">Not known</SelectItem>
              {BLOOD_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function Step2({ data, set }: { data: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Mobile Number <span className="text-destructive">*</span></Label>
          <Input
            placeholder="10-digit mobile"
            value={data.contactNumber}
            onChange={(e) => set("contactNumber", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Email Address</Label>
          <Input
            type="email"
            placeholder="patient@email.com"
            value={data.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label>Residential Address</Label>
          <Textarea
            placeholder="House no., Street, City, PIN..."
            rows={2}
            value={data.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Emergency Contact Name</Label>
          <Input
            placeholder="Relative or guardian name"
            value={data.emergencyContact}
            onChange={(e) => set("emergencyContact", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Emergency Contact Phone</Label>
          <Input
            placeholder="Mobile number"
            value={data.emergencyPhone}
            onChange={(e) => set("emergencyPhone", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function Step3({ data, set }: { data: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
        <Heart className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-700">This medical background helps doctors make informed treatment decisions. Leave blank if unknown.</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Known Allergies</Label>
          <Textarea
            placeholder="e.g. Penicillin, Latex, NSAIDs... or 'None known'"
            rows={2}
            value={data.allergies}
            onChange={(e) => set("allergies", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Existing Medical Conditions</Label>
          <Textarea
            placeholder="e.g. Diabetes (Type 2), Hypertension, Heart disease..."
            rows={2}
            value={data.existingConditions}
            onChange={(e) => set("existingConditions", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Current Medications</Label>
          <Textarea
            placeholder="e.g. Metformin 500mg, Amlodipine 5mg..."
            rows={2}
            value={data.currentMedications}
            onChange={(e) => set("currentMedications", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function Step4({ data, set }: { data: FormData; set: (k: keyof FormData, v: string | boolean) => void }) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label>Reason for Visit <span className="text-destructive">*</span></Label>
        <Select value={data.visitReason} onValueChange={(v) => set("visitReason", v)}>
          <SelectTrigger><SelectValue placeholder="Select primary reason..." /></SelectTrigger>
          <SelectContent>
            {VISIT_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Additional Notes</Label>
        <Textarea
          placeholder="Extra details about the complaint, symptoms, or duration..."
          rows={3}
          value={data.visitNotes}
          onChange={(e) => set("visitNotes", e.target.value as string)}
        />
      </div>
      <div className={cn(
        "rounded-lg border-2 p-4 cursor-pointer transition-all",
        data.createOp ? "border-primary bg-primary/5" : "border-border bg-muted/30"
      )} onClick={() => set("createOp", !data.createOp)}>
        <div className="flex items-start gap-3">
          <div className={cn("h-5 w-5 rounded border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors",
            data.createOp ? "bg-primary border-primary" : "border-border"
          )}>
            {data.createOp && <CheckCircle2 className="h-3 w-3 text-white" />}
          </div>
          <div>
            <p className="font-medium text-sm">Also create OP Record (Recommended)</p>
            <p className="text-xs text-muted-foreground mt-0.5">Generates an outpatient number valid for 15 days. Required for the doctor to record diagnosis and prescriptions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-3 py-1.5 border-b border-dashed last:border-0">
      <span className="text-sm text-muted-foreground w-36 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium">{value || <span className="text-muted-foreground italic">Not provided</span>}</span>
    </div>
  );
}

function Step5({ data, role }: { data: FormData; role: string }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Registering as</span>
        <RoleBadge role={role} />
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Personal</p>
        <ReviewRow label="Full Name" value={data.fullName} />
        <ReviewRow label="Age" value={data.age ? `${data.age} years` : ""} />
        <ReviewRow label="Gender" value={data.gender} />
        <ReviewRow label="Blood Group" value={data.bloodGroup} />
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Contact</p>
        <ReviewRow label="Mobile" value={data.contactNumber} />
        <ReviewRow label="Email" value={data.email} />
        <ReviewRow label="Address" value={data.address} />
        <ReviewRow label="Emergency Contact" value={data.emergencyContact ? `${data.emergencyContact} (${data.emergencyPhone})` : ""} />
      </div>

      {(data.allergies || data.existingConditions || data.currentMedications) && (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Medical Background</p>
          <ReviewRow label="Allergies" value={data.allergies} />
          <ReviewRow label="Conditions" value={data.existingConditions} />
          <ReviewRow label="Medications" value={data.currentMedications} />
        </div>
      )}

      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">First Visit</p>
        <ReviewRow label="Reason" value={data.visitReason} />
        <ReviewRow label="Notes" value={data.visitNotes} />
        <ReviewRow label="OP Record" value={data.createOp ? "Yes — will be created automatically" : "No"} />
      </div>
    </div>
  );
}

export default function AddPatient() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initial);
  const [done, setDone] = useState<{ patientId: string; patientDbId: number; opNumber?: string } | null>(null);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createPatient = useCreatePatient();
  const createOp = useCreateOpRecord();

  const set = (k: keyof FormData, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const canNext = () => {
    if (step === 1) return !!form.fullName.trim() && !!form.age && !!form.gender;
    if (step === 2) return !!form.contactNumber.trim();
    if (step === 4) return !!form.visitReason;
    return true;
  };

  const handleSubmit = async () => {
    try {
      const patient = await createPatient.mutateAsync({
        data: {
          fullName: form.fullName,
          age: parseInt(form.age),
          gender: form.gender as "male" | "female" | "other",
          contactNumber: form.contactNumber,
          email: form.email || undefined,
          address: form.address || undefined,
          emergencyContact: form.emergencyContact || undefined,
          emergencyPhone: form.emergencyPhone || undefined,
          bloodGroup: form.bloodGroup || undefined,
        },
      });

      let opNumber: string | undefined;

      if (form.createOp) {
        const op = await createOp.mutateAsync({
          data: {
            patientId: patient.id,
            visitReason: form.visitReason + (form.visitNotes ? `. ${form.visitNotes}` : ""),
          },
        });
        opNumber = op.opNumber;
      }

      queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
      setDone({ patientId: patient.patientId, patientDbId: patient.id, opNumber });
    } catch {
      toast({ title: "Registration failed. Please try again.", variant: "destructive" });
    }
  };

  if (done) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="text-center space-y-5 py-8">
          <div className="h-20 w-20 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Patient Registered!</h2>
            <p className="text-muted-foreground mt-1">The patient has been successfully added to DentalSync.</p>
          </div>
          <div className="bg-muted/40 rounded-xl border p-4 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Patient ID</span>
              <span className="font-mono font-bold text-primary">{done.patientId}</span>
            </div>
            {done.opNumber && (
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm text-muted-foreground">OP Number</span>
                <span className="font-mono font-bold text-green-700">{done.opNumber}</span>
              </div>
            )}
          </div>
          {done.opNumber && (
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100 text-left">
              <Stethoscope className="h-4 w-4 text-green-700 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-800">
                OP Record created — valid for <strong>15 days</strong>. The doctor can now open the Doctor Workspace, find this patient, and record diagnosis, prescriptions & treatments.
              </p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => { setDone(null); setForm(initial); setStep(1); }}>
              Register Another Patient
            </Button>
            <Button onClick={() => setLocation(`/patients/${done.patientDbId}`)}>
              View Patient Record <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <Button variant="ghost" className="text-muted-foreground" onClick={() => setLocation("/workflow")}>
            <FileText className="h-4 w-4 mr-1" /> View Patient Workflow →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span
            className="hover:text-primary cursor-pointer"
            onClick={() => setLocation("/patients")}
          >Patients</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">Register New Patient</span>
          {user && <span className="ml-auto"><RoleBadge role={user.role} /></span>}
        </div>
        <h1 className="text-2xl font-bold">Register New Patient</h1>
      </div>

      <div className="mb-8 overflow-x-auto pb-2">
        <StepIndicator current={step} total={STEPS.length} />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              {(() => { const S = STEPS[step - 1]; const Icon = S.icon; return <Icon className="h-5 w-5 text-primary" />; })()}
              {STEPS[step - 1].label}
            </h2>
            <p className="text-sm text-muted-foreground">{STEPS[step - 1].description}</p>
          </div>

          {step === 1 && <Step1 data={form} set={set as (k: keyof FormData, v: string) => void} />}
          {step === 2 && <Step2 data={form} set={set as (k: keyof FormData, v: string) => void} />}
          {step === 3 && <Step3 data={form} set={set as (k: keyof FormData, v: string) => void} />}
          {step === 4 && <Step4 data={form} set={set} />}
          {step === 5 && <Step5 data={form} role={user?.role ?? "receptionist"} />}

          <div className="flex items-center justify-between mt-8 pt-5 border-t">
            <Button
              variant="outline"
              onClick={() => step > 1 ? setStep(s => s - 1) : setLocation("/patients")}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {step === 1 ? "Cancel" : "Back"}
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Step {step} of {STEPS.length}</span>
              {step < 5 ? (
                <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={createPatient.isPending || createOp.isPending}
                >
                  {createPatient.isPending || createOp.isPending ? "Registering..." : "Register Patient"}
                  <CheckCircle2 className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
