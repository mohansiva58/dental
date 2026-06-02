import { useState } from "react";
import { useListPatients, getListPatientsQueryKey } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, User, GitFork } from "lucide-react";

export default function Patients() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [, setLocation] = useLocation();

  const { data: patients, isLoading } = useListPatients(
    debouncedSearch ? { search: debouncedSearch } : {},
    { query: { queryKey: getListPatientsQueryKey(debouncedSearch ? { search: debouncedSearch } : {}) } }
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setTimeout(() => setDebouncedSearch(e.target.value), 300);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patients</h1>
          <p className="text-muted-foreground text-sm">Search and manage patient records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setLocation("/workflow")}>
            <GitFork className="h-4 w-4 mr-1" /> Workflow
          </Button>
          <Button data-testid="button-register-patient" onClick={() => setLocation("/patients/new")}>
            <Plus className="h-4 w-4 mr-1" /> Register Patient
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          data-testid="input-search-patient"
          className="pl-9"
          placeholder="Search by name, ID, or phone..."
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : patients && patients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Patient ID</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Age/Gender</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Blood Group</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {patients.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-patient-${p.id}`}>
                      <td className="px-4 py-3 font-mono text-xs text-primary">{p.patientId}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="font-medium">{p.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.age}y · <span className="capitalize">{p.gender}</span></td>
                      <td className="px-4 py-3">{p.contactNumber}</td>
                      <td className="px-4 py-3">{p.bloodGroup || <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-4 py-3">
                        <Badge variant={p.status === "active" ? "default" : "secondary"} className="capitalize text-xs">{p.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/patients/${p.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>{search ? "No patients found matching your search" : "No patients registered yet"}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
