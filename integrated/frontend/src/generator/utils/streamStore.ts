export interface StreamSection {
  heading: string;
  content: string;
}

let sections: StreamSection[] = [];
let done = false;
let listeners: (() => void)[] = [];

export function pushSection(sec: StreamSection) {
  sections = [...sections, sec];
  listeners.forEach((fn) => fn());
}

export function markDone() {
  done = true;
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((f) => f !== fn);
  };
}

export function getState() {
  return { sections, done };
}

export function reset() {
  sections = [];
  done = false;
  listeners = [];
}
