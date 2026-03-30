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
