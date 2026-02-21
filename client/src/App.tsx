import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import About from "@/pages/about";
import Services from "@/pages/services";
import ServiceDetail from "@/pages/service-detail";
import Contact from "@/pages/contact";
import StaffApp from "@/pages/staff/staff-app";

const STAFF_HOSTS = (import.meta.env.VITE_STAFF_HOSTS || "")
  .split(",")
  .map((h: string) => h.trim().toLowerCase())
  .filter(Boolean);

function isStaffSubdomain(): boolean {
  if (typeof window === "undefined" || STAFF_HOSTS.length === 0) return false;
  return STAFF_HOSTS.includes(window.location.hostname.toLowerCase());
}

function PublicRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/services/:serviceId" component={ServiceDetail} />
      <Route path="/services" component={Services} />
      <Route path="/contact" component={Contact} />
      <Route path="/staff/login" component={() => <StaffApp basePath="/staff" />} />
      <Route path="/staff/dashboard" component={() => <StaffApp basePath="/staff" />} />
      <Route path="/staff/employees" component={() => <StaffApp basePath="/staff" />} />
      <Route path="/staff/attendance" component={() => <StaffApp basePath="/staff" />} />
      <Route path="/staff/leads" component={() => <StaffApp basePath="/staff" />} />
      <Route path="/staff/my-leads" component={() => <StaffApp basePath="/staff" />} />
      <Route path="/staff/my-attendance" component={() => <StaffApp basePath="/staff" />} />
      <Route path="/staff/profile" component={() => <StaffApp basePath="/staff" />} />
      <Route path="/staff" component={() => <StaffApp basePath="/staff" />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  if (isStaffSubdomain()) {
    return <StaffApp basePath="" />;
  }
  return <PublicRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
