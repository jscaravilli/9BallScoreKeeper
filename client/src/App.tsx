import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Game from "@/pages/game";
import ScoresheetTest from "@/components/scoresheet-test";
import PDFTest from "@/pages/pdf-test";
import TallyView from "@/pages/tally-view";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Game} />
      <Route path="/tally-view" component={TallyView} />
      <Route path="/test" component={ScoresheetTest} />
      <Route path="/pdf-test" component={PDFTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
