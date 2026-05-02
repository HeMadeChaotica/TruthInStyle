import ControlPanelOverlay from './ControlPanelOverlay';

export default function AppShell({ children }) {
  return (
    <div className="app-shell">
      <ControlPanelOverlay />
      <main className="app-content">{children}</main>
    </div>
  );
}
