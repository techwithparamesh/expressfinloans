import { useState, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { getAuthMe, type StaffUser } from "@/lib/api";
import StaffLogin from "./staff-login";
import StaffLayout from "./staff-layout";
import StaffDashboard from "./staff-dashboard";
import StaffProfile from "./staff-profile";
import StaffMyLeads from "./staff-my-leads";
import StaffMyAttendance from "./staff-my-attendance";
import StaffEmployees from "./staff-employees";
import StaffAttendance from "./staff-attendance";
import StaffLeads from "./staff-leads";

function StaffRedirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => setLocation(to), [to, setLocation]);
  return null;
}

export default function StaffApp() {
  const [user, setUser] = useState<StaffUser | null | undefined>(undefined);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    getAuthMe()
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null));
  }, [location]);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!user && location !== "/staff/login") {
    setLocation("/staff/login");
    return null;
  }

  if (user && location === "/staff/login") {
    setLocation(user.role === "admin" ? "/staff/dashboard" : "/staff/my-leads");
    return null;
  }

  if (!user) {
    return <StaffLogin />;
  }

  return (
    <StaffLayout>
      <Switch>
        <Route path="/staff/dashboard" component={StaffDashboard} />
        <Route path="/staff/employees" component={StaffEmployees} />
        <Route path="/staff/attendance" component={StaffAttendance} />
        <Route path="/staff/leads" component={StaffLeads} />
        <Route path="/staff/my-leads" component={StaffMyLeads} />
        <Route path="/staff/my-attendance" component={StaffMyAttendance} />
        <Route path="/staff/profile" component={StaffProfile} />
        <Route path="/staff">
          <StaffRedirect to={user.role === "admin" ? "/staff/dashboard" : "/staff/my-leads"} />
        </Route>
      </Switch>
    </StaffLayout>
  );
}
