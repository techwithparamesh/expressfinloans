import { useState, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { getAuthMe, type StaffUser } from "@/lib/api";
import StaffLogin from "./staff-login";
import StaffLayout from "./staff-layout";
import StaffDashboard from "./staff-dashboard";
import StaffMyDashboard from "./staff-my-dashboard";
import StaffProfile from "./staff-profile";
import StaffMyLeads from "./staff-my-leads";
import StaffMyAttendance from "./staff-my-attendance";
import StaffEmployees from "./staff-employees";
import StaffAttendance from "./staff-attendance";
import StaffLeads from "./staff-leads";
import StaffInsuranceLeads from "./staff-insurance-leads";
import StaffMyTeam from "./staff-my-team";
import StaffMyLeave from "./staff-my-leave";
import StaffLeaveRequests from "./staff-leave-requests";
import StaffTargetAllocation from "./staff-target-allocation";
import StaffAdminExpenses from "./staff-admin-expenses";
import StaffPayroll from "./staff-payroll";
import StaffMyPayslips from "./staff-my-payslips";
import StaffHolidays from "./staff-holidays";

function StaffRedirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => setLocation(to), [to, setLocation]);
  return null;
}

const p = (base: string, path: string) => (base ? `${base}${path}` : path || "/");

export default function StaffApp({ basePath = "/staff" }: { basePath?: string }) {
  const [user, setUser] = useState<StaffUser | null | undefined>(undefined);
  const [location, setLocation] = useLocation();

  const loginPath = p(basePath, "/login");
  const dashboardPath = p(basePath, "/dashboard");
  const myDashboardPath = p(basePath, "/my-dashboard");
  const myLeadsPath = p(basePath, "/my-leads");

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

  if (!user && location !== loginPath) {
    setLocation(loginPath);
    return null;
  }

  if (user && location === loginPath) {
    const dest = user.role === "admin" || user.role === "team_lead" ? dashboardPath : myDashboardPath;
    setLocation(dest);
    return null;
  }

  if (!user) {
    return <StaffLogin basePath={basePath} />;
  }

  return (
    <StaffLayout basePath={basePath}>
      <Switch>
        <Route path={p(basePath, "/dashboard")} component={StaffDashboard} />
        <Route path={p(basePath, "/my-dashboard")} component={StaffMyDashboard} />
        <Route path={p(basePath, "/employees")} component={StaffEmployees} />
        <Route path={p(basePath, "/my-team")} component={StaffMyTeam} />
        <Route path={p(basePath, "/attendance")} component={StaffAttendance} />
        <Route path={p(basePath, "/leads")} component={StaffLeads} />
        <Route path={p(basePath, "/insurance-leads")} component={StaffInsuranceLeads} />
        <Route path={p(basePath, "/leave-requests")} component={StaffLeaveRequests} />
        <Route path={p(basePath, "/target-allocation")} component={StaffTargetAllocation} />
        <Route path={p(basePath, "/admin-expenses")} component={StaffAdminExpenses} />
        <Route path={p(basePath, "/payroll")} component={StaffPayroll} />
        <Route path={p(basePath, "/holidays")} component={StaffHolidays} />
        <Route path={p(basePath, "/my-payslips")} component={StaffMyPayslips} />
        <Route path={p(basePath, "/my-leads")} component={StaffMyLeads} />
        <Route path={p(basePath, "/my-attendance")} component={StaffMyAttendance} />
        <Route path={p(basePath, "/my-leave")} component={StaffMyLeave} />
        <Route path={p(basePath, "/profile")} component={StaffProfile} />
        <Route path={basePath || "/"}>
          <StaffRedirect to={user.role === "admin" || user.role === "team_lead" ? dashboardPath : myDashboardPath} />
        </Route>
      </Switch>
    </StaffLayout>
  );
}
