import { invoke } from "@tauri-apps/api/core";
import {
    quicktype,
    InputData,
    JSONSchemaInput,
    FetchingJSONSchemaStore,
} from "quicktype-core";
import { toast } from "svelte-sonner";

export type QuicktypeLang =
  | "cjson"
  | "cplusplus"
  | "csharp"
  | "dart"
  | "elm"
  | "flow"
  | "go"
  | "haskell"
  | "java"
  | "javascript"
  | "javascript-prop-types"
  | "kotlin"
  | "objc"
  | "php"
  | "python"
  | "ruby"
  | "rust"
  | "scala3"
  | "smithy4a"
  | "swift"
  | "typescript"
  | "typescript-effect-schema"
  | "typescript-zod";

export async function compileSchemaPathAndWrite(schemaPath: string, stubPath: string) {
    const schemaContent = await invoke("read_file", {path: schemaPath}) as string;

    // console.log(stubPath);

    const pathParts = stubPath.split(".");
    const extension = pathParts.at(-1) ?? "";
    const name = pathParts.at(0) ?? "";

    try {
      const { lines } = await quicktypeJSONSchema(extensionToQuicktypeLangMap[extension], name, schemaContent);
      const stubContent = lines.join("\n");
      await invoke("write_project_file", {path: stubPath, content: stubContent}) as string;

    } catch (e) {
      toast.error(String(e));
    }
}

export async function quicktypeJSONSchema(targetLanguage: QuicktypeLang, typeName: string, jsonSchemaString: string) {
    const schemaInput = new JSONSchemaInput(new FetchingJSONSchemaStore());

    // We could add multiple schemas for multiple types,
    // but here we're just making one type from JSON schema.
    await schemaInput.addSource({ name: typeName, schema: jsonSchemaString });

    const inputData = new InputData();
    inputData.addInput(schemaInput);

    return await quicktype({
        inputData,
        lang: targetLanguage
    });
}

const extensionToQuicktypeLangMap: Record<string, QuicktypeLang> = {
  h:     "cjson",
  c:     "cjson",
  "c++": "cplusplus",
  cpp:   "cplusplus",
  cc:    "cplusplus",
  cxx:   "cplusplus",
  cs:    "csharp",
  dart:  "dart",
  elm:   "elm",
  flow:  "flow",
  go:    "go",
  hs:    "haskell",
  java:  "java",
  js:    "javascript",
  mjs:   "javascript",
  jsx:   "javascript",
  ts:    "typescript",
  tsx:   "typescript",
  kt:    "kotlin",
  swift: "swift",
  m:     "objc",
  mm:    "objc",
  php:   "php",
  py:    "python",
  rb:    "ruby",
  rs:    "rust",
  scala: "scala3",
  smithy:"smithy4a",
};