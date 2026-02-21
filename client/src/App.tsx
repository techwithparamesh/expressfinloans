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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/services/:serviceId" component={ServiceDetail} />
      <Route path="/services" component={Services} />
      <Route path="/contact" component={Contact} />
      <Route path="/staff/login" component={StaffApp} />
      <Route path="/staff/dashboard" component={StaffApp} />
      <Route path="/staff/employees" component={StaffApp} />
      <Route path="/staff/attendance" component={StaffApp} />
      <Route path="/staff/leads" component={StaffApp} />
      <Route path="/staff/my-leads" component={StaffApp} />
      <Route path="/staff/my-attendance" component={StaffApp} />
      <Route path="/staff/profile" component={StaffApp} />
      <Route path="/staff" component={StaffApp} />
      <Route component={NotFound} />
    </Switch>
  );
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
