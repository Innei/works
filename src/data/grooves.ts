import type { Groove } from '../audio/sequencer'
import type { SceneKey } from './projects'

const _ = null

export const grooves: Record<SceneKey, Groove> = {
  overview: {
    bpm: 90,
    swing: 0,
    pad: [50, 57, 61, 64],
    voices: { kick: 'x.......x.......' },
    bass: [38, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    arp: [_, _, _, _, _, _, 69, _, _, _, _, _, _, _, 73, _],
  },
  yohaku: {
    bpm: 72,
    swing: 0,
    pad: [47, 54, 59, 64],
    voices: {},
    arp: [71, _, _, _, _, _, _, _, _, _, 66, _, _, _, _, _],
  },
  'mx-space': {
    bpm: 118,
    swing: 0,
    pad: [55, 59, 62, 66],
    voices: { kick: 'x...x...x...x...', hat: '..x...x...x...x.' },
    bass: [43, _, 43, _, 43, _, 50, _, 43, _, 43, _, 46, _, 50, _],
    sidechain: true,
  },
  afilmory: {
    bpm: 84,
    swing: 0.35,
    pad: [57, 61, 64, 68],
    voices: { kick: 'x......x..x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
    bass: [45, _, _, _, _, _, _, 45, _, _, 52, _, _, _, _, _],
    crackle: true,
  },
  yoake: {
    bpm: 96,
    swing: 0,
    pad: [54, 57, 61, 68],
    voices: { kick: 'x...x...x...x...', shaker: '..x...x...x...x.' },
    arp: [73, _, _, _, _, _, 76, _, _, _, _, _, 78, _, _, _],
    filterRise: true,
  },
  lody: {
    bpm: 100,
    swing: 0,
    pad: [54, 57, 61, 62],
    voices: { kick: 'x...x...x...x...', hat: '..x...x...x...x.' },
    bass: [50, _, _, 57, _, _, 62, _, 50, _, _, 57, _, 62, _, 57],
    sidechain: true,
  },
  musubicho: {
    bpm: 110,
    swing: 0,
    pad: [55, 59, 62, 69],
    voices: { kick: 'x.....x...x.....', clap: '....x.......x...' },
    arp: [67, 74, 69, 76, 71, 78, 69, 76, 67, 74, 71, 79, 69, 76, 67, 74],
  },
  kagura: {
    bpm: 124,
    swing: 0,
    pad: [52, 57, 59, 64],
    voices: { kick: 'x.......x.......', tom: 'X..x..x...X..x..', shaker: 'x.x.x.x.x.x.x.x.' },
    bass: [40, _, _, _, _, _, _, _, _, _, 40, _, _, _, _, _],
    arp: [_, _, 76, _, _, _, _, _, 79, _, _, _, _, _, 81, _],
  },
  'torrent-vibe': {
    bpm: 128,
    swing: 0,
    pad: [59, 62, 66, 69],
    voices: { kick: 'x...x...x...x...', hat: '.xxx.xxx.xxx.xxx', clap: '....x.......x...' },
    bass: [_, 47, _, 47, _, 47, _, 47, _, 47, _, 47, _, 50, _, 50],
    arp: [71, 74, 78, 83, 71, 74, 78, 83, 83, 83, 78, 74, 71, 74, 71, 71],
  },
  kansoku: {
    bpm: 120,
    swing: 0,
    pad: [54, 61, 64, 71],
    voices: { kick: 'x...x...x...x...', hat: 'x.x.x.x.x.x.x.x.', ping: '......x.......x.' },
    bass: [30, _, _, 30, _, _, _, _, _, _, 30, _, _, _, _, _],
  },
  libraries: {
    bpm: 90,
    swing: 0,
    pad: [50, 57, 62, 64],
    voices: {},
    arp: [81, _, _, _, 76, _, _, _, 78, _, _, _, 73, _, _, _],
    arpVoice: 'chime',
  },
}
