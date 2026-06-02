import { useState } from "react";
import { useListPatients, useListDiagnoses, useListPrescriptions, useListTreatments, useCreateDiagnosis, useCreatePrescription, useCreateTreatment, useCreateFollowup, getListPatientsQueryKey, getListDiagnosesQueryKey, getListPrescriptionsQueryKey, getListTreatmentsQueryKey, getListFollowupsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function DoctorWorkspace() {
  const [search, setSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: patients, isLoading: searchLoading } = useListPatients(
    search ? { search } : {},
    { query: { queryKey: getListPatientsQueryKey(search ? { search } : {}) } }
  );
  const { data: diagnoses } = useListDiagnoses(
    selectedPatientId ? { patientId: selectedPatientId } : {},
    { query: { enabled: !!selectedPatientId, queryKey: getListDiagnosesQueryKey({ patientId: selectedPatientId ?? 0 }) } }
  );
  const { data: prescriptions } = useListPrescriptions(
    selectedPatientId ? { patientId: selectedPatientId } : {},
    { query: { enabled: !!selectedPatientId, queryKey: getListPrescriptionsQueryKey({ patientId: selectedPatientId ?? 0 }) } }
  );
  const { data: treatments } = useListTreatments(
    selectedPatientId ? { patientId: selectedPatientId } : {},
    { query: { enabled: !!selectedPatientId, queryKey: getListTreatmentsQueryKey({ patientId: selectedPatientId ?? 0 }) } }
  );

  const createDiag = useCreateDiagnosis();
  const createRx = useCreatePrescription();
  const createTreat = useCreateTreatment();
  const createFu = useCreateFollowup();

  const [diagNotes, setDiagNotes] = useState("");
  const [rxForm, setRxForm] = useState({ medicineName: "", dosage: "", instructions: "" });
  const [treatForm, setTreatForm] = useState({ procedure: "", toothNumber: "", status: "planned", cost: "" });
  const [fuDate, setFuDate] = useState("");
  const [fuNotes, setFuNotes] = useState("");

  const selectedPatient = patients?.find((p) => p.id === selectedPatientId);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Stethoscope className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Doctor Workspace</h1>
          <p className="text-muted-foreground text-sm">Search patients and manage clinical records</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-sm">Patient Search</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Name, ID, or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {searchLoading && <Skeleton className="h-10 w-full" />}
              {patients?.map((p) => (
                <button
                  key={p.id}
                  className={`w-full text-left p-2.5 rounded-md text-sm transition-colors ${selectedPatientId === p.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  onClick={() => setSelectedPatientId(p.id)}
                  data-testid={`button-select-patient-${p.id}`}
                >
                  <p className="font-medium">{p.fullName}</p>
                  <p className={`text-xs ${selectedPatientId === p.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{p.patientId} · {p.age}y</p>
                </button>
              ))}
              {!searchLoading && patients?.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No patients found</p>}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {selectedPatient ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-bold">{selectedPatient.fullName}</p>
                    <p className="text-sm text-muted-foreground">{selectedPatient.patientId} · {selectedPatient.age}y · <span className="capitalize">{selectedPatient.gender}</span></p>
                    {selectedPatient.contactNumber && <p className="text-sm">{selectedPatient.contactNumber}</p>}
                  </div>
                  <Link href={`/patients/${selectedPatient.id}`}>
                    <Button variant="outline" size="sm">Full Profile</Button>
                  </Link>
                </CardContent>
              </Card>

              <Tabs defaultValue="diagnosis">
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
                  <TabsTrigger value="prescription">Prescription</TabsTrigger>
                  <TabsTrigger value="treatment">Treatment</TabsTrigger>
                  <TabsTrigger value="followup">Follow-up</TabsTrigger>
                </TabsList>

                <TabsContent value="diagnosis" className="mt-3 space-y-3">
                  <form onSubmit={(e) => { e.preventDefault(); createDiag.mutate({ data: { patientId: selectedPatientId!, notes: diagNotes } }, { onSuccess: () => { toast({ title: "Diagnosis saved" }); setDiagNotes(""); queryClient.invalidateQueries({ queryKey: getListDiagnosesQueryKey({ patientId: selectedPatientId! }) }); }, onError: () => toast({ title: "Failed", variant: "destructive" }) }); }} className="space-y-2">
                    <Textarea placeholder="Enter diagnosis notes..." value={diagNotes} onChange={(e) => setDiagNotes(e.target.value)} rows={3} required />
                    <Button type="submit" size="sm" disabled={createDiag.isPending}>Save Diagnosis</Button>
                  </form>
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {diagnoses?.map((d) => <div key={d.id} className="p-2.5 bg-muted/30 rounded text-xs"><p>{d.notes}</p><p className="text-muted-foreground mt-0.5">{new Date(d.createdAt).toLocaleDateString()}</p></div>)}
                  </div>
                </TabsContent>

                <TabsContent value="prescription" className="mt-3 space-y-3">
                  <form onSubmit={(e) => { e.preventDefault(); createRx.mutate({ data: { patientId: selectedPatientId!, medicineName: rxForm.medicineName, dosage: rxForm.dosage, instructions: rxForm.instructions || undefined } }, { onSuccess: () => { toast({ title: "Prescription saved" }); setRxForm({ medicineName: "", dosage: "", instructions: "" }); queryClient.invalidateQueries({ queryKey: getListPrescriptionsQueryKey({ patientId: selectedPatientId! }) }); }, onError: () => toast({ title: "Failed", variant: "destructive" }) }); }} className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label className="text-xs">Medicine *</Label><Input value={rxForm.medicineName} onChange={(e) => setRxForm(f => ({ ...f, medicineName: e.target.value }))} required /></div>
                      <div><Label className="text-xs">Dosage *</Label><Input value={rxForm.dosage} onChange={(e) => setRxForm(f => ({ ...f, dosage: e.target.value }))} placeholder="500mg" required /></div>
                      <div className="col-span-2"><Label className="text-xs">Instructions</Label><Input value={rxForm.instructions} onChange={(e) => setRxForm(f => ({ ...f, instructions: e.target.value }))} placeholder="After meals, 3x daily" /></div>
                    </div>
                    <Button type="submit" size="sm" disabled={createRx.isPending}>Add Prescription</Button>
                  </form>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {prescriptions?.map((rx) => <div key={rx.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded text-xs"><span className="font-medium">{rx.medicineName}</span><Badge variant="outline" className="text-xs">{rx.dosage}</Badge></div>)}
                  </div>
                </TabsContent>

                <TabsContent value="treatment" className="mt-3 space-y-3">
                  <form onSubmit={(e) => { e.preventDefault(); createTreat.mutate({ data: { patientId: selectedPatientId!, procedure: treatForm.procedure, toothNumber: treatForm.toothNumber || undefined, status: treatForm.status as any, cost: treatForm.cost ? parseFloat(treatForm.cost) : undefined } }, { onSuccess: () => { toast({ title: "Treatment added" }); setTreatForm({ procedure: "", toothNumber: "", status: "planned", cost: "" }); queryClient.invalidateQueries({ queryKey: getListTreatmentsQueryKey({ patientId: selectedPatientId! }) }); }, onError: () => toast({ title: "Failed", variant: "destructive" }) }); }} className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2"><Label className="text-xs">Procedure *</Label><Input value={treatForm.procedure} onChange={(e) => setTreatForm(f => ({ ...f, procedure: e.target.value }))} required /></div>
                      <div><Label className="text-xs">Tooth #</Label><Input value={treatForm.toothNumber} onChange={(e) => setTreatForm(f => ({ ...f, toothNumber: e.target.value }))} placeholder="e.g. 11" /></div>
                      <div><Label className="text-xs">Cost (₹)</Label><Input type="number" value={treatForm.cost} onChange={(e) => setTreatForm(f => ({ ...f, cost: e.target.value }))} /></div>
                      <div className="col-span-2">
                        <Label className="text-xs">Status</Label>
                        <Select value={treatForm.status} onValueChange={(v) => setTreatForm(f => ({ ...f, status: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="planned">Planned</SelectItem><SelectItem value="in-progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" size="sm" disabled={createTreat.isPending}>Add Treatment</Button>
                  </form>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {treatments?.map((t) => <div key={t.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded text-xs"><span>{t.procedure}{t.toothNumber ? ` (Tooth ${t.toothNumber})` : ""}</span><Badge variant="secondary" className="capitalize text-xs">{t.status}</Badge></div>)}
                  </div>
                </TabsContent>

                <TabsContent value="followup" className="mt-3 space-y-3">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    createFu.mutate(
                      { data: { patientId: selectedPatientId!, scheduledDate: fuDate, notes: fuNotes || undefined } },
                      {
                        onSuccess: () => {
                          toast({ title: "Follow-up scheduled" });
                          setFuDate("");
                          setFuNotes("");
                          queryClient.invalidateQueries({ queryKey: getListFollowupsQueryKey({ patientId: selectedPatientId! }) });
                        },
                        onError: () => toast({ title: "Failed", variant: "destructive" }),
                      }
                    );
                  }} className="space-y-2">
                    <div><Label className="text-xs">Scheduled Date *</Label><Input type="date" value={fuDate} onChange={(e) => setFuDate(e.target.value)} required /></div>
                    <div><Label className="text-xs">Notes</Label><Input value={fuNotes} onChange={(e) => setFuNotes(e.target.value)} placeholder="Reason for follow-up..." /></div>
                    <Button type="submit" size="sm" disabled={createFu.isPending || !fuDate}>Schedule Follow-up</Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center py-20 text-muted-foreground">
              <div className="text-center">
                <Stethoscope className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>Search and select a patient to begin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
