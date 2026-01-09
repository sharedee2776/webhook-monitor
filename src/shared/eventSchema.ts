export interface IngestedEvent {
  eventId?: string;
  tenantId: string;
  eventType: string;
  source: string;
  receivedAt: string;
  payload: Record<string, any>;
  endpointId?: string; // ID of the webhook endpoint that received this event
  endpointUrl?: string; // URL of the endpoint (for display purposes)
}

// Event stored in Azure Table Storage
export interface EventEntity {
  // Partition Key: tenantId
  // Row Key: eventId
  partitionKey: string; // tenantId
  rowKey: string; // eventId
  api_key: string; // API key used to send the event
  timestamp: string; // ISO timestamp
  payload: string; // JSON stringified payload
  headers: string; // JSON stringified headers
  status: 'pending' | 'success' | 'failed' | 'partial'; // Event forwarding status
  forwarded_to?: string; // JSON array of endpoint URLs
  response_code?: number; // Last response code
  retry_count?: number; // Number of retry attempts
  error_message?: string; // Error message if failed
  eventType: string;
  source: string;
  endpointId?: string; // ID of the webhook endpoint that received this event (if applicable)
  endpointUrl?: string; // URL of the endpoint (for display purposes)
}
