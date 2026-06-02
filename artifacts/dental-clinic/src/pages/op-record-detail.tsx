import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetOpRecord, useListRevisits, useListDiagnoses, useCreateRevisit, useCreateDiagnosis, getGetOpRecordQueryKey, getListRevisitsQueryKey, getListDiagnosesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OpRecordDetail() {
  const { id } = useParams<{ id: string }>();
  const opId = parseInt(id!);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: op, isLoading } = useGetOpRecord(opId, { query: { enabled: !!opId, queryKey: getGetOpRecordQueryKey(opId) } });
  const { data: revisits } = useListRevisits({ opRecordId: opId }, { query: { queryKey: getListRevisitsQueryKey({ opRecordId: opId }) } });
  const { data: diagnoses } = useListDiagnoses({ opRecordId: opId }, { query: { queryKey: getListDiagnosesQueryKey({ opRecordId: opId }) } });

  const createRevisit = useCreateRevisit();
  const [rvForm, setRvForm] = useState({ visitDate: "", notes: "" });
  const [rvOpen, setRvOpen] = useState(false);

  const createDiag = useCreateDiagnosis();
  const [diagForm, setDiagForm] = useState({ notes: "" });
  const [diagOpen, setDiagOpen] = useState(false);

  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32 w-full" /></div>;
  if (!op) return <div className="p-6">OP record not found</div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/op-records"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
        <div>
          <h1 className="text-xl font-bold">{op.opNumber}</h1>
          <p className="text-sm text-muted-foreground">{op.patientName}</p>
        </div>
        <Badge variant={op.status === "active" ? "default" : "secondary"} className="capitalize">{op.status}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">OP Details</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Visit Reason</span><span>{op.visitReason}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Start Date</span><span>{new Date(op.startDate).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Expiry Date</span><span>{new Date(op.expiryDate).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Patient</span><Link href={`/patients/${op.patientId}`} className="text-primary hover:underline">{op.patientName}</Link></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Revisits ({revisits?.length ?? 0})</CardTitle>
            {op.status === "active" && (
              <Dialog open={rvOpen} onOpenChange={setRvOpen}>
                <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" />Add Revisit</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Revisit</DialogTitle></DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); createRevisit.mutate({ data: { opRecordId: opId, visitDate: rvForm.visitDate, notes: rvForm.notes || undefined } }, { onSuccess: () => { toast({ title: "Revisit added" }); setRvOpen(false); queryClient.invalidateQueries({ queryKey: getListRevisitsQueryKey({ opRecordId: opId }) }); }, onError: () => toast({ title: "Failed", variant: "destructive" }) }); }} className="space-y-3 mt-2">
                    <div className="space-y-1"><Label>Visit Date *</Label><Input type="date" value={rvForm.visitDate} onChange={(e) => setRvForm(f => ({ ...f, visitDate: e.target.value }))} required /></div>
                    <div className="space-y-1"><Label>Notes</Label><Textarea value={rvForm.notes} onChange={(e) => setRvForm(f => ({ ...f, notes: e.target.value }))} rows={3} /></div>
                    <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setRvOpen(false)}>Cancel</Button><Button type="submit" disabled={createRevisit.isPending}>Add</Button></div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {revisits?.map((rv) => (
                <div key={rv.id} className="p-2.5 bg-muted/30 rounded-md text-sm">
                  <p className="font-medium text-xs">{new Date(rv.visitDate).toLocaleDateString()}</p>
                  {rv.notes && <p className="text-muted-foreground text-xs mt-0.5">{rv.notes}</p>}
                  {rv.doctorName && <p className="text-xs text-primary mt-0.5">{rv.doctorName}</p>}
                </div>
              ))}
              {!revisits?.length && <p className="text-xs text-muted-foreground text-center py-3">No revisits yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm">Diagnoses ({diagnoses?.length ?? 0})</CardTitle>
          <Dialog open={diagOpen} onOpenChange={setDiagOpen}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" />Add Diagnosis</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Diagnosis</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createDiag.mutate({ data: { patientId: op.patientId, opRecordId: opId, notes: diagForm.notes } }, { onSuccess: () => { toast({ title: "Diagnosis added" }); setDiagOpen(false); queryClient.invalidateQueries({ queryKey: getListDiagnosesQueryKey({ opRecordId: opId }) }); }, onError: () => toast({ title: "Failed", variant: "destructive" }) }); }} className="space-y-3 mt-2">
                <div className="space-y-1"><Label>Notes *</Label><Textarea value={diagForm.notes} onChange={(e) => setDiagForm({ notes: e.target.value })} rows={4} required /></div>
                <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDiagOpen(false)}>Cancel</Button><Button type="submit" disabled={createDiag.isPending}>Add</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {diagnoses?.map((d) => (
              <div key={d.id} className="p-3 border rounded-lg text-sm">
                <p className="whitespace-pre-wrap">{d.notes}</p>
                <p className="text-xs text-muted-foreground mt-1">{d.createdByName || "System"} · {new Date(d.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
            {!diagnoses?.length && <p className="text-sm text-muted-foreground text-center py-4">No diagnoses recorded</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
