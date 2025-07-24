import { invoke } from "@tauri-apps/api/core";
import {
    quicktype,
    InputData,
    JSONSchemaInput,
    FetchingJSONSchemaStore,
    type SerializedRenderResult,
} from "quicktype-core";

// quicktype-lang.ts
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

    const pathParts = stubPath.split(".");
    const extension = pathParts.at(-1) ?? "";
    const name = pathParts.at(0) ?? "";

    const { lines } = await quicktypeJSONSchema(extensionToQuicktypeLangMap[extension], name, schemaContent);
    const stubContent = lines.join("\n");
    console.log(`updating ${stubPath}`);

    await invoke("write_project_file", {path: stubPath, content: stubContent}) as string;
    return stubContent;
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

/**
 * Map a file extension to the corresponding quicktype-core `lang` string.
 * Case-insensitive; works with or without the leading dot.
 *
 * @example
 * extensionToQuicktypeLang('cs')   // → 'csharp'
 * extensionToQuicktypeLang('.ts')  // → 'typescript'
 */
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