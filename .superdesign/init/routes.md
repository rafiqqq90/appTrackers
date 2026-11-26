# Routes

Config-based: bottom tabs in `src/navigation/RootTabs.tsx` (full source in layouts.md). No URL routing; web serves all at `/`.

| Tab name | Component | File | Summary |
|---|---|---|---|
| Hari Ini (default) | TodayScreen | src/screens/TodayScreen.tsx | Dashboard: indigo summary card (X / Y tasks done), today's scheduled tasks (tap to toggle done, time range), subscription billing warnings within 7 days (amber cards w/ amount), quick-link card to Diary. |
| Tugasan | TasksScreen | src/screens/TasksScreen.tsx | Folder-based task manager: folder list/breadcrumb, nested folders, tasks with recurrence (days of week), time blocks, done-today state; FAB + bottom-sheet modals for folder & task create/edit/delete. |
| Langganan | SubscriptionsScreen | src/screens/SubscriptionsScreen.tsx | Subscription tracker: monthly total summary, list of subscriptions (name, amount, cycle, next billing, payment method, status); FAB + modal form. |
| Diari | DiaryScreen | src/screens/DiaryScreen.tsx | Diary: offline search bar (keyword/#tag), entry cards (date, title, content, tags); FAB + modal editor. |
