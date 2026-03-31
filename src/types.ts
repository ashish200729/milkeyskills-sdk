export type JsonObject = Record<string, unknown>;

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: JsonObject;
  read_only_hint: boolean;
}

export interface ToolCallRequest {
  name: CanonicalToolName;
  arguments?: JsonObject;
}

export interface ToolCallResponse {
  tool: CanonicalToolName;
  content: string;
  structured_content?: JsonObject;
  is_error: boolean;
}

export interface SkillReferenceMeta {
  slug: string;
  title: string;
  filename: string;
}

export interface ResolvedSkill {
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  references?: SkillReferenceMeta[];
}

export interface ResolveSkillResponse {
  skills: ResolvedSkill[];
  related_skills?: ResolvedSkill[];
  primary_slug?: string;
  query: string;
  category?: string;
  count: number;
}

export interface SkillResponse {
  slug: string;
  name: string;
  description: string;
  category: string;
  version: number;
  topic?: string;
  truncated: boolean;
  content: string;
}

export interface SkillReferenceResponse {
  slug: string;
  title: string;
  filename: string;
  skill_id: string;
  sort_order: number;
  truncated: boolean;
  content: string;
}

export interface SkillReferenceListResponse {
  skill_slug: string;
  items: SkillReferenceMeta[];
}

export interface ProblemDetails extends JsonObject {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code?: string;
  request_id?: string;
}

export interface MilkeyClientConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
  userAgent?: string;
  fetch?: typeof fetch;
}

export interface RequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export type CanonicalToolName =
  | "resolve-skill"
  | "get-skill"
  | "get-skill-reference";

export type ProviderToolAlias =
  | "milkey_resolve_skill"
  | "milkey_get_skill"
  | "milkey_get_skill_reference";

export type PublicToolName = CanonicalToolName | ProviderToolAlias;

export interface ToolDescriptor {
  canonicalName: CanonicalToolName;
  alias: ProviderToolAlias;
  description: string;
  inputSchema: JsonObject;
}

export interface ResolveSkillInput {
  query: string;
  category?: string;
}

export interface GetSkillInput {
  slug: string;
  topic?: string;
  tokens?: number;
}

export interface GetSkillReferenceInput {
  slug: string;
  tokens?: number;
}

export interface OpenAIHostedDeliveryOptions {
  client: MilkeyClient;
  allowedTools?: CanonicalToolName[];
  approvalMode?: "never" | "always" | {
    never?: {
      tool_names: string[];
    };
    always?: {
      tool_names: string[];
    };
  };
  serverLabel?: string;
  serverDescription?: string;
}

export interface InlineToolOptions {
  client: MilkeyClient;
  allowedTools?: CanonicalToolName[];
}

export interface OpenAIFunctionCallItem {
  id?: string;
  call_id?: string;
  name: string;
  arguments: string;
  type?: string;
}

export interface AnthropicToolUseBlock {
  id: string;
  name: string;
  input: JsonObject;
  type?: string;
}

export interface GeminiFunctionCall {
  id?: string;
  name: string;
  args: JsonObject;
}

export interface MilkeyToolExecution {
  canonicalName: CanonicalToolName;
  alias: ProviderToolAlias;
  response: ToolCallResponse;
}

export interface AISDKTool<Input = unknown, Output = unknown> {
  description: string;
  inputSchema: JsonObject;
  execute: (input: Input) => Promise<Output>;
}

export interface MilkeyClient {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly timeoutMs: number;
  getMcpUrl(): string;
  listTools(options?: RequestOptions): Promise<ToolDefinition[]>;
  callTool(request: ToolCallRequest, options?: RequestOptions): Promise<ToolCallResponse>;
  resolveSkill(input: ResolveSkillInput, options?: RequestOptions): Promise<ResolveSkillResponse>;
  getSkill(input: GetSkillInput, options?: RequestOptions): Promise<SkillResponse>;
  listSkillReferences(slug: string, options?: RequestOptions): Promise<SkillReferenceListResponse>;
  getSkillReference(input: GetSkillReferenceInput, options?: RequestOptions): Promise<SkillReferenceResponse>;
}
