import { HashRouter, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Landing } from "@/pages/Landing";
import { Train } from "@/pages/Train";
import { Dashboard } from "@/pages/Dashboard";
import { EntryTest } from "@/pages/EntryTest";
import { DeepDive } from "@/pages/DeepDive";
import { MockExam } from "@/pages/MockExam";
import { Inspector } from "@/pages/Inspector";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="train" element={<Train />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="entry-test" element={<EntryTest />} />
          <Route path="dive/:skill" element={<DeepDive />} />
          <Route path="mock" element={<MockExam />} />
          <Route path="inspector" element={<Inspector />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
