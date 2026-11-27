import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Folder,
  GripVertical,
} from 'lucide-react-native';
import type { TaskFolder } from '../types/models';
import { useThemeColors } from '../theme/useTheme';

const GAP = 10;
const DEFAULT_ROW_HEIGHT = 62;
const LONG_PRESS_MS = 230;
const CANCEL_MOVE_THRESHOLD = 8;

interface FolderCount {
  subfolderCount: number;
  taskCount: number;
}

interface DraggableFolderListProps {
  folders: TaskFolder[];
  getCounts: (folderId: string) => FolderCount;
  onOpenFolder: (folderId: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onDragActiveChange?: (dragging: boolean) => void;
}

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (from === to) return arr;
  const copy = arr.slice();
  const [picked] = copy.splice(from, 1);
  copy.splice(to, 0, picked);
  return copy;
}

export function DraggableFolderList({
  folders,
  getCounts,
  onOpenFolder,
  onReorder,
  onDragActiveChange,
}: DraggableFolderListProps) {
  const { isDark, colors } = useThemeColors();

  const [ordered, setOrdered] = useState<TaskFolder[]>(folders);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [reorderMode, setReorderMode] = useState(false);

  const rowHeightRef = useRef<number>(DEFAULT_ROW_HEIGHT);
  const dragTranslateY = useRef(new Animated.Value(0)).current;

  // Mutable refs for gesture tracking without stale closures
  const foldersRef = useRef<TaskFolder[]>(folders);
  const orderedRef = useRef<TaskFolder[]>(folders);
  const onOpenRef = useRef(onOpenFolder);
  const onReorderRef = useRef(onReorder);
  const onDragChangeRef = useRef(onDragActiveChange);
  const reorderModeRef = useRef(reorderMode);

  foldersRef.current = folders;
  onOpenRef.current = onOpenFolder;
  onReorderRef.current = onReorder;
  onDragChangeRef.current = onDragActiveChange;
  reorderModeRef.current = reorderMode;

  useEffect(() => {
    if (!draggingId) {
      setOrdered(folders);
      orderedRef.current = folders;
    }
  }, [folders, draggingId]);

  const setDraggingState = (id: string | null) => {
    setDraggingId(id);
    onDragChangeRef.current?.(Boolean(id));
  };

  const moveByStep = (index: number, delta: -1 | 1) => {
    const nextIdx = index + delta;
    if (nextIdx < 0 || nextIdx >= ordered.length) return;
    const next = moveItem(ordered, index, nextIdx);
    setOrdered(next);
    orderedRef.current = next;
    onReorder(next.map((f) => f.id));
  };

  return (
    <View>
      <View className="flex-row items-center justify-between px-0.5 mb-2">
        <View className="flex-row items-center gap-2">
          <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Senarai Folder
          </Text>
          <Text
            style={{ fontVariant: ['tabular-nums'] }}
            className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500"
          >
            {ordered.length}
          </Text>
        </View>

        {reorderMode ? (
          <Pressable
            onPress={() => setReorderMode(false)}
            className="px-2.5 py-1 rounded-md bg-zinc-900 dark:bg-[#F4F4F5]"
          >
            <Text className="text-[11px] font-semibold text-white dark:text-[#0A0A0B]">
              Selesai Susun
            </Text>
          </Pressable>
        ) : ordered.length > 1 ? (
          <Text className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Tekan lama untuk ubah posisi
          </Text>
        ) : null}
      </View>

      <View style={styles.listGap}>
        {ordered.map((folder, index) => {
          const isDragging = draggingId === folder.id;
          const counts = getCounts(folder.id);

          return (
            <FolderDraggableCard
              key={folder.id}
              folder={folder}
              index={index}
              totalCount={ordered.length}
              counts={counts}
              isDragging={isDragging}
              isDark={isDark}
              colors={colors}
              reorderMode={reorderMode}
              dragTranslateY={dragTranslateY}
              rowHeightRef={rowHeightRef}
              orderedRef={orderedRef}
              setOrdered={setOrdered}
              setDraggingState={setDraggingState}
              setReorderMode={setReorderMode}
              reorderModeRef={reorderModeRef}
              onOpenRef={onOpenRef}
              onReorderRef={onReorderRef}
              onMoveStep={moveByStep}
            />
          );
        })}
      </View>
    </View>
  );
}

interface FolderCardProps {
  folder: TaskFolder;
  index: number;
  totalCount: number;
  counts: FolderCount;
  isDragging: boolean;
  isDark: boolean;
  colors: ReturnType<typeof useThemeColors>['colors'];
  reorderMode: boolean;
  dragTranslateY: Animated.Value;
  rowHeightRef: React.MutableRefObject<number>;
  orderedRef: React.MutableRefObject<TaskFolder[]>;
  setOrdered: React.Dispatch<React.SetStateAction<TaskFolder[]>>;
  setDraggingState: (id: string | null) => void;
  setReorderMode: React.Dispatch<React.SetStateAction<boolean>>;
  reorderModeRef: React.MutableRefObject<boolean>;
  onOpenRef: React.MutableRefObject<(id: string) => void>;
  onReorderRef: React.MutableRefObject<(ids: string[]) => void>;
  onMoveStep: (index: number, delta: -1 | 1) => void;
}

