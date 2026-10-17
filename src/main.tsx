import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./app/App";
import { AppProvider } from "./app/AppProvider";
import { AuthProvider } from "./app/AuthProvider";
import { ToastProvider } from "@/components/shared/ToastProvider";
import { ThemeProvider } from "./theme/ThemeProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </AppProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
