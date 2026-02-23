/**
 * Abstraction over any LLM provider.
 * Injected into services so the underlying model can be swapped or mocked in tests.
 */
export interface AiProvider {
  /**
   * Send a prompt and receive a raw text response.
   * Callers are responsible for parsing and validating the output.
   */
  complete(prompt: string): Promise<string>;
}