function FolderDraggableCard({
  folder,
  index,
  totalCount,
  counts,
  isDragging,
  isDark,
  colors,
  reorderMode,
  dragTranslateY,
  rowHeightRef,
  orderedRef,
  setOrdered,
  setDraggingState,
  setReorderMode,
  reorderModeRef,
  onOpenRef,
  onReorderRef,
  onMoveStep,
}: FolderCardProps) {
  const folderIdRef = useRef(folder.id);
  folderIdRef.current = folder.id;

  const gestureStateRef = useRef<{
    timer: ReturnType<typeof setTimeout> | null;
    activeDrag: boolean;
    canceled: boolean;
    didSwap: boolean;
    originIndex: number;
    currentTargetIndex: number;
    baseOrder: TaskFolder[];
    startPageY: number;
  }>({
    timer: null,
    activeDrag: false,
    canceled: false,
    didSwap: false,
    originIndex: 0,
    currentTargetIndex: 0,
    baseOrder: [],
    startPageY: 0,
  });

  const clearTimer = () => {
    if (gestureStateRef.current.timer) {
      clearTimeout(gestureStateRef.current.timer);
      gestureStateRef.current.timer = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const beginPress = (startY: number) => {
    clearTimer();
    const currentList = orderedRef.current;
    const originIdx = currentList.findIndex((f) => f.id === folderIdRef.current);
    if (originIdx < 0) return;

    const activateImmediately = reorderModeRef.current && currentList.length > 1;

    gestureStateRef.current = {
      timer: null,
      activeDrag: false,
      canceled: false,
      didSwap: false,
      originIndex: originIdx,
      currentTargetIndex: originIdx,
      baseOrder: currentList.slice(),
      startPageY: startY,
    };

    const startDragging = () => {
      if (gestureStateRef.current.canceled) return;
      gestureStateRef.current.activeDrag = true;
      dragTranslateY.setValue(0);
      setDraggingState(folderIdRef.current);
      if (Platform.OS !== 'web') {
        try {
          Vibration.vibrate(25);
        } catch {
          // ignore if vibration unsupported
        }
      }
    };

    if (activateImmediately) {
      startDragging();
    } else {
      gestureStateRef.current.timer = setTimeout(startDragging, LONG_PRESS_MS);
    }
  };

  const updateMove = (dy: number, dx: number) => {
    const gs = gestureStateRef.current;
    if (gs.canceled) return;

    if (!gs.activeDrag) {
      if (Math.abs(dy) > CANCEL_MOVE_THRESHOLD || Math.abs(dx) > CANCEL_MOVE_THRESHOLD) {
        gs.canceled = true;
        clearTimer();
      }
      return;
    }

    const stride = rowHeightRef.current + GAP;
    const maxIdx = Math.max(0, gs.baseOrder.length - 1);
    const targetIdx = Math.max(
      0,
      Math.min(maxIdx, Math.round(gs.originIndex + dy / stride))
    );

    if (targetIdx !== gs.currentTargetIndex) {
      gs.currentTargetIndex = targetIdx;
      gs.didSwap = true;
      const nextOrder = moveItem(gs.baseOrder, gs.originIndex, targetIdx);
      orderedRef.current = nextOrder;
      setOrdered(nextOrder);
    }

    const residual = dy - (gs.currentTargetIndex - gs.originIndex) * stride;
    dragTranslateY.setValue(residual);
  };

  const finishPress = (wasAborted: boolean = false) => {
    const gs = gestureStateRef.current;
    const wasDragging = gs.activeDrag;
    const wasCanceled = gs.canceled || wasAborted;
    const didSwap = gs.didSwap;
    clearTimer();

    gs.activeDrag = false;
    gs.canceled = false;

    if (wasDragging) {
      dragTranslateY.setValue(0);
      setDraggingState(null);

      if (didSwap) {
        onReorderRef.current(orderedRef.current.map((f) => f.id));
      } else if (!reorderModeRef.current && orderedRef.current.length > 1) {
        // Long-pressed without dragging: reveal quick reorder arrows as an extra convenience
        setReorderMode(true);
      }
      return;
    }

    if (!wasCanceled && !reorderModeRef.current) {
      onOpenRef.current(folderIdRef.current);
    }
  };

  // Native gesture handler (iOS / Android)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => Platform.OS !== 'web',
      onMoveShouldSetPanResponder: () =>
        Platform.OS !== 'web' && gestureStateRef.current.activeDrag,
      onPanResponderTerminationRequest: () => !gestureStateRef.current.activeDrag,
      onPanResponderGrant: (evt) => {
        beginPress(evt.nativeEvent.pageY);
      },
      onPanResponderMove: (_, gestureState) => {
        updateMove(gestureState.dy, gestureState.dx);
      },
      onPanResponderRelease: () => {
        finishPress(false);
      },
      onPanResponderTerminate: () => {
        finishPress(true);
      },
    })
  ).current;

  // Web pointer handler (works cleanly with both desktop mouse & mobile web touch)
  const handleWebPointerDown = (e: any) => {
    if (Platform.OS !== 'web') return;
    // Ignore clicks on the explicit up/down quick buttons in reorderMode
    if (e.target?.closest?.('[data-step-btn="true"]')) return;
    if (typeof e.button === 'number' && e.button !== 0) return;

    const startX = e.clientX ?? e.nativeEvent?.pageX ?? 0;
    const startY = e.clientY ?? e.nativeEvent?.pageY ?? 0;
    beginPress(startY);

    const onMove = (ev: PointerEvent) => {
      if (gestureStateRef.current.activeDrag) {
        ev.preventDefault();
      }
      updateMove(ev.clientY - startY, ev.clientX - startX);
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };

    const onUp = () => {
      cleanup();
      finishPress(false);
    };

    const onCancel = () => {
      cleanup();
      finishPress(true);
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  };

  const webPointerProps: any =
    Platform.OS === 'web'
      ? {
          onPointerDown: handleWebPointerDown,
        }
      : panResponder.panHandlers;

  const wrapperAnimatedStyle: any = isDragging
    ? {
        zIndex: 50,
        elevation: 8,
        transform: [{ translateY: dragTranslateY }, { scale: 1.02 }],
        ...(Platform.OS === 'web'
          ? {
              cursor: 'grabbing',
              userSelect: 'none',
              touchAction: 'none',
              boxShadow: isDark
                ? '0 12px 28px rgba(0, 0, 0, 0.55)'
                : '0 10px 24px rgba(0, 0, 0, 0.12)',
            }
          : {}),
      }
    : Platform.OS === 'web'
    ? {
        cursor: reorderMode ? 'grab' : 'pointer',
        userSelect: 'none',
      }
    : undefined;

  return (
    <Animated.View
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height;
        if (h > 20) {
          rowHeightRef.current = h;
        }
      }}
      style={wrapperAnimatedStyle}
      {...webPointerProps}
    >
      <View
        className={`rounded-xl p-3.5 border flex-row items-center justify-between gap-3 ${
          isDragging
            ? 'bg-zinc-50 dark:bg-[#1C1C20] border-zinc-400 dark:border-zinc-500'
            : 'bg-white dark:bg-[#141416] border-zinc-200/90 dark:border-[#242428]'
        }`}
      >
        <View className="flex-row items-center gap-3 flex-1 min-w-0">
          {isDragging || reorderMode ? (
            <GripVertical size={16} color={colors.icon} />
          ) : null}

          <Folder size={18} color={colors.iconStrong} strokeWidth={1.8} />

          <View className="flex-1 min-w-0">
            <Text
              numberOfLines={1}
              className="text-[14px] font-semibold text-zinc-900 dark:text-[#F4F4F5]"
            >
              {folder.name}
            </Text>
            <Text
              style={{ fontVariant: ['tabular-nums'] }}
              className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5"
            >
              {counts.subfolderCount > 0
                ? `${counts.subfolderCount} subfolder · `
                : ''}
              {counts.taskCount} tugasan
            </Text>
          </View>
        </View>

        {reorderMode ? (
          <View
            {...(Platform.OS === 'web' ? ({ 'data-step-btn': 'true' } as any) : {})}
            className="flex-row items-center gap-1 shrink-0"
          >
            <Pressable
              disabled={index === 0}
              onPress={() => onMoveStep(index, -1)}
              className={`w-7 h-7 rounded-md border border-zinc-200 dark:border-[#2A2A32] bg-zinc-100 dark:bg-[#1C1C1F] items-center justify-center ${
                index === 0 ? 'opacity-35' : ''
              }`}
            >
              <ArrowUp size={14} color={colors.iconStrong} />
            </Pressable>
            <Pressable
              disabled={index === totalCount - 1}
              onPress={() => onMoveStep(index, 1)}
              className={`w-7 h-7 rounded-md border border-zinc-200 dark:border-[#2A2A32] bg-zinc-100 dark:bg-[#1C1C1F] items-center justify-center ${
                index === totalCount - 1 ? 'opacity-35' : ''
              }`}
            >
              <ArrowDown size={14} color={colors.iconStrong} />
            </Pressable>
          </View>
        ) : (
          <ChevronRight size={16} color={colors.icon} />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  listGap: {
    gap: GAP,
  },
});
