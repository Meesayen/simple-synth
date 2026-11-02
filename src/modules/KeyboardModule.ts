import { ref, type Ref } from 'vue';
import type { Control } from '../controls/Control';
import type { CanvasHost } from '../canvas/CanvasHost';
import { ModuleBase } from './ModuleBase';

export interface KeyboardModuleOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  startNote?: number;
  octaves?: number;
  host?: CanvasHost;
  onNoteOn?: (note: number, velocity: number) => void;
  onNoteOff?: (note: number) => void;
}

interface Key {
  note: number;
  black: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

export class KeyboardModule extends ModuleBase {
  // State
  note: Ref<number | null>;
  velocity: Ref<number>;

  private keys: Key[] = [];
  private startNote: number;
  private whiteKeyWidth = 20;
  private whiteKeyHeight = 80;
  private blackKeyWidth = 12;
  private blackKeyHeight = 50;
  private onNoteOn?: (note: number, velocity: number) => void;
  private onNoteOff?: (note: number) => void;
  private pressedNotes = new Set<number>();
  private keyToNote = new Map<string, number>();
  private pointerPressedNote: number | null = null;
  private pressedKeys = new Set<string>();
  private handleKeyDown!: (e: KeyboardEvent) => void;
  private handleKeyUp!: (e: KeyboardEvent) => void;
  private keyMap: Record<string, number> = {
    KeyQ: 0,
    KeyW: 2,
    KeyE: 4,
    KeyR: 5,
    KeyT: 7,
    KeyY: 9,
    KeyU: 11,
    KeyI: 12,
    KeyO: 14,
    KeyP: 16,
    Digit2: 1,
    Digit3: 3,
    Digit5: 6,
    Digit6: 8,
    Digit7: 10,
    Digit9: 13,
    Digit0: 15,
  };

