export interface IngestedEvent {
  tenantId: string;
  eventType: string;
  source: string;
  receivedAt: string;
  payload: Record<string, any>;
}
