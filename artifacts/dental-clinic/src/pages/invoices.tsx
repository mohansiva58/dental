import { useState } from "react";
import { useListInvoices, useCreateInvoice, useListPatients, getListInvoicesQueryKey } from "@workspace/api-client-react";
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
import { Plus, Receipt, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type LineItem = { description: string; quantity: number; unitPrice: string };

function calcItem(item: LineItem) {
  return (item.quantity || 1) * (parseFloat(item.unitPrice) || 0);
}

function NewInvoiceDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: "" },
  ]);
  const { data: patients } = useListPatients({});
  const create = useCreateInvoice();
  const { toast } = useToast();

  const addItem = () => setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: "" }]);

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const setItem = (idx: number, field: keyof LineItem, value: string | number) =>
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const total = items.reduce((sum, item) => sum + calcItem(item), 0);

  const valid = patientId && items.length > 0 &&
    items.every((it) => it.description.trim() && parseFloat(it.unitPrice) > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const lineItems = items.map((it) => ({
      description: it.description,
      quantity: it.quantity,
      unitPrice: parseFloat(it.unitPrice),
      amount: calcItem(it),
    }));
    create.mutate(
      {
        data: {
          patientId: parseInt(patientId),
          items: lineItems,
          subtotal: total,
          total: total,
          paymentStatus: paymentStatus as any,
          paymentMethod: paymentMethod || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Invoice created successfully" });
          setOpen(false);
          setPatientId("");
          setPaymentStatus("pending");
          setPaymentMethod("");
          setItems([{ description: "", quantity: 1, unitPrice: "" }]);
          onSuccess();
        },
        onError: () => toast({ title: "Failed to create invoice", variant: "destructive" }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-new-invoice">
          <Plus className="h-4 w-4 mr-1" /> New Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Patient <span className="text-destructive">*</span></Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger><SelectValue placeholder="Select patient..." /></SelectTrigger>
                <SelectContent>
                  {patients?.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.fullName} ({p.patientId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Line Items <span className="text-destructive">*</span></Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-3 w-3 mr-1" /> Add Item
              </Button>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Description</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground w-16">Qty</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground w-28">Unit Price (₹)</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground w-24">Amount</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">
                        <Input
                          className="h-7 text-xs border-0 shadow-none p-0 focus-visible:ring-0"
                          placeholder="e.g. Root Canal Treatment"
                          value={item.description}
                          onChange={(e) => setItem(idx, "description", e.target.value)}
                          required
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          className="h-7 text-xs text-right border-0 shadow-none p-0 focus-visible:ring-0 w-12 ml-auto"
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => setItem(idx, "quantity", parseInt(e.target.value) || 1)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          className="h-7 text-xs text-right border-0 shadow-none p-0 focus-visible:ring-0"
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="0.00"
                          value={item.unitPrice}
                          onChange={(e) => setItem(idx, "unitPrice", e.target.value)}
                          required
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-xs">
                        ₹{calcItem(item).toLocaleString()}
                      </td>
                      <td className="px-2 py-2">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 border-t">
                    <td colSpan={3} className="px-3 py-2 text-right font-bold text-sm">Total</td>
                    <td className="px-3 py-2 text-right font-bold text-sm text-primary">
                      ₹{total.toLocaleString()}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Payment Status</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card (Debit/Credit)</SelectItem>
                  <SelectItem value="UPI">UPI (GPay / PhonePe)</SelectItem>
                  <SelectItem value="NetBanking">Net Banking</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending || !valid}>
              {create.isPending ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const params = statusFilter !== "all" ? { paymentStatus: statusFilter } : {};
  const { data: invoices, isLoading } = useListInvoices(params, {
    query: { queryKey: getListInvoicesQueryKey(params) }
  });

  const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    paid: "default",
    partial: "outline",
    pending: "secondary",
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground text-sm">Billing and payment tracking</p>
        </div>
        <NewInvoiceDialog
          onSuccess={() => queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() })}
        />
      </div>

      <div className="flex gap-2">
        {["all", "pending", "paid", "partial"].map((s) => (
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
          ) : invoices && invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice #</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Patient</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Items</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Total</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Method</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv) => {
                    const itemCount = Array.isArray(inv.items) ? inv.items.length : 0;
                    return (
                      <tr key={inv.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-invoice-${inv.id}`}>
                        <td className="px-4 py-3 font-mono text-xs text-primary">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 font-medium">{inv.patientName}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </td>
                        <td className="px-4 py-3 font-semibold">₹{Number(inv.total).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariant[inv.paymentStatus] ?? "secondary"} className="capitalize text-xs">
                            {inv.paymentStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{inv.paymentMethod || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(inv.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/invoices/${inv.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">View</Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No invoices found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
