import { useListTreatments, useUpdateTreatment, getListTreatmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link } from "wouter";

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  planned: "secondary",
  "in-progress": "outline",
  completed: "default",
  cancelled: "destructive",
};

export default function Treatments() {
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: treatments, isLoading } = useListTreatments(
    {},
    { query: { queryKey: getListTreatmentsQueryKey({}) } }
  );
  const update = useUpdateTreatment();

  const handleStatusChange = (id: number, status: string) => {
    update.mutate({ id, data: { status: status as any } }, {
      onSuccess: () => {
        toast({ title: "Treatment updated" });
        queryClient.invalidateQueries({ queryKey: getListTreatmentsQueryKey({}) });
      },
      onError: () => toast({ title: "Failed to update", variant: "destructive" }),
    });
  };

  const filtered = statusFilter === "all"
    ? treatments
    : treatments?.filter((t) => t.status === statusFilter);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Treatments</h1>
        <p className="text-muted-foreground text-sm">Track all treatment procedures across patients</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "planned", "in-progress", "completed", "cancelled"].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            className="capitalize"
            onClick={() => setStatusFilter(s)}
          >
            {s}
            {treatments && s !== "all" && (
              <span className="ml-1.5 text-[10px] opacity-70">
                ({treatments.filter((t) => t.status === s).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered && filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Patient</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Procedure</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tooth</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cost</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-treatment-${t.id}`}>
                      <td className="px-4 py-3">
                        {t.patientId ? (
                          <Link href={`/patients/${t.patientId}`} className="font-medium hover:text-primary transition-colors">
                            {(t as any).patientName ?? `Patient #${t.patientId}`}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{t.procedure}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t.toothNumber || "—"}</td>
                      <td className="px-4 py-3">{t.cost ? `₹${Number(t.cost).toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[t.status] ?? "secondary"} className="capitalize text-xs">
                          {t.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Select value={t.status} onValueChange={(v) => handleStatusChange(t.id, v)}>
                          <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planned">Planned</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>{statusFilter === "all" ? "No treatments found" : `No ${statusFilter} treatments`}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
