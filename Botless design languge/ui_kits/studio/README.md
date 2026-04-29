# Botless Studio — UI Kit

High-fidelity recreation of the merchant studio. The 3-column "factory floor" layout: **Ward** (left) → **Operating Table** (center) → **Vitals** (right).

Built from the codebase under `frontend/src/components/*` (AppShell, AvatarStage, ChatPanel, AgentCard) re-skinned with the Stealth Hospital tokens.

## Components
- `Topbar.jsx` — sticky 56px glass topbar with logo + nav + workspace switcher
- `WardSidebar.jsx` — left rail listing agent "patients" with status pills
- `OperatingTable.jsx` — central viewport (3D placeholder + state controls)
- `VitalsPanel.jsx` — right rail with confidence, personality, knowledge tabs
- `Composer.jsx` — bottom suture-tool chat rail with teal pulse
- `StatusBar.jsx` — 28px footer showing current job

## Run
Open `index.html`. Click agents in the ward to switch the table. Type into the composer to see the agent "think".
