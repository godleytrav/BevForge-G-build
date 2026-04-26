import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './shell/AppShell';
import { LabHomePage } from './pages/LabHomePage';
import { LabExportPage } from './pages/LabExportPage';
import { LabBuilderPage } from './pages/LabBuilderPage';
import { LabBuilderV2Page } from './pages/LabBuilderV2Page';
import { LabBuilderV2HubPage } from './pages/LabBuilderV2HubPage';
import { LabBuilderStubPage } from './pages/LabBuilderStubPage';
import { LabCiderBuilderPage } from './pages/LabCiderBuilderPage';
import { LabLibraryPage } from './pages/LabLibraryPage';
import { LabUtilityPage } from './pages/LabUtilityPage';

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/lab" replace />} />
          <Route path="/lab" element={<LabHomePage />} />
          <Route path="/lab/builder" element={<LabBuilderPage />} />
          <Route path="/lab/builder-v2" element={<LabBuilderV2HubPage />} />
          <Route
            path="/lab/builder-v2/beer"
            element={
              <LabBuilderStubPage
                family="beer"
                title="Beer Builder"
                description="Dedicated beer route for brewhouse recipe authoring."
                summary="Beer now has its own route in Builder V2 so mash, boil, hop, and brewhouse logic can be isolated instead of leaking into cider and wine."
              />
            }
          />
          <Route path="/lab/builder-v2/cider" element={<LabCiderBuilderPage />} />
          <Route
            path="/lab/builder-v2/wine"
            element={
              <LabBuilderStubPage
                family="wine"
                title="Wine Builder"
                description="Dedicated wine route for cellar and must authoring."
                summary="Wine now has its own route in Builder V2 so must, acidity, tannin, stabilization, and wine-specific compliance logic can be built without inheriting beer or cider assumptions."
              />
            }
          />
          <Route path="/lab/library" element={<LabLibraryPage />} />
          <Route path="/lab/exports" element={<LabExportPage />} />
          <Route
            path="/notifications"
            element={
              <LabUtilityPage
                title="Notifications"
                description="Universal BevForge notification surface for alerts, handoff reviews, and schedule prompts."
              />
            }
          />
          <Route
            path="/calendar"
            element={
              <LabUtilityPage
                title="Calendar"
                description="Universal BevForge calendar surface for production planning, agency dates, and team scheduling."
              />
            }
          />
          <Route
            path="/settings"
            element={
              <LabUtilityPage
                title="Settings"
                description="Universal BevForge settings surface for suite-level configuration and system preferences."
              />
            }
          />
          <Route
            path="/profile"
            element={
              <LabUtilityPage
                title="Profile"
                description="User profile surface for account context, role visibility, and personal workspace controls."
              />
            }
          />
          <Route path="*" element={<Navigate to="/lab" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
