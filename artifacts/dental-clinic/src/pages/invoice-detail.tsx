import { useParams, Link } from "wouter";
import { useGetInvoice, useUpdateInvoice, getGetInvoiceQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = parseInt(id!);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: invoice, isLoading } = useGetInvoice(invoiceId, { query: { enabled: !!invoiceId, queryKey: getGetInvoiceQueryKey(invoiceId) } });
  const update = useUpdateInvoice();

  const handleStatusChange = (status: string) => {
    update.mutate(
      { id: invoiceId, data: { paymentStatus: status as any, paymentDate: status === "paid" ? new Date().toISOString() : undefined } },
      {
        onSuccess: () => {
          toast({ title: "Invoice updated" });
          queryClient.invalidateQueries({ queryKey: getGetInvoiceQueryKey(invoiceId) });
        },
        onError: () => toast({ title: "Failed", variant: "destructive" }),
      }
    );
  };

  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-48 w-full" /></div>;
  if (!invoice) return <div className="p-6">Invoice not found</div>;

  const items = (invoice.items || []) as Array<{ description: string; quantity: number; unitPrice: number; amount: number }>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/invoices"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
        <div>
          <h1 className="text-xl font-bold">{invoice.invoiceNumber}</h1>
          <p className="text-sm text-muted-foreground">{invoice.patientName}</p>
        </div>
        <Badge variant={invoice.paymentStatus === "paid" ? "default" : invoice.paymentStatus === "partial" ? "outline" : "secondary"} className="capitalize">{invoice.paymentStatus}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-sm">Line Items</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2">Description</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Unit Price</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">₹{Number(item.unitPrice).toLocaleString()}</td>
                    <td className="py-2 text-right font-medium">₹{Number(item.amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td colSpan={3} className="py-2 text-right text-muted-foreground">Subtotal</td>
                  <td className="py-2 text-right">₹{Number(invoice.subtotal).toLocaleString()}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-2 text-right font-bold">Total</td>
                  <td className="py-2 text-right font-bold text-lg">₹{Number(invoice.total).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Payment Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
              <Badge variant={invoice.paymentStatus === "paid" ? "default" : "secondary"} className="capitalize">{invoice.paymentStatus}</Badge>
            </div>
            {invoice.paymentMethod && <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span>{invoice.paymentMethod}</span></div>}
            {invoice.paymentDate && <div className="flex justify-between"><span className="text-muted-foreground">Paid On</span><span>{new Date(invoice.paymentDate).toLocaleDateString()}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{new Date(invoice.createdAt).toLocaleDateString()}</span></div>
            {invoice.paymentStatus !== "paid" && (
              <div className="pt-2 border-t space-y-2">
                <p className="text-xs text-muted-foreground">Update payment status:</p>
                <Select value={invoice.paymentStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="partial">Partial</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
