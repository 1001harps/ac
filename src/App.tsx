import {
  NativeSelectField,
  NativeSelectRoot,
} from "@/components/ui/native-select";
import { ProgressBar, ProgressRoot } from "@/components/ui/progress";
import { toaster, Toaster } from "@/components/ui/toaster";
import { Box, HStack, Stack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  BitrateOption,
  bitrateOptions,
  BitrateOptionType,
  Converter,
} from "./converter";
import { Queue } from "./queue";
import { createObjectUrl, downloadUrl, useInstance } from "./utils";

function App() {
  const converter = useInstance(() => new Converter());
  const queue = useInstance(
    () => new Queue(async (file: File) => converter.convert(file))
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => queue.push(files),
    accept: {
      "audio/*": [],
    },
  });

  const [progressPercent, setProgressPercent] = useState(0);
  const [bitrateType, setBitrateType] = useState<BitrateOptionType>("constant");
  const [bitrateOption, setBitrateOption] = useState<BitrateOption>(
    bitrateOptions.at(0)!
  );

  useEffect(() => {
    // init converter
    converter.load();

    // setup converter handlers
    converter.addEventListener((event) => {
      if (event.type === "progress") {
        setProgressPercent(event.percent * 100);
      }
    });

    // setup queue handlers
    queue.addEventListener((event) => {
      switch (event.type) {
        case "complete": {
          const name = event.task.name.slice(
            0,
            event.task.name.lastIndexOf(".")
          );
          const url = createObjectUrl(event.result, "audio/mpeg");

          downloadUrl(url, `${name}.mp3`);

          toaster.create({
            title: "Conversion complete",
            description: `Successfully converted "${event.task.name}"`,
            type: "success",
          });
          return;
        }

        case "error": {
          toaster.create({
            title: "Conversion failed",
            description: `Failed to convert "${event.task.name}". ${event.error}`,
            type: "error",
          });
          return;
        }
      }
    });
  }, []);

  useEffect(() => {
    converter.setBitrateOption(bitrateOption);
  }, [bitrateOption]);

  return (
    <Stack as="main">
      <Box as="nav" w="100%" h="100px" bg="black"></Box>

      <Box mx="auto" p="32px" maxW="800px" w="100%">
        <ProgressRoot colorPalette="blue" value={progressPercent} mb="20px">
          <ProgressBar></ProgressBar>
        </ProgressRoot>

        <HStack as="form" mb="32px">
          <label>format</label>
          <NativeSelectRoot size="sm" width="240px">
            <NativeSelectField items={["mp3"]}></NativeSelectField>
          </NativeSelectRoot>

          <label>type</label>
          <NativeSelectRoot size="sm" width="240px">
            <NativeSelectField
              items={["constant", "variable"]}
              onChange={(e) =>
                setBitrateType(e.target.value as BitrateOptionType)
              }
            ></NativeSelectField>
          </NativeSelectRoot>

          <label>bitrate</label>
          <NativeSelectRoot size="sm" width="240px">
            <NativeSelectField
              items={bitrateOptions
                .filter((x) => x.type === bitrateType)
                .map((opt) => ({
                  label: opt.label,
                  value: opt.value.toString(),
                }))}
              value={bitrateOption.value.toString()}
              onChange={(e) => {
                const option = bitrateOptions.find(
                  (x) => x.value.toString() === e.target.value
                )!;
                setBitrateOption(option);
              }}
            ></NativeSelectField>
          </NativeSelectRoot>
        </HStack>

        <Box
          {...getRootProps()}
          p="32px"
          h="200px"
          borderRadius="20px"
          border="2px dashed grey"
          mb="20px"
        >
          <input {...getInputProps()} />

          <Stack h="100%">
            <Box m="auto">
              {isDragActive ? (
                <p>Drop the files here to convert</p>
              ) : (
                <p>Drag and drop files here to convert</p>
              )}
            </Box>
          </Stack>
        </Box>
      </Box>

      <Toaster />
    </Stack>
  );
}

export default App;
