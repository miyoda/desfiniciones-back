
export interface RoundResults {
  definitions: DefinitionResult[];
}

export interface DefinitionResult {
  definition: string;
  author?: string;
  voters: string[];
}
