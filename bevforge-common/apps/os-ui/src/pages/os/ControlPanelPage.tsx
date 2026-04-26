import CanvasStudio from '@/features/canvas/CanvasStudio';
import { AppShell } from '@/components/AppShell';

export default function ControlPanelPage() {
  return (
    <AppShell currentSuite="os" pageTitle="Control Panel" fullWidth>
      <CanvasStudio />
    </AppShell>
  );
}
