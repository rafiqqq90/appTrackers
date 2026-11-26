# Extractable components

## Layout Components

## BottomTabBar
- Source: `src/navigation/RootTabs.tsx`
- Category: layout
- Description: 4-item bottom tab bar (Hari Ini, Tugasan, Langganan, Diari) with lucide icons
- Extractable props: activeItem (string, default: "Hari Ini")
- Hardcoded: tab labels, icons (CalendarCheck2, CheckSquare, CreditCard, BookOpen), colors

## ScreenHeader
- Source: `src/components/SyncStatusHeader.tsx`
- Category: layout
- Description: Screen title + subtitle with theme toggle and sync-status badge
- Extractable props: title (string), subtitle (string), syncState ("synced" | "syncing" | "offline", default "synced")
- Hardcoded: badge labels/icons, theme icon

## Basic Components

## Card
- Source: inline pattern across src/screens/*.tsx
- Category: basic
- Description: Rounded bordered surface used for tasks, subscriptions, diary entries
- Extractable props: none
- Hardcoded: classes

## TaskRow
- Source: `src/screens/TodayScreen.tsx`, `src/screens/TasksScreen.tsx`
- Category: basic
- Description: Pressable task row with check circle, title, description, time range
- Extractable props: isDone (boolean, default false)
- Hardcoded: icons, layout

## FloatingActionButton
- Source: inline in TasksScreen / SubscriptionsScreen / DiaryScreen
- Category: basic
- Description: Bottom-right round primary button with Plus icon
- Extractable props: none
- Hardcoded: Plus icon

## BottomSheetModal
- Source: inline in screens (Modal + bg-black/40 scrim)
- Category: basic
- Description: Form sheet with title, close X, fields, primary save + danger delete
- Extractable props: title (string)
- Hardcoded: layout

## DatePickerField
- Source: `src/components/DatePickerField.tsx`
- Category: basic
- Description: Date input opening a calendar month grid modal
- Extractable props: value (string)
- Hardcoded: Malay month/day labels
