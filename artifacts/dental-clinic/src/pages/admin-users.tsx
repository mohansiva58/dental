import { useState } from "react";
import { useListUsers, useCreateUser, useUpdateUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsers() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", fullName: "", role: "receptionist" });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users, isLoading } = useListUsers();
  const create = useCreateUser();
  const update = useUpdateUser();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      { data: { username: form.username, password: form.password, fullName: form.fullName, role: form.role as any } },
      {
        onSuccess: () => {
          toast({ title: "User created" });
          setOpen(false);
          setForm({ username: "", password: "", fullName: "", role: "receptionist" });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        },
        onError: () => toast({ title: "Failed to create user", variant: "destructive" }),
      }
    );
  };

  const handleToggleStatus = (id: number, status: string) => {
    const newStatus = status === "active" ? "inactive" : "active";
    update.mutate(
      { id, data: { status: newStatus as any } },
      {
        onSuccess: () => {
          toast({ title: `User ${newStatus}` });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        },
        onError: () => toast({ title: "Failed", variant: "destructive" }),
      }
    );
  };

  const roleColors: Record<string, "default" | "secondary" | "outline"> = {
    administrator: "default",
    doctor: "outline",
    receptionist: "secondary",
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground text-sm">Manage staff accounts and roles</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-user"><Plus className="h-4 w-4 mr-1" />Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create User Account</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3 mt-2">
              <div className="space-y-1"><Label>Full Name *</Label><Input data-testid="input-user-fullname" value={form.fullName} onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))} required /></div>
              <div className="space-y-1"><Label>Username *</Label><Input data-testid="input-user-username" value={form.username} onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))} required /></div>
              <div className="space-y-1"><Label>Password *</Label><Input data-testid="input-user-password" type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} required /></div>
              <div className="space-y-1">
                <Label>Role *</Label>
                <Select value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrator">Administrator</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={create.isPending}>Create</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Full Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Username</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Login</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/20" data-testid={`row-user-${u.id}`}>
                      <td className="px-4 py-3 font-medium">{u.fullName}</td>
                      <td className="px-4 py-3 font-mono text-xs">{u.username}</td>
                      <td className="px-4 py-3"><Badge variant={roleColors[u.role] || "secondary"} className="capitalize text-xs">{u.role}</Badge></td>
                      <td className="px-4 py-3"><Badge variant={u.status === "active" ? "default" : "secondary"} className="capitalize text-xs">{u.status}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleToggleStatus(u.id, u.status)}>
                          {u.status === "active" ? "Disable" : "Enable"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
