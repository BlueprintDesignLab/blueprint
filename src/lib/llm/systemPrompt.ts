import { plannerPrompt }   from './planPrompt';
import { architectPrompt } from './architectPrompt';
import { codePrompt }      from './codePrompt';
import { interfaceContractDesignSystem, workflow } from './sharedPrompt';
import { edgeCodePrompt } from './edgeCoderPrompt';

const ROLE_PROMPTS: Record<AgentRoles, string> = {
  plan  : plannerPrompt,
  architect: architectPrompt,
  code     : codePrompt,
};

/**
 * Returns the fully-composed system prompt for a given agent role.
 * Keeps the public API stable even when internal parts change.
 */
export function getSystemPromptFor(role: AgentRoles, node?: string): string {
  let rolePrompt = ROLE_PROMPTS[role];

  if (role === "code") {
    if (node === "Project Scaffolder") {
      rolePrompt = edgeCodePrompt;
    } else {
      rolePrompt += `Your focus node is ${node}`
    }
  }

  const fullPrompt = rolePrompt + workflow + interfaceContractDesignSystem;
  console.log(fullPrompt);

  return fullPrompt;
}