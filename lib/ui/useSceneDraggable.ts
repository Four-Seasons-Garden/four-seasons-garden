"use client";

import { useEffect, useRef, useState } from "react";
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";

export type DragPosition = {
  x: number;
  y: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  baseLeft: number;
  baseTop: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  moved: boolean;
};

const DRAG_STORAGE_PREFIX = "four-seasons:front-page-drag:v2";
const DRAG_THRESHOLD = 4;

export function clamp(value: number, min: number, max: number) {
  if (min > max) return value;
  return Math.min(max, Math.max(min, value));
}

function dragStorageKey(key: string) {
  if (typeof window === "undefined") return `${DRAG_STORAGE_PREFIX}:desktop:${key}`;
  const scope = window.matchMedia("(max-width: 860px)").matches ? "mobile" : "desktop";
  return `${DRAG_STORAGE_PREFIX}:${scope}:${key}`;
}

export function readStoredDragPosition(key: string): DragPosition {
  if (typeof window === "undefined") return { x: 0, y: 0 };

  try {
    const parsed = JSON.parse(window.localStorage.getItem(dragStorageKey(key)) ?? "");
    if (
      typeof parsed?.x === "number" &&
      Number.isFinite(parsed.x) &&
      typeof parsed?.y === "number" &&
      Number.isFinite(parsed.y)
    ) {
      return { x: parsed.x, y: parsed.y };
    }
  } catch {
    return { x: 0, y: 0 };
  }

  return { x: 0, y: 0 };
}

export function writeStoredDragPosition(key: string, position: DragPosition) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(dragStorageKey(key), JSON.stringify(position));
  } catch {
    // Dragging should still work even if the browser blocks localStorage.
  }
}

export function useSceneDraggable(key: string) {
  const [position, setPosition] = useState<DragPosition>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const positionRef = useRef(position);
  const dragRef = useRef<DragState | null>(null);
  const dragElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = readStoredDragPosition(key);
      positionRef.current = stored;
      setPosition(stored);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [key]);

  function commitPosition(next: DragPosition) {
    positionRef.current = next;
    setPosition(next);
  }

  function setDragElement(element: HTMLElement | null) {
    dragElementRef.current = element;
  }

  function onHandlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0) return;

    const element = dragElementRef.current;
    if (!element) return;

    const parent = element.offsetParent instanceof HTMLElement
      ? element.offsetParent
      : element.parentElement;
    const elementRect = element.getBoundingClientRect();
    const parentRect = parent?.getBoundingClientRect() ?? {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
    };
    const origin = positionRef.current;
    const baseLeft = elementRect.left - origin.x;
    const baseTop = elementRect.top - origin.y;
    const margin = 8;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: origin.x,
      originY: origin.y,
      baseLeft,
      baseTop,
      minX: parentRect.left + margin - baseLeft,
      maxX: parentRect.right - margin - elementRect.width - baseLeft,
      minY: parentRect.top + margin - baseTop,
      maxY: parentRect.bottom - margin - elementRect.height - baseTop,
      moved: false,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onHandlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) return;

    drag.moved = true;
    setDragging(true);
    event.preventDefault();

    commitPosition({
      x: clamp(drag.originX + deltaX, drag.minX, drag.maxX),
      y: clamp(drag.originY + deltaY, drag.minY, drag.maxY),
    });
  }

  function endDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    setDragging(false);
    if (drag.moved) writeStoredDragPosition(key, positionRef.current);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onHandleClick(event: ReactMouseEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  return {
    className: "draggable-scene-item",
    dataDragging: dragging ? "true" : undefined,
    setDragElement,
    style: {
      "--drag-x": `${position.x}px`,
      "--drag-y": `${position.y}px`,
    } as CSSProperties,
    handleProps: {
      "data-dragging": dragging ? "true" : undefined,
      onPointerDown: onHandlePointerDown,
      onPointerMove: onHandlePointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onClick: onHandleClick,
    },
  };
}
