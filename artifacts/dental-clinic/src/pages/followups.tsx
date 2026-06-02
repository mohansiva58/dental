import { useState } from "react";
import {
  useListFollowups, useUpdateFollowup, useCreateFollowup,
  useListPatients,
  getListFollowupsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function ScheduleFollowupDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ patientId: "", scheduledDate: "", notes: "" });
  const { data: patients } = useListPatients({});
  const create = useCreateFollowup();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      { data: { patientId: parseInt(form.patientId), scheduledDate: form.scheduledDate, notes: form.notes || undefined } },
      {
        onSuccess: () => {
          toast({ title: "Follow-up scheduled" });
          setOpen(false);
          setForm({ patientId: "", scheduledDate: "", notes: "" });
          onSuccess();
        },
        onError: () => toast({ title: "Failed to schedule follow-up", variant: "destructive" }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-1" />Schedule Follow-up</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Schedule Follow-up</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Patient <span className="text-destructive">*</span></Label>
            <Select value={form.patientId} onValueChange={(v) => setForm((f) => ({ ...f, patientId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select patient..." /></SelectTrigger>
              <SelectContent>
                {patients?.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.fullName} <span className="text-muted-foreground text-xs">({p.patientId})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Scheduled Date <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={form.scheduledDate}
              onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              placeholder="Reason for follow-up, instructions..."
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending || !form.patientId || !form.scheduledDate}>
              {create.isPending ? "Scheduling..." : "Schedule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function FollowUps() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = statusFilter !== "all" ? { status: statusFilter } : {};
  const { data: followups, isLoading } = useListFollowups(params, {
    query: { queryKey: getListFollowupsQueryKey(params) }
  });
  const update = useUpdateFollowup();

  const handleStatusChange = (id: number, status: string) => {
    update.mutate(
      { id, data: { status: status as any } },
      {
        onSuccess: () => {
          toast({ title: "Follow-up updated" });
          queryClient.invalidateQueries({ queryKey: getListFollowupsQueryKey() });
        },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      }
    );
  };

  const isOverdue = (date: string, status: string) =>
    status === "pending" && new Date(date) < new Date();

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Follow-ups</h1>
          <p className="text-muted-foreground text-sm">Manage scheduled patient follow-ups</p>
        </div>
        <ScheduleFollowupDialog
          onSuccess={() => queryClient.invalidateQueries({ queryKey: getListFollowupsQueryKey() })}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "pending", "completed", "cancelled"].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            className="capitalize"
            onClick={() => setStatusFilter(s)}
          >
            {s}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : followups && followups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Patient</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Scheduled Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Notes</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {followups.map((fu) => {
                    const overdue = isOverdue(fu.scheduledDate, fu.status);
                    return (
                      <tr key={fu.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-followup-${fu.id}`}>
                        <td className="px-4 py-3">
                          <Link href={`/patients/${fu.patientId}`} className="font-medium hover:text-primary transition-colors">
                            {fu.patientName || `Patient #${fu.patientId}`}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <span className={overdue ? "text-destructive font-semibold" : ""}>
                              {new Date(fu.scheduledDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                            {overdue && (
                              <Badge variant="destructive" className="ml-2 text-[10px] h-4 px-1">Overdue</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                          {fu.notes || <span className="italic opacity-50">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={fu.status === "completed" ? "default" : fu.status === "cancelled" ? "secondary" : "outline"}
                            className="capitalize text-xs"
                          >
                            {fu.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {fu.status === "pending" && (
                            <Select value={fu.status} onValueChange={(v) => handleStatusChange(fu.id, v)}>
                              <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No follow-ups found</p>
              <p className="text-xs mt-1">Use the "Schedule Follow-up" button to add one</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
