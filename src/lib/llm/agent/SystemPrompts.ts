import { plannerPrompt }   from '../plan/prompt';
import { architectPrompt } from '../architect/prompt';
import { codePrompt }      from '../code/prompt';

const ROLE_PROMPTS: Record<AgentRoles, string> = {
  plan  : plannerPrompt,
  architect: architectPrompt,
  code     : codePrompt,
};

/**
 * Returns the fully-composed system prompt for a given agent role.
 * Keeps the public API stable even when internal parts change.
 */
export function getSystemPromptFor(role: AgentRoles): string {
  return ROLE_PROMPTS[role];
}