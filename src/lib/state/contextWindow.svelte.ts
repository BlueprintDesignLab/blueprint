import { Tiktoken } from "js-tiktoken/lite";
import o200k_base from "js-tiktoken/ranks/o200k_base";

export const contextWindow = $state({
    length: 0
});

export const encoder = new Tiktoken(o200k_base);