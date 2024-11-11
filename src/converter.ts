import { EventListener } from "@9h/lib";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

const isValidAudioFile = async (file: File) => {
  const context = new AudioContext();

  const buffer = await file.arrayBuffer();
  try {
    await context.decodeAudioData(buffer);
    return true;
  } catch (error) {
    return false;
  }
};

const buildCmd = (input: string, output: string, bitrate: string = "192k") => {
  let cmd = [];

  // input file
  cmd.push("-i");
  cmd.push(input);

  // disable video
  cmd.push("-vn");

  // bitrate
  cmd.push("-b:a");
  cmd.push(bitrate);

  // TODO: VBR
  // -q:a 0 (NB this is VBR from 220 to 260

  // output
  cmd.push(output);

  return cmd;
};

type ConverterEvent = {
  type: "progress";
  percent: number;
};

export type BitrateOption = {
  type: "fixed";
  bitrate: number;
};
//   | {
//       type: "variable";
//       quality: number;
//     };

export const bitrateOptions: BitrateOption[] = [
  { type: "fixed", bitrate: 32 },
  { type: "fixed", bitrate: 96 },
  { type: "fixed", bitrate: 128 },
  { type: "fixed", bitrate: 192 },
  { type: "fixed", bitrate: 256 },
  { type: "fixed", bitrate: 320 },
];

export class Converter extends EventListener<ConverterEvent> {
  ffmpeg = new FFmpeg();
  bitrate = bitrateOptions.at(-1)!;

  constructor() {
    super();
  }

  async load() {
    this.ffmpeg.on("progress", (e) => {
      this.notify({ type: "progress", percent: e.progress });
    });

    const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";

    // toBlobURL is used to bypass CORS issue, urls with the same domain can be used directly.
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
      workerURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        "text/javascript"
      ),
    });
  }

  async convert(file: File): Promise<Uint8Array> {
    if (!(await isValidAudioFile(file))) {
      throw "not a valid audio file";
    }

    const id = window.crypto.randomUUID();

    const buffer = await file.arrayBuffer();

    const cmd = buildCmd(id, `${id}.mp3`, `${this.bitrate.bitrate}k`);

    await this.ffmpeg.writeFile(id, new Uint8Array(buffer));
    await this.ffmpeg.exec(cmd);
    const fileData = await this.ffmpeg.readFile(`${id}.mp3`);
    const data = new Uint8Array(fileData as ArrayBuffer);

    return data;
  }

  setBitrate(bitrateOption: BitrateOption) {
    this.bitrate = bitrateOption;
  }
}
