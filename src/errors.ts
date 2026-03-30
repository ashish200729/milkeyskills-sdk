import type { ProblemDetails } from "./types";

export class MilkeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MilkeyError";
  }
}

export class MilkeyProblemError extends MilkeyError {
  readonly problem: ProblemDetails;
  readonly status: number;

  constructor(problem: ProblemDetails) {
    super(problem.detail || problem.title);
    this.name = "MilkeyProblemError";
    this.problem = problem;
    this.status = problem.status;
  }
}

export class MilkeyResponseError extends MilkeyError {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`Milkey request failed with status ${status}`);
    this.name = "MilkeyResponseError";
    this.status = status;
    this.body = body;
  }
}

export class MilkeyConfigError extends MilkeyError {
  constructor(message: string) {
    super(message);
    this.name = "MilkeyConfigError";
  }
}

export class MilkeyTimeoutError extends MilkeyError {
  readonly timeoutMs: number;
  readonly path: string;

  constructor(timeoutMs: number, path: string) {
    super(`Milkey request timed out after ${timeoutMs}ms while calling ${path}`);
    this.name = "MilkeyTimeoutError";
    this.timeoutMs = timeoutMs;
    this.path = path;
  }
}

export class MilkeyToolCallError extends MilkeyError {
  readonly toolName: string;
  readonly rawArguments: string;

  constructor(toolName: string, rawArguments: string, message: string) {
    super(message);
    this.name = "MilkeyToolCallError";
    this.toolName = toolName;
    this.rawArguments = rawArguments;
  }
}
