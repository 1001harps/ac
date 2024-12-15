import { EventListener } from "@9h/lib";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

const assertUnreachable = (_: never) => {};

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

const buildCmd = (
  input: string,
  output: string,
  bitrateOption: NonNullable<BitrateOption>
) => {
  let cmd = [];

  // input file
  cmd.push("-i");
  cmd.push(input);

  // disable video
  cmd.push("-vn");

  switch (bitrateOption.type) {
    case "constant":
      cmd.push("-b:a");
      cmd.push(`${bitrateOption.value}k`);
      break;

    case "variable":
      cmd.push("-q:a");
      cmd.push(`${bitrateOption.value}`);
      break;

    default:
      assertUnreachable(bitrateOption.type);
  }

  // output
  cmd.push(output);

  return cmd;
};

type ConverterEvent = {
  type: "progress";
  percent: number;
};

export type BitrateOptionType = "constant" | "variable";

export type BitrateOption = {
  type: BitrateOptionType;
  value: number;
  label: string;
};

export const bitrateOptions: BitrateOption[] = [
  // CBR
  { type: "constant", value: 320, label: "320 kbps" },
  { type: "constant", value: 256, label: "256 kbps" },
  { type: "constant", value: 192, label: "192 kbps" },
  { type: "constant", value: 128, label: "128 kbps" },
  { type: "constant", value: 96, label: "96 kbps" },

  // VBR
  { type: "variable", value: 0, label: "220-260 kbps" },
  { type: "variable", value: 1, label: "190-250 kbps" },
  { type: "variable", value: 2, label: "170-210 kbps" },
  { type: "variable", value: 3, label: "150-195 kbps" },
  { type: "variable", value: 4, label: "140-185 kbps" },
  { type: "variable", value: 5, label: "120-150 kbps" },
  { type: "variable", value: 6, label: "100-130 kbps" },
  { type: "variable", value: 7, label: "80-120 kbps" },
  { type: "variable", value: 8, label: "70-105 kbps" },
  { type: "variable", value: 9, label: "45-85 kbps" },
];

export class Converter extends EventListener<ConverterEvent> {
  ffmpeg = new FFmpeg();
  bitrateOption = bitrateOptions.at(0)!;

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

    const cmd = buildCmd(id, `${id}.mp3`, this.bitrateOption);

    await this.ffmpeg.writeFile(id, new Uint8Array(buffer));
    await this.ffmpeg.exec(cmd);
    const fileData = await this.ffmpeg.readFile(`${id}.mp3`);
    const data = new Uint8Array(fileData as ArrayBuffer);

    return data;
  }

  setBitrateOption(bitrateOption: BitrateOption) {
    this.bitrateOption = bitrateOption;
  }
}
