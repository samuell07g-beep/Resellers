import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocalAuthProvider } from "./contexts/LocalAuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Shop from "./pages/Shop";
import Checkout from "./pages/Checkout";
import MyPurchases from "./pages/MyPurchases";
import AdminPanel from "./pages/AdminPanel";
import Support from "./pages/Support";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/shop" component={Shop} />
      <Route path="/checkout/:orderId" component={Checkout} />
      <Route path="/my-purchases" component={MyPurchases} />
      <Route path="/support" component={Support} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <LocalAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LocalAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
