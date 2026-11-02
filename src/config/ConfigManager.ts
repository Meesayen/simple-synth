import { PRESETS } from './presets';

export interface SynthConfig {
  name: string;
  data: Record<string, unknown>;
  savedAt: number;
}

const DB_NAME = 'synth-configs';
const STORE_NAME = 'configs';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'name' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function init(): Promise<void> {
  await openDB();
}

export async function seedDefaults(): Promise<void> {
  const names = await list();
  for (const preset of PRESETS) {
    if (!names.includes(preset.name)) {
      await save(preset.name, preset.data);
    }
  }
}

export async function list(): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAllKeys();
    req.onsuccess = () => resolve((req.result as string[]).sort());
    req.onerror = () => reject(req.error);
  });
}

export async function save(name: string, data: Record<string, unknown>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const cfg: SynthConfig = { name, data, savedAt: Date.now() };
    const req = store.put(cfg);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function load(name: string): Promise<Record<string, unknown> | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(name);
    req.onsuccess = () => {
      const cfg = req.result as SynthConfig | undefined;
      resolve(cfg ? cfg.data : null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function remove(name: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(name);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export function serialize(modules: {
  osc1: any;
  osc2: any;
  mix: any;
  filter: any;
  ampEnv: any;
  output: any;
  delay: any;
  reverb: any;
}): Record<string, unknown> {
  const o1 = modules.osc1;
  const o2 = modules.osc2;
  const m = modules.mix;
  const f = modules.filter;
  const e = modules.ampEnv;
  const out = modules.output;
  const d = modules.delay;
  const r = modules.reverb;
  return {
    osc1: {
      power: o1.power.value,
      waveform: o1.waveform.value,
      volume: o1.volume.value,
      pan: o1.pan.value,
      octave: o1.octave.value,
      detune: o1.detune.value,
    },
    osc2: {
      power: o2.power.value,
      waveform: o2.waveform.value,
      volume: o2.volume.value,
      pan: o2.pan.value,
      octave: o2.octave.value,
      detune: o2.detune.value,
    },
    mix: { mix: m.mix.value, master: m.master.value },
    filter: {
      filterType: f.filterType.value,
      cutoff: f.cutoff.value,
      resonance: f.resonance.value,
      slope: f.slope.value,
    },
    ampEnv: {
      attack: e.attack.value,
      decay: e.decay.value,
      sustain: e.sustain.value,
      release: e.release.value,
    },
    output: { volume: out.volume.value, active: out.active.value },
    delay: {
      time: d.time.value,
      feedback: d.feedback.value,
      mix: d.mix.value,
      tone: d.tone.value,
      enabled: d.enabled.value,
    },
    reverb: {
      mix: r.mix.value,
      decay: r.decay.value,
      size: r.size.value,
      tone: r.tone.value,
      enabled: r.enabled.value,
    },
  };
}

export function deserialize(
  data: Record<string, unknown>,
  modules: {
    osc1: any;
    osc2: any;
    mix: any;
    filter: any;
    ampEnv: any;
    output: any;
    delay: any;
    reverb: any;
  },
): void {
  const o1 = modules.osc1;
  const o2 = modules.osc2;
  const m = modules.mix;
  const f = modules.filter;
  const e = modules.ampEnv;
  const out = modules.output;
  const d = modules.delay;
  const r = modules.reverb;
  const d1 = (data.osc1 as any) ?? {};
  const d2 = (data.osc2 as any) ?? {};
  const dm = (data.mix as any) ?? {};
  const df = (data.filter as any) ?? {};
  const de = (data.ampEnv as any) ?? {};
  const do_ = (data.output as any) ?? {};
  const dd = (data.delay as any) ?? {};
  const dr = (data.reverb as any) ?? {};
  if (d1.power !== undefined) o1.power.value = d1.power;
  if (d1.waveform !== undefined) o1.waveform.value = d1.waveform;
  if (d1.volume !== undefined) o1.volume.value = d1.volume;
  if (d1.pan !== undefined) o1.pan.value = d1.pan;
  if (d1.octave !== undefined) o1.octave.value = d1.octave;
  if (d1.detune !== undefined) o1.detune.value = d1.detune;
  if (d2.power !== undefined) o2.power.value = d2.power;
  if (d2.waveform !== undefined) o2.waveform.value = d2.waveform;
  if (d2.volume !== undefined) o2.volume.value = d2.volume;
  if (d2.pan !== undefined) o2.pan.value = d2.pan;
  if (d2.octave !== undefined) o2.octave.value = d2.octave;
  if (d2.detune !== undefined) o2.detune.value = d2.detune;
  if (dm.mix !== undefined) m.mix.value = dm.mix;
  if (dm.master !== undefined) m.master.value = dm.master;
  if (df.filterType !== undefined) f.filterType.value = df.filterType;
  if (df.cutoff !== undefined) f.cutoff.value = df.cutoff;
  if (df.resonance !== undefined) f.resonance.value = df.resonance;
  if (df.slope !== undefined) f.slope.value = df.slope;
  if (de.attack !== undefined) e.attack.value = de.attack;
  if (de.decay !== undefined) e.decay.value = de.decay;
  if (de.sustain !== undefined) e.sustain.value = de.sustain;
  if (de.release !== undefined) e.release.value = de.release;
  if (do_.volume !== undefined) out.volume.value = do_.volume;
  if (do_.active !== undefined) out.active.value = do_.active;
  if (dd.time !== undefined) d.time.value = dd.time;
  if (dd.feedback !== undefined) d.feedback.value = dd.feedback;
  if (dd.mix !== undefined) d.mix.value = dd.mix;
  if (dd.tone !== undefined) d.tone.value = dd.tone;
  if (dd.enabled !== undefined) d.enabled.value = dd.enabled;
  if (dr.mix !== undefined) r.mix.value = dr.mix;
  if (dr.decay !== undefined) r.decay.value = dr.decay;
  if (dr.size !== undefined) r.size.value = dr.size;
  if (dr.tone !== undefined) r.tone.value = dr.tone;
  if (dr.enabled !== undefined) r.enabled.value = dr.enabled;
}
