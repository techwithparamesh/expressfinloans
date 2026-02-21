import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { staffJson } from "@/lib/api";

type Employee = {
  id: string;
  username: string;
  role: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
};

export default function StaffEmployees() {
  const [list, setList] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffJson<Employee[]>("/staff/employees")
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Employees</h1>
      <Card>
        <CardHeader>
          <CardTitle>All employees</CardTitle>
          <CardDescription>Staff with role employee.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Username</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">Phone</th>
                </tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id} className="border-b">
                    <td className="py-2">{e.fullName ?? "—"}</td>
                    <td className="py-2">{e.username}</td>
                    <td className="py-2">{e.email ?? "—"}</td>
                    <td className="py-2">{e.phone ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
