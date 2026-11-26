# Pages — dependency trees

All pages are rendered inside the shell: App.tsx → src/navigation/RootTabs.tsx. Non-UI deps (store/repositories/db) are listed for completeness; for design context only the UI files + utils/formatters matter.

## Hari Ini (TodayScreen)
Entry: src/screens/TodayScreen.tsx
Dependencies:
- src/components/SyncStatusHeader.tsx
  - src/store/useAppStore.ts
  - src/theme/useTheme.ts
- src/store/useAppStore.ts (data: tasks, todayCompletions, subscriptions)
- src/utils/formatters.ts
- src/utils/id.ts
- src/theme/useTheme.ts

## Tugasan (TasksScreen)
Entry: src/screens/TasksScreen.tsx
Dependencies:
- src/components/SyncStatusHeader.tsx
- src/store/useAppStore.ts
- src/types/models.ts
- src/utils/formatters.ts
- src/theme/useTheme.ts

## Langganan (SubscriptionsScreen)
Entry: src/screens/SubscriptionsScreen.tsx
Dependencies:
- src/components/SyncStatusHeader.tsx
- src/components/DatePickerField.tsx
- src/store/useAppStore.ts
- src/types/models.ts
- src/utils/formatters.ts
- src/utils/id.ts
- src/theme/useTheme.ts

## Diari (DiaryScreen)
Entry: src/screens/DiaryScreen.tsx
Dependencies:
- src/components/SyncStatusHeader.tsx
- src/components/DatePickerField.tsx
- src/store/useAppStore.ts
- src/utils/formatters.ts
- src/utils/id.ts
- src/theme/useTheme.ts

Shared non-UI: src/store/useAppStore.ts → src/repositories/*, src/db/*, src/services/syncService.ts.
