## 2026-06-17 - Dashboard Tiles Keyboard Accessibility
**Learning:** Interactive div elements acting as buttons need role="button", tabindex="0", and explicit 'Enter'/'Space' keydown handlers to be fully keyboard accessible.
**Action:** When adding or reviewing custom interactive elements (like tiles or cards), ensure both click and keyboard handlers are present, along with proper ARIA attributes.