  constructor(options: KeyboardModuleOptions) {
    super(options.x, options.y, options.width ?? 300, options.height ?? 90, options.host);

    this.startNote = options.startNote ?? 48; // C3
    const octaves = options.octaves ?? 2;
    this.onNoteOn = options.onNoteOn;
    this.onNoteOff = options.onNoteOff;

    this.note = ref<number | null>(null);
    this.velocity = ref(0.8);

    // Build keys
    const blackOffsets = [1, 3, 6, 8, 10]; // semitones within octave that are black
    let whiteIndex = 0;
    for (let o = 0; o < octaves; o++) {
      for (let s = 0; s < 12; s++) {
        const note = this.startNote + o * 12 + s;
        const isBlack = blackOffsets.includes(s);
        if (isBlack) {
          // position between previous white and next white
          const prevWhite = whiteIndex - 1;
          const x = prevWhite * this.whiteKeyWidth + this.whiteKeyWidth - this.blackKeyWidth / 2;
          this.keys.push({
            note,
            black: true,
            x,
            y: 0,
            w: this.blackKeyWidth,
            h: this.blackKeyHeight,
          });
        } else {
          const x = whiteIndex * this.whiteKeyWidth;
          this.keys.push({
            note,
            black: false,
            x,
            y: 0,
            w: this.whiteKeyWidth,
            h: this.whiteKeyHeight,
          });
          whiteIndex++;
        }
      }
    }

    const totalWhite = whiteIndex;
    this.width = totalWhite * this.whiteKeyWidth;
    this.height = this.whiteKeyHeight;

    // Keyboard shortcuts
    this.handleKeyDown = this.onKeyDown.bind(this);
    this.handleKeyUp = this.onKeyUp.bind(this);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  // Override childControls to empty (we render keys directly)
  get childControls(): Control[] {
    return [];
  }

  hitTest(px: number, py: number): boolean {
    // Check black keys first (on top)
    for (let i = this.keys.length - 1; i >= 0; i--) {
      const k = this.keys[i];
      if (
        k.black &&
        px >= this.x + k.x &&
        px <= this.x + k.x + k.w &&
        py >= this.y + k.y &&
        py <= this.y + k.y + k.h
      ) {
        return true;
      }
    }
    for (const k of this.keys) {
      if (
        !k.black &&
        px >= this.x + k.x &&
        px <= this.x + k.x + k.w &&
        py >= this.y + k.y &&
        py <= this.y + k.y + k.h
      ) {
        return true;
      }
    }
    return false;
  }

  onPointerDown(_e: PointerEvent, px: number, py: number): void {
    // Find key
    let found: Key | null = null;
    for (let i = this.keys.length - 1; i >= 0; i--) {
      const k = this.keys[i];
      if (
        px >= this.x + k.x &&
        px <= this.x + k.x + k.w &&
        py >= this.y + k.y &&
        py <= this.y + k.y + k.h
      ) {
        found = k;
        break;
      }
    }
    if (!found) return;
    this.pointerPressedNote = found.note;
    this.pressedNotes.add(found.note);
    this.note.value = found.note;
    // Velocity from vertical position (top = louder)
    const relY = (py - (this.y + found.y)) / found.h;
    const vel = Math.max(0.1, 0.3 + relY * 0.7);
    this.velocity.value = vel;
    this.onNoteOn?.(found.note, vel);
  }

  onPointerUp(): void {
    if (this.pointerPressedNote !== null) {
      this.onNoteOff?.(this.pointerPressedNote);
      this.pressedNotes.delete(this.pointerPressedNote);
      this.pointerPressedNote = null;
      this.note.value =
        this.pressedNotes.size > 0 ? [...this.pressedNotes][this.pressedNotes.size - 1] : null;
    }
  }

  onPointerMove(): void {
    // no-op
  }

  render(ctx: CanvasRenderingContext2D): void {
    // White keys
    for (const k of this.keys) {
      if (k.black) continue;
      const pressed = this.pressedNotes.has(k.note);
      ctx.fillStyle = pressed ? '#818cf8' : '#f1f5f9';
      ctx.fillRect(this.x + k.x, this.y + k.y, k.w, k.h);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.strokeRect(this.x + k.x, this.y + k.y, k.w, k.h);
    }
    // Black keys
    for (const k of this.keys) {
      if (!k.black) continue;
      const pressed = this.pressedNotes.has(k.note);
      ctx.fillStyle = pressed ? '#6366f1' : '#0f172a';
      ctx.fillRect(this.x + k.x, this.y + k.y, k.w, k.h);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.strokeRect(this.x + k.x, this.y + k.y, k.w, k.h);
    }

    // Debug hitbox
    // (none)
  }

  boundingBox(): { x: number; y: number; w: number; h: number } {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  hitbox() {
    return { type: 'rect' as const, x: this.x, y: this.y, w: this.width, h: this.height };
  }

  private computeNote(key: string, shift: boolean): number | null {
    const semitone = this.keyMap[key];
    if (semitone === undefined) return null;
    const base = this.startNote; // C3
    return base + semitone + (shift ? 12 : 0);
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return;
    const semitone = this.keyMap[e.code];
    if (semitone === undefined) return;
    e.preventDefault();
    if (this.pressedKeys.has(e.code)) return;
    this.pressedKeys.add(e.code);
    const note = this.computeNote(e.code, e.shiftKey);
    if (note === null) return;
    this.keyToNote.set(e.code, note);
    this.pressedNotes.add(note);
    this.note.value = note;
    const vel = 0.8;
    this.velocity.value = vel;
    this.onNoteOn?.(note, vel);
  }

  private onKeyUp(e: KeyboardEvent): void {
    if (!this.pressedKeys.has(e.code)) return;
    this.pressedKeys.delete(e.code);
    const note = this.keyToNote.get(e.code) ?? this.computeNote(e.code, e.shiftKey);
    this.keyToNote.delete(e.code);
    if (note === null) return;
    this.pressedNotes.delete(note);
    this.onNoteOff?.(note);
    this.note.value =
      this.pressedNotes.size > 0 ? [...this.pressedNotes][this.pressedNotes.size - 1] : null;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}
