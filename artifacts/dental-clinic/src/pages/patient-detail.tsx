import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetPatient, useListOpRecords, useListTreatments, useListDiagnoses,
  useListPrescriptions, useListFollowups, useListInvoices,
  useCreateOpRecord, useCreateDiagnosis, useCreatePrescription, useCreateTreatment, useCreateFollowup,
  getGetPatientQueryKey, getListOpRecordsQueryKey, getListTreatmentsQueryKey,
  getListDiagnosesQueryKey, getListPrescriptionsQueryKey, getListFollowupsQueryKey, getListInvoicesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const patientId = parseInt(id!);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: patient, isLoading } = useGetPatient(patientId, { query: { enabled: !!patientId, queryKey: getGetPatientQueryKey(patientId) } });
  const { data: opRecords } = useListOpRecords({ patientId }, { query: { queryKey: getListOpRecordsQueryKey({ patientId }) } });
  const { data: treatments } = useListTreatments({ patientId }, { query: { queryKey: getListTreatmentsQueryKey({ patientId }) } });
  const { data: diagnoses } = useListDiagnoses({ patientId }, { query: { queryKey: getListDiagnosesQueryKey({ patientId }) } });
  const { data: prescriptions } = useListPrescriptions({ patientId }, { query: { queryKey: getListPrescriptionsQueryKey({ patientId }) } });
  const { data: followups } = useListFollowups({ patientId }, { query: { queryKey: getListFollowupsQueryKey({ patientId }) } });
  const { data: invoices } = useListInvoices({ patientId }, { query: { queryKey: getListInvoicesQueryKey({ patientId }) } });

  const createOp = useCreateOpRecord();
  const [opForm, setOpForm] = useState({ visitReason: "" });
  const [opOpen, setOpOpen] = useState(false);

  const createDiag = useCreateDiagnosis();
  const [diagForm, setDiagForm] = useState({ notes: "" });
  const [diagOpen, setDiagOpen] = useState(false);

  const createRx = useCreatePrescription();
  const [rxForm, setRxForm] = useState({ medicineName: "", dosage: "", instructions: "", recommendations: "" });
  const [rxOpen, setRxOpen] = useState(false);

  const createTreat = useCreateTreatment();
  const [treatForm, setTreatForm] = useState({ toothNumber: "", procedure: "", status: "planned", cost: "" });
  const [treatOpen, setTreatOpen] = useState(false);

  const createFu = useCreateFollowup();
  const [fuForm, setFuForm] = useState({ scheduledDate: "", notes: "" });
  const [fuOpen, setFuOpen] = useState(false);

  if (isLoading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-32 w-full" />
    </div>
  );

  if (!patient) return <div className="p-6 text-muted-foreground">Patient not found</div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/patients"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
        <div>
          <h1 className="text-xl font-bold">{patient.fullName}</h1>
          <p className="text-sm text-muted-foreground font-mono">{patient.patientId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle className="text-sm">Demographics</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Age</span><span>{patient.age}y</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span className="capitalize">{patient.gender}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Contact</span><span>{patient.contactNumber}</span></div>
            {patient.email && <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="truncate ml-2">{patient.email}</span></div>}
            {patient.bloodGroup && <div className="flex justify-between"><span className="text-muted-foreground">Blood Group</span><Badge variant="outline">{patient.bloodGroup}</Badge></div>}
            {patient.address && <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="text-right ml-2">{patient.address}</span></div>}
            {patient.emergencyContact && <div className="border-t pt-2 mt-2"><p className="text-muted-foreground text-xs mb-1">Emergency</p><p>{patient.emergencyContact} · {patient.emergencyPhone}</p></div>}
            <div className="flex justify-between pt-1"><span className="text-muted-foreground">Status</span><Badge variant={patient.status === "active" ? "default" : "secondary"} className="capitalize text-xs">{patient.status}</Badge></div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <Tabs defaultValue="op">
            <TabsList className="w-full grid grid-cols-6 text-xs">
              <TabsTrigger value="op">OPs ({opRecords?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="treatments">Treatments ({treatments?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="diagnoses">Diagnoses ({diagnoses?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="prescriptions">Rx ({prescriptions?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="followups">Follow-ups ({followups?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="invoices">Invoices ({invoices?.length ?? 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="op" className="mt-3">
              <div className="flex justify-end mb-3">
                <Dialog open={opOpen} onOpenChange={setOpOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" />New OP</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Create OP Record</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); createOp.mutate({ data: { patientId, visitReason: opForm.visitReason } }, { onSuccess: () => { toast({ title: "OP created" }); setOpOpen(false); queryClient.invalidateQueries({ queryKey: getListOpRecordsQueryKey({ patientId }) }); }, onError: () => toast({ title: "Failed", variant: "destructive" }) }); }} className="space-y-3 mt-2">
                      <div className="space-y-1"><Label>Visit Reason *</Label><Input value={opForm.visitReason} onChange={(e) => setOpForm({ visitReason: e.target.value })} required /></div>
                      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpOpen(false)}>Cancel</Button><Button type="submit" disabled={createOp.isPending}>Create</Button></div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-2">
                {opRecords?.map((op) => (
                  <div key={op.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                    <div>
                      <Link href={`/op-records/${op.id}`} className="font-medium text-primary hover:underline">{op.opNumber}</Link>
                      <p className="text-xs text-muted-foreground">{op.visitReason} · {new Date(op.startDate).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={op.status === "active" ? "default" : "secondary"} className="capitalize text-xs">{op.status}</Badge>
                  </div>
                ))}
                {!opRecords?.length && <p className="text-sm text-muted-foreground text-center py-4">No OP records</p>}
              </div>
            </TabsContent>

            <TabsContent value="treatments" className="mt-3">
              <div className="flex justify-end mb-3">
                <Dialog open={treatOpen} onOpenChange={setTreatOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" />Add Treatment</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Treatment</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); createTreat.mutate({ data: { patientId, toothNumber: treatForm.toothNumber || undefined, procedure: treatForm.procedure, status: treatForm.status as any, cost: treatForm.cost ? parseFloat(treatForm.cost) : undefined } }, { onSuccess: () => { toast({ title: "Treatment added" }); setTreatOpen(false); queryClient.invalidateQueries({ queryKey: getListTreatmentsQueryKey({ patientId }) }); }, onError: () => toast({ title: "Failed", variant: "destructive" }) }); }} className="space-y-3 mt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label>Tooth Number</Label><Input value={treatForm.toothNumber} onChange={(e) => setTreatForm(f => ({ ...f, toothNumber: e.target.value }))} placeholder="e.g. 11, 21" /></div>
                        <div className="space-y-1"><Label>Cost (₹)</Label><Input type="number" value={treatForm.cost} onChange={(e) => setTreatForm(f => ({ ...f, cost: e.target.value }))} /></div>
                        <div className="col-span-2 space-y-1"><Label>Procedure *</Label><Input value={treatForm.procedure} onChange={(e) => setTreatForm(f => ({ ...f, procedure: e.target.value }))} required /></div>
                        <div className="col-span-2 space-y-1"><Label>Status</Label>
                          <Select value={treatForm.status} onValueChange={(v) => setTreatForm(f => ({ ...f, status: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="planned">Planned</SelectItem><SelectItem value="in-progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setTreatOpen(false)}>Cancel</Button><Button type="submit" disabled={createTreat.isPending}>Add</Button></div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-2">
                {treatments?.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg text-sm" data-testid={`card-treatment-${t.id}`}>
                    <div>
                      <p className="font-medium">{t.procedure}</p>
                      <p className="text-xs text-muted-foreground">{t.toothNumber ? `Tooth ${t.toothNumber}` : "General"}{t.cost ? ` · ₹${t.cost}` : ""}</p>
                    </div>
                    <Badge variant={t.status === "completed" ? "default" : t.status === "cancelled" ? "destructive" : "secondary"} className="capitalize text-xs">{t.status}</Badge>
                  </div>
                ))}
                {!treatments?.length && <p className="text-sm text-muted-foreground text-center py-4">No treatments recorded</p>}
              </div>
            </TabsContent>

            <TabsContent value="diagnoses" className="mt-3">
              <div className="flex justify-end mb-3">
                <Dialog open={diagOpen} onOpenChange={setDiagOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" />Add Diagnosis</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Diagnosis</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); createDiag.mutate({ data: { patientId, notes: diagForm.notes } }, { onSuccess: () => { toast({ title: "Diagnosis added" }); setDiagOpen(false); queryClient.invalidateQueries({ queryKey: getListDiagnosesQueryKey({ patientId }) }); }, onError: () => toast({ title: "Failed", variant: "destructive" }) }); }} className="space-y-3 mt-2">
                      <div className="space-y-1"><Label>Diagnosis Notes *</Label><Textarea value={diagForm.notes} onChange={(e) => setDiagForm({ notes: e.target.value })} rows={4} required /></div>
                      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDiagOpen(false)}>Cancel</Button><Button type="submit" disabled={createDiag.isPending}>Add</Button></div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-2">
                {diagnoses?.map((d) => (
                  <div key={d.id} className="p-3 border rounded-lg text-sm" data-testid={`card-diagnosis-${d.id}`}>
                    <p className="whitespace-pre-wrap">{d.notes}</p>
                    <p className="text-xs text-muted-foreground mt-1">{d.createdByName || "System"} · {new Date(d.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
                {!diagnoses?.length && <p className="text-sm text-muted-foreground text-center py-4">No diagnoses recorded</p>}
              </div>
            </TabsContent>

            <TabsContent value="prescriptions" className="mt-3">
              <div className="flex justify-end mb-3">
                <Dialog open={rxOpen} onOpenChange={setRxOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" />Add Prescription</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Prescription</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); createRx.mutate({ data: { patientId, medicineName: rxForm.medicineName, dosage: rxForm.dosage, instructions: rxForm.instructions || undefined, recommendations: rxForm.recommendations || undefined } }, { onSuccess: () => { toast({ title: "Prescription added" }); setRxOpen(false); queryClient.invalidateQueries({ queryKey: getListPrescriptionsQueryKey({ patientId }) }); }, onError: () => toast({ title: "Failed", variant: "destructive" }) }); }} className="space-y-3 mt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label>Medicine Name *</Label><Input value={rxForm.medicineName} onChange={(e) => setRxForm(f => ({ ...f, medicineName: e.target.value }))} required /></div>
                        <div className="space-y-1"><Label>Dosage *</Label><Input value={rxForm.dosage} onChange={(e) => setRxForm(f => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 500mg" required /></div>
                        <div className="col-span-2 space-y-1"><Label>Instructions</Label><Input value={rxForm.instructions} onChange={(e) => setRxForm(f => ({ ...f, instructions: e.target.value }))} placeholder="e.g. After meals" /></div>
                        <div className="col-span-2 space-y-1"><Label>Recommendations</Label><Textarea value={rxForm.recommendations} onChange={(e) => setRxForm(f => ({ ...f, recommendations: e.target.value }))} rows={2} /></div>
                      </div>
                      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setRxOpen(false)}>Cancel</Button><Button type="submit" disabled={createRx.isPending}>Add</Button></div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-2">
                {prescriptions?.map((rx) => (
                  <div key={rx.id} className="p-3 border rounded-lg text-sm" data-testid={`card-prescription-${rx.id}`}>
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{rx.medicineName}</p>
                      <Badge variant="outline" className="text-xs">{rx.dosage}</Badge>
                    </div>
                    {rx.instructions && <p className="text-xs text-muted-foreground mt-1">{rx.instructions}</p>}
                    {rx.recommendations && <p className="text-xs mt-1">{rx.recommendations}</p>}
                  </div>
                ))}
                {!prescriptions?.length && <p className="text-sm text-muted-foreground text-center py-4">No prescriptions</p>}
              </div>
            </TabsContent>

            <TabsContent value="followups" className="mt-3">
              <div className="flex justify-end mb-3">
                <Dialog open={fuOpen} onOpenChange={setFuOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" />Schedule Follow-up</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Schedule Follow-up</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); createFu.mutate({ data: { patientId, scheduledDate: fuForm.scheduledDate, notes: fuForm.notes || undefined } }, { onSuccess: () => { toast({ title: "Follow-up scheduled" }); setFuOpen(false); queryClient.invalidateQueries({ queryKey: getListFollowupsQueryKey({ patientId }) }); }, onError: () => toast({ title: "Failed", variant: "destructive" }) }); }} className="space-y-3 mt-2">
                      <div className="space-y-1"><Label>Scheduled Date *</Label><Input type="date" value={fuForm.scheduledDate} onChange={(e) => setFuForm(f => ({ ...f, scheduledDate: e.target.value }))} required /></div>
                      <div className="space-y-1"><Label>Notes</Label><Textarea value={fuForm.notes} onChange={(e) => setFuForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
                      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setFuOpen(false)}>Cancel</Button><Button type="submit" disabled={createFu.isPending}>Schedule</Button></div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-2">
                {followups?.map((fu) => (
                  <div key={fu.id} className="flex items-center justify-between p-3 border rounded-lg text-sm" data-testid={`card-followup-${fu.id}`}>
                    <div>
                      <p className="font-medium">{new Date(fu.scheduledDate).toLocaleDateString()}</p>
                      {fu.notes && <p className="text-xs text-muted-foreground">{fu.notes}</p>}
                    </div>
                    <Badge variant={fu.status === "completed" ? "default" : fu.status === "cancelled" ? "secondary" : "outline"} className="capitalize text-xs">{fu.status}</Badge>
                  </div>
                ))}
                {!followups?.length && <p className="text-sm text-muted-foreground text-center py-4">No follow-ups scheduled</p>}
              </div>
            </TabsContent>

            <TabsContent value="invoices" className="mt-3">
              <div className="space-y-2">
                {invoices?.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 border rounded-lg text-sm" data-testid={`card-invoice-${inv.id}`}>
                    <div>
                      <Link href={`/invoices/${inv.id}`} className="font-medium text-primary hover:underline">{inv.invoiceNumber}</Link>
                      <p className="text-xs text-muted-foreground">Total: ₹{inv.total}</p>
                    </div>
                    <Badge variant={inv.paymentStatus === "paid" ? "default" : inv.paymentStatus === "partial" ? "outline" : "secondary"} className="capitalize text-xs">{inv.paymentStatus}</Badge>
                  </div>
                ))}
                {!invoices?.length && <p className="text-sm text-muted-foreground text-center py-4">No invoices generated</p>}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
