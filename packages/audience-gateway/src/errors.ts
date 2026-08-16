export type AudienceAdapterErrorCode =
  | 'INVALID_SECRET'
  | 'INVALID_SIGNATURE'
  | 'MALFORMED_SIGNATURE'
  | 'MALFORMED_TIMESTAMP'
  | 'EXPIRED_EVENT'
  | 'FUTURE_EVENT'
  | 'MALFORMED_BODY'
  | 'BODY_TOO_LARGE'
  | 'UNSUPPORTED_EVENT'
  | 'UNSUPPORTED_MESSAGE_TYPE'
  | 'UNAUTHENTICATED_CLIENT'
  | 'UNSUPPORTED_AUTH'
  | 'INVALID_CONTEXT';

export class AudienceAdapterError extends Error {
  constructor(public readonly code: AudienceAdapterErrorCode, message: string) {
    super(message);
    this.name = 'AudienceAdapterError';
  }
}
