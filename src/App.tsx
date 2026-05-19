import { HashRouter, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Landing } from "@/pages/Landing";
import { Train } from "@/pages/Train";
import { Dashboard } from "@/pages/Dashboard";
import { Diagnose } from "@/pages/Diagnose";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="train" element={<Train />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="diagnose" element={<Diagnose />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
