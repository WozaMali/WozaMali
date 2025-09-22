## 2025-09-22

### Added
- Office app: multiple TypeScript fixes; successful Next.js 15 build.
- Collector app: successful production build; dependency updates.
- Root app: installed missing UI and type packages; export build green.

### Changed
- Root `tsconfig.json`: exclude `WozaMaliOffice/**` and `WozaMaliCollector/**` from root type-check.
- Providers: updated React Query option from `cacheTime` to `gcTime` (v5).
- Fixed chart utilities typing to align with Recharts types.
- Adjusted theme indicator to support "system" mode safely with React 19 types.

### Fixed
- Green Scholar Fund: normalized types for donations and PET contributions; added manual submit for PET collections.
- Address service: ensured returned objects satisfy `Township` shape.
- Push client: cast VAPID key to `BufferSource` for subscription.
- Unified wallet hooks/services: corrected next-tier computation and types.
- Withdrawal service: removed `supabase.sql` usage; perform safe balance update.

### CI/Release
- Updated Office submodule to latest `main` and bumped pointer in root.


