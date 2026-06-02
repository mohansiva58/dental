import { useState } from "react";
import { useListOpRecords, useCreateOpRecord, useListPatients, getListOpRecordsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OpRecords() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ patientId: "", visitReason: "" });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = statusFilter !== "all" ? { status: statusFilter } : {};
  const { data: opRecords, isLoading } = useListOpRecords(params, { query: { queryKey: getListOpRecordsQueryKey(params) } });
  const { data: patients } = useListPatients({});
  const create = useCreateOpRecord();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      { data: { patientId: parseInt(form.patientId), visitReason: form.visitReason } },
      {
        onSuccess: () => {
          toast({ title: "OP record created" });
          setOpen(false);
          setForm({ patientId: "", visitReason: "" });
          queryClient.invalidateQueries({ queryKey: getListOpRecordsQueryKey() });
        },
        onError: () => toast({ title: "Failed to create OP record", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">OP Records</h1>
          <p className="text-muted-foreground text-sm">Outpatient registration and visit tracking</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-op"><Plus className="h-4 w-4 mr-1" />New OP</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create OP Record</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 mt-2">
              <div className="space-y-1">
                <Label>Patient *</Label>
                <Select value={form.patientId} onValueChange={(v) => setForm(f => ({ ...f, patientId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {patients?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.fullName} ({p.patientId})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Visit Reason *</Label>
                <Input value={form.visitReason} onChange={(e) => setForm(f => ({ ...f, visitReason: e.target.value }))} required />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={create.isPending}>Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        {["all", "active", "expired"].map((s) => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" className="capitalize" onClick={() => setStatusFilter(s)}>{s}</Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : opRecords && opRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">OP Number</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Patient</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Visit Reason</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Start Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expiry</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {opRecords.map((op) => (
                    <tr key={op.id} className="hover:bg-muted/20" data-testid={`row-op-${op.id}`}>
                      <td className="px-4 py-3 font-mono text-xs text-primary">{op.opNumber}</td>
                      <td className="px-4 py-3 font-medium">{op.patientName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{op.visitReason}</td>
                      <td className="px-4 py-3">{new Date(op.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(op.expiryDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><Badge variant={op.status === "active" ? "default" : "secondary"} className="capitalize text-xs">{op.status}</Badge></td>
                      <td className="px-4 py-3"><Link href={`/op-records/${op.id}`}><Button variant="ghost" size="sm" className="h-7 text-xs">View</Button></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No OP records found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
