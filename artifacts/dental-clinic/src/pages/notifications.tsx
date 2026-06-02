import { useListNotifications } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Calendar, Activity, DollarSign } from "lucide-react";
import { Link } from "wouter";

const typeConfig: Record<string, { icon: any; color: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  followup: { icon: Calendar, color: "text-amber-500", variant: "outline" },
  "incomplete-treatment": { icon: Activity, color: "text-blue-500", variant: "secondary" },
  "pending-payment": { icon: DollarSign, color: "text-orange-500", variant: "destructive" },
};

export default function Notifications() {
  const { data: notifications, isLoading } = useListNotifications();

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground text-sm">Pending follow-ups and incomplete treatments</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : notifications && notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((n) => {
            const config = typeConfig[n.type] || { icon: Bell, color: "text-primary", variant: "secondary" as const };
            const Icon = config.icon;
            return (
              <Card key={n.id} data-testid={`card-notification-${n.id}`}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className={`p-2 rounded-lg bg-muted ${config.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.message}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {n.patientName && (
                        <Link href={`/patients/${n.patientId}`} className="text-xs text-primary hover:underline">{n.patientName}</Link>
                      )}
                      {n.scheduledDate && <span className="text-xs text-muted-foreground">{new Date(n.scheduledDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <Badge variant={config.variant} className="capitalize text-xs whitespace-nowrap">{n.type.replace("-", " ")}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium">All clear!</p>
          <p className="text-sm mt-1">No pending notifications</p>
        </div>
      )}
    </div>
  );
}
