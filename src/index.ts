#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { Tuteliq } from '@tuteliq/sdk';
import { readFileSync } from 'fs';

// Initialize Tuteliq client
const apiKey = process.env.TUTELIQ_API_KEY;
if (!apiKey) {
  console.error('Error: TUTELIQ_API_KEY environment variable is required');
  process.exit(1);
}

const client = new Tuteliq(apiKey);

// Severity emoji mapping
const severityEmoji: Record<string, string> = {
  low: '🟡',
  medium: '🟠',
  high: '🔴',
  critical: '⛔',
};

const riskEmoji: Record<string, string> = {
  safe: '✅',
  none: '✅',
  low: '🟡',
  medium: '🟠',
  high: '🔴',
  critical: '⛔',
};

const trendEmoji: Record<string, string> = {
  improving: '📈',
  stable: '➡️',
  worsening: '📉',
};

// Tool definitions
const tools: Tool[] = [
  // =========================================================================
  // Safety Detection Tools
  // =========================================================================
  {
    name: 'detect_bullying',
    description: 'Analyze text content to detect bullying, harassment, or harmful language. Returns severity, type of bullying, confidence score, and recommended actions.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The text content to analyze for bullying',
        },
        context: {
          type: 'object',
          description: 'Optional context for better analysis',
          properties: {
            language: { type: 'string' },
            ageGroup: { type: 'string' },
            relationship: { type: 'string' },
            platform: { type: 'string' },
          },
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'detect_grooming',
    description: 'Analyze a conversation for grooming patterns and predatory behavior. Identifies manipulation tactics, boundary violations, and isolation attempts.',
    inputSchema: {
      type: 'object',
      properties: {
        messages: {
          type: 'array',
          description: 'Array of messages in the conversation',
          items: {
            type: 'object',
            properties: {
              role: {
                type: 'string',
                enum: ['adult', 'child', 'unknown'],
                description: 'Role of the message sender',
              },
              content: {
                type: 'string',
                description: 'Message content',
              },
            },
            required: ['role', 'content'],
          },
        },
        childAge: {
          type: 'number',
          description: 'Age of the child in the conversation',
        },
      },
      required: ['messages'],
    },
  },
  {
    name: 'detect_unsafe',
    description: 'Detect unsafe content including self-harm, violence, drugs, explicit material, or other harmful content categories.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The text content to analyze for unsafe content',
        },
        context: {
          type: 'object',
          description: 'Optional context for better analysis',
          properties: {
            language: { type: 'string' },
            ageGroup: { type: 'string' },
            platform: { type: 'string' },
          },
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'analyze',
    description: 'Quick comprehensive safety analysis that checks for both bullying and unsafe content. Best for general content screening.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The text content to analyze',
        },
        include: {
          type: 'array',
          items: { type: 'string', enum: ['bullying', 'unsafe'] },
          description: 'Which checks to run (default: both)',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'analyze_emotions',
    description: 'Analyze emotional content and mental state indicators. Identifies dominant emotions, trends, and provides follow-up recommendations.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The text content to analyze for emotions',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'get_action_plan',
    description: 'Generate age-appropriate guidance and action steps for handling a safety situation. Tailored for children, parents, or educators.',
    inputSchema: {
      type: 'object',
      properties: {
        situation: {
          type: 'string',
          description: 'Description of the situation needing guidance',
        },
        childAge: {
          type: 'number',
          description: 'Age of the child involved',
        },
        audience: {
          type: 'string',
          enum: ['child', 'parent', 'educator', 'platform'],
          description: 'Who the guidance is for (default: parent)',
        },
        severity: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Severity of the situation',
        },
      },
      required: ['situation'],
    },
  },
  {
    name: 'generate_report',
    description: 'Generate a comprehensive incident report from a conversation. Includes summary, risk level, and recommended next steps.',
    inputSchema: {
      type: 'object',
      properties: {
        messages: {
          type: 'array',
          description: 'Array of messages in the incident',
          items: {
            type: 'object',
            properties: {
              sender: { type: 'string', description: 'Name/ID of sender' },
              content: { type: 'string', description: 'Message content' },
            },
            required: ['sender', 'content'],
          },
        },
        childAge: {
          type: 'number',
          description: 'Age of the child involved',
        },
        incidentType: {
          type: 'string',
          description: 'Type of incident (e.g., bullying, grooming)',
        },
      },
      required: ['messages'],
    },
  },

  // =========================================================================
  // Voice & Image Analysis Tools
  // =========================================================================
  {
    name: 'analyze_voice',
    description: 'Analyze an audio file for safety concerns. Transcribes the audio via Whisper, then runs safety analysis on the transcript. Returns timestamped segments for incident reports. Supports mp3, wav, m4a, ogg, flac, webm, mp4.',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Absolute path to the audio file on disk',
        },
        analysis_type: {
          type: 'string',
          enum: ['bullying', 'unsafe', 'grooming', 'emotions', 'all'],
          description: 'Type of analysis to run on the transcript (default: all)',
        },
        child_age: {
          type: 'number',
          description: 'Child age (used for grooming analysis)',
        },
        language: {
          type: 'string',
          description: 'Language hint for transcription (e.g., "en", "es")',
        },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'analyze_image',
    description: 'Analyze an image for visual safety concerns and OCR text extraction. Uses vision AI for content classification, then runs safety analysis on any extracted text. Supports png, jpg, jpeg, gif, webp.',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Absolute path to the image file on disk',
        },
        analysis_type: {
          type: 'string',
          enum: ['bullying', 'unsafe', 'emotions', 'all'],
          description: 'Type of analysis to run on extracted text (default: all)',
        },
      },
      required: ['file_path'],
    },
  },

  // =========================================================================
  // Webhook Management Tools
  // =========================================================================
  {
    name: 'list_webhooks',
    description: 'List all webhooks configured for your account.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'create_webhook',
    description: 'Create a new webhook endpoint. The returned secret is only shown once — store it securely for signature verification.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Display name for the webhook' },
        url: { type: 'string', description: 'HTTPS URL to receive webhook payloads' },
        events: {
          type: 'array',
          items: { type: 'string' },
          description: 'Event types to subscribe to (e.g., incident.critical, grooming.detected, unsafe.detected, bullying.detected)',
        },
      },
      required: ['name', 'url', 'events'],
    },
  },
  {
    name: 'update_webhook',
    description: 'Update an existing webhook configuration.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Webhook ID' },
        name: { type: 'string', description: 'New display name' },
        url: { type: 'string', description: 'New HTTPS URL' },
        events: { type: 'array', items: { type: 'string' }, description: 'New event subscriptions' },
        is_active: { type: 'boolean', description: 'Enable or disable the webhook' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_webhook',
    description: 'Permanently delete a webhook.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Webhook ID to delete' },
      },
      required: ['id'],
    },
  },
  {
    name: 'test_webhook',
    description: 'Send a test payload to a webhook to verify it is working correctly.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Webhook ID to test' },
      },
      required: ['id'],
    },
  },
  {
    name: 'regenerate_webhook_secret',
    description: 'Regenerate a webhook signing secret. The old secret is immediately invalidated.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Webhook ID' },
      },
      required: ['id'],
    },
  },

  // =========================================================================
  // Pricing Tools
  // =========================================================================
  {
    name: 'get_pricing',
    description: 'Get available pricing plans for Tuteliq.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_pricing_details',
    description: 'Get detailed pricing plans with monthly/yearly prices, API call limits, and feature lists.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  // =========================================================================
  // Usage & Billing Tools
  // =========================================================================
  {
    name: 'get_usage_history',
    description: 'Get daily usage history for the past N days, showing request counts per day.',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days to retrieve (1-30, default: 7)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_usage_by_tool',
    description: 'Get usage broken down by tool/endpoint for a specific date.',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format (default: today)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_usage_monthly',
    description: 'Get monthly usage summary including billing period, limits, rate limits, and upgrade recommendations.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  // =========================================================================
  // GDPR Account Tools
  // =========================================================================
  {
    name: 'delete_account_data',
    description: 'Delete all account data (GDPR Article 17 — Right to Erasure). Permanently removes all stored user data.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'export_account_data',
    description: 'Export all account data as JSON (GDPR Article 20 — Right to Data Portability).',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'record_consent',
    description: 'Record user consent for a specific data processing purpose (GDPR Article 7).',
    inputSchema: {
      type: 'object',
      properties: {
        consent_type: {
          type: 'string',
          enum: ['data_processing', 'analytics', 'marketing', 'third_party_sharing', 'child_safety_monitoring'],
          description: 'Type of consent to record',
        },
        version: {
          type: 'string',
          description: 'Policy version the user is consenting to',
        },
      },
      required: ['consent_type', 'version'],
    },
  },
  {
    name: 'get_consent_status',
    description: 'Get current consent status for all or a specific consent type (GDPR Article 7).',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['data_processing', 'analytics', 'marketing', 'third_party_sharing', 'child_safety_monitoring'],
          description: 'Optional: filter by consent type',
        },
      },
      required: [],
    },
  },
  {
    name: 'withdraw_consent',
    description: 'Withdraw a previously granted consent (GDPR Article 7.3).',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['data_processing', 'analytics', 'marketing', 'third_party_sharing', 'child_safety_monitoring'],
          description: 'Type of consent to withdraw',
        },
      },
      required: ['type'],
    },
  },
  {
    name: 'rectify_data',
    description: 'Rectify (correct) user data in a specific collection (GDPR Article 16 — Right to Rectification).',
    inputSchema: {
      type: 'object',
      properties: {
        collection: {
          type: 'string',
          description: 'Firestore collection name',
        },
        document_id: {
          type: 'string',
          description: 'Document ID to rectify',
        },
        fields: {
          type: 'object',
          description: 'Fields to update (only allowlisted fields accepted)',
        },
      },
      required: ['collection', 'document_id', 'fields'],
    },
  },
  {
    name: 'get_audit_logs',
    description: 'Get audit trail of all data operations (GDPR Article 15 — Right of Access).',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['data_access', 'data_export', 'data_deletion', 'data_rectification', 'consent_granted', 'consent_withdrawn', 'breach_notification'],
          description: 'Optional: filter by action type',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results',
        },
      },
      required: [],
    },
  },

  // =========================================================================
  // Breach Management Tools
  // =========================================================================
  {
    name: 'log_breach',
    description: 'Log a new data breach (GDPR Article 33/34). Records breach details and starts the 72-hour notification clock.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Brief title of the breach' },
        description: { type: 'string', description: 'Detailed description of what happened' },
        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Breach severity' },
        affected_user_ids: { type: 'array', items: { type: 'string' }, description: 'List of affected user IDs' },
        data_categories: { type: 'array', items: { type: 'string' }, description: 'Categories of data affected (e.g. email, name, address)' },
        reported_by: { type: 'string', description: 'Who reported the breach' },
      },
      required: ['title', 'description', 'severity', 'affected_user_ids', 'data_categories', 'reported_by'],
    },
  },
  {
    name: 'list_breaches',
    description: 'List all data breaches, optionally filtered by status.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['detected', 'investigating', 'contained', 'reported', 'resolved'], description: 'Filter by breach status' },
        limit: { type: 'number', description: 'Maximum number of results' },
      },
      required: [],
    },
  },
  {
    name: 'get_breach',
    description: 'Get details of a specific data breach by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Breach ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'update_breach_status',
    description: 'Update a breach status and notification progress.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Breach ID' },
        status: { type: 'string', enum: ['detected', 'investigating', 'contained', 'reported', 'resolved'], description: 'New breach status' },
        notification_status: { type: 'string', enum: ['pending', 'users_notified', 'dpa_notified', 'completed'], description: 'Notification progress status' },
        notes: { type: 'string', description: 'Additional notes about the update' },
      },
      required: ['id', 'status'],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'tuteliq-mcp',
    version: '2.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Helper to extract filename from path
function filenameFromPath(filePath: string): string {
  return filePath.split('/').pop() || filePath;
}

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      // =====================================================================
      // Safety Detection
      // =====================================================================

      case 'detect_bullying': {
        const result = await client.detectBullying({
          content: args.content as string,
          context: args.context as Record<string, string> | undefined,
        });

        const emoji = severityEmoji[result.severity] || '⚪';
        const response = `## ${result.is_bullying ? '⚠️ Bullying Detected' : '✅ No Bullying Detected'}

**Severity:** ${emoji} ${result.severity.charAt(0).toUpperCase() + result.severity.slice(1)}
**Confidence:** ${(result.confidence * 100).toFixed(0)}%
**Risk Score:** ${(result.risk_score * 100).toFixed(0)}%

${result.is_bullying ? `**Types:** ${result.bullying_type.join(', ')}` : ''}

### Rationale
${result.rationale}

### Recommended Action
\`${result.recommended_action}\``;

        return { content: [{ type: 'text', text: response }] };
      }

      case 'detect_grooming': {
        const messages = (args.messages as Array<{ role: string; content: string }>).map((m) => ({
          role: m.role as 'adult' | 'child' | 'unknown',
          content: m.content,
        }));

        const result = await client.detectGrooming({
          messages,
          childAge: args.childAge as number | undefined,
        });

        const emoji = riskEmoji[result.grooming_risk] || '⚪';
        const response = `## ${result.grooming_risk === 'none' ? '✅ No Grooming Detected' : '⚠️ Grooming Risk Detected'}

**Risk Level:** ${emoji} ${result.grooming_risk.charAt(0).toUpperCase() + result.grooming_risk.slice(1)}
**Confidence:** ${(result.confidence * 100).toFixed(0)}%
**Risk Score:** ${(result.risk_score * 100).toFixed(0)}%

${result.flags.length > 0 ? `**Warning Flags:**\n${result.flags.map(f => `- 🚩 ${f}`).join('\n')}` : ''}

### Rationale
${result.rationale}

### Recommended Action
\`${result.recommended_action}\``;

        return { content: [{ type: 'text', text: response }] };
      }

      case 'detect_unsafe': {
        const result = await client.detectUnsafe({
          content: args.content as string,
          context: args.context as Record<string, string> | undefined,
        });

        const emoji = severityEmoji[result.severity] || '⚪';
        const response = `## ${result.unsafe ? '⚠️ Unsafe Content Detected' : '✅ Content is Safe'}

**Severity:** ${emoji} ${result.severity.charAt(0).toUpperCase() + result.severity.slice(1)}
**Confidence:** ${(result.confidence * 100).toFixed(0)}%
**Risk Score:** ${(result.risk_score * 100).toFixed(0)}%

${result.unsafe ? `**Categories:**\n${result.categories.map(c => `- ⚠️ ${c}`).join('\n')}` : ''}

### Rationale
${result.rationale}

### Recommended Action
\`${result.recommended_action}\``;

        return { content: [{ type: 'text', text: response }] };
      }

      case 'analyze': {
        const result = await client.analyze({
          content: args.content as string,
          include: args.include as Array<'bullying' | 'unsafe'> | undefined,
        });

        const emoji = riskEmoji[result.risk_level] || '⚪';
        const response = `## Safety Analysis Results

**Overall Risk:** ${emoji} ${result.risk_level.charAt(0).toUpperCase() + result.risk_level.slice(1)}
**Risk Score:** ${(result.risk_score * 100).toFixed(0)}%

### Summary
${result.summary}

### Recommended Action
\`${result.recommended_action}\`

---
${result.bullying ? `
**Bullying Check:** ${result.bullying.is_bullying ? '⚠️ Detected' : '✅ Clear'}
` : ''}${result.unsafe ? `
**Unsafe Content:** ${result.unsafe.unsafe ? '⚠️ Detected' : '✅ Clear'}
` : ''}`;

        return { content: [{ type: 'text', text: response }] };
      }

      case 'analyze_emotions': {
        const result = await client.analyzeEmotions({
          content: args.content as string,
        });

        const emoji = trendEmoji[result.trend] || '➡️';

        const emotionScoresList = Object.entries(result.emotion_scores)
          .sort((a, b) => b[1] - a[1])
          .map(([emotion, score]) => `- ${emotion}: ${(score * 100).toFixed(0)}%`)
          .join('\n');

        const response = `## Emotion Analysis

**Dominant Emotions:** ${result.dominant_emotions.join(', ')}
**Trend:** ${emoji} ${result.trend.charAt(0).toUpperCase() + result.trend.slice(1)}

### Emotion Scores
${emotionScoresList}

### Summary
${result.summary}

### Recommended Follow-up
${result.recommended_followup}`;

        return { content: [{ type: 'text', text: response }] };
      }

      case 'get_action_plan': {
        const result = await client.getActionPlan({
          situation: args.situation as string,
          childAge: args.childAge as number | undefined,
          audience: args.audience as 'child' | 'parent' | 'educator' | 'platform' | undefined,
          severity: args.severity as 'low' | 'medium' | 'high' | 'critical' | undefined,
        });

        const response = `## Action Plan

**Audience:** ${result.audience}
**Tone:** ${result.tone}
${result.reading_level ? `**Reading Level:** ${result.reading_level}` : ''}

### Steps
${result.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}`;

        return { content: [{ type: 'text', text: response }] };
      }

      case 'generate_report': {
        const messages = (args.messages as Array<{ sender: string; content: string }>).map((m) => ({
          sender: m.sender,
          content: m.content,
        }));

        const result = await client.generateReport({
          messages,
          childAge: args.childAge as number | undefined,
          incident: args.incidentType ? { type: args.incidentType as string } : undefined,
        });

        const emoji = riskEmoji[result.risk_level] || '⚪';
        const response = `## 📋 Incident Report

**Risk Level:** ${emoji} ${result.risk_level.charAt(0).toUpperCase() + result.risk_level.slice(1)}

### Summary
${result.summary}

### Categories
${result.categories.map(c => `- ${c}`).join('\n')}

### Recommended Next Steps
${result.recommended_next_steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}`;

        return { content: [{ type: 'text', text: response }] };
      }

      // =====================================================================
      // Voice & Image Analysis
      // =====================================================================

      case 'analyze_voice': {
        const filePath = args.file_path as string;
        const buffer = readFileSync(filePath);
        const filename = filenameFromPath(filePath);

        const result = await client.analyzeVoice({
          file: buffer,
          filename,
          analysisType: (args.analysis_type as 'bullying' | 'unsafe' | 'grooming' | 'emotions' | 'all') || 'all',
          language: args.language as string | undefined,
          childAge: args.child_age as number | undefined,
        });

        const emoji = severityEmoji[result.overall_severity] || '✅';
        const segmentLines = result.transcription.segments
          .slice(0, 20)
          .map(s => `\`${s.start.toFixed(1)}s–${s.end.toFixed(1)}s\` ${s.text}`)
          .join('\n');

        const analysisLines: string[] = [];
        if (result.analysis.bullying) {
          analysisLines.push(`**Bullying:** ${result.analysis.bullying.is_bullying ? '⚠️ Detected' : '✅ Clear'} (${(result.analysis.bullying.risk_score * 100).toFixed(0)}%)`);
        }
        if (result.analysis.unsafe) {
          analysisLines.push(`**Unsafe:** ${result.analysis.unsafe.unsafe ? '⚠️ Detected' : '✅ Clear'} (${(result.analysis.unsafe.risk_score * 100).toFixed(0)}%)`);
        }
        if (result.analysis.grooming) {
          analysisLines.push(`**Grooming:** ${result.analysis.grooming.grooming_risk !== 'none' ? '⚠️ ' + result.analysis.grooming.grooming_risk : '✅ Clear'} (${(result.analysis.grooming.risk_score * 100).toFixed(0)}%)`);
        }
        if (result.analysis.emotions) {
          analysisLines.push(`**Emotions:** ${result.analysis.emotions.dominant_emotions.join(', ')} (${trendEmoji[result.analysis.emotions.trend] || ''} ${result.analysis.emotions.trend})`);
        }

        const response = `## 🎙️ Voice Analysis

**Overall Severity:** ${emoji} ${result.overall_severity}
**Overall Risk Score:** ${(result.overall_risk_score * 100).toFixed(0)}%
**Language:** ${result.transcription.language}
**Duration:** ${result.transcription.duration.toFixed(1)}s

### Transcript
${result.transcription.text}

### Timestamped Segments
${segmentLines}${result.transcription.segments.length > 20 ? `\n_...and ${result.transcription.segments.length - 20} more segments_` : ''}

### Analysis Results
${analysisLines.join('\n')}`;

        return { content: [{ type: 'text', text: response }] };
      }

      case 'analyze_image': {
        const filePath = args.file_path as string;
        const buffer = readFileSync(filePath);
        const filename = filenameFromPath(filePath);

        const result = await client.analyzeImage({
          file: buffer,
          filename,
          analysisType: (args.analysis_type as 'bullying' | 'unsafe' | 'emotions' | 'all') || 'all',
        });

        const emoji = severityEmoji[result.overall_severity] || '✅';

        const textAnalysisLines: string[] = [];
        if (result.text_analysis?.bullying) {
          textAnalysisLines.push(`**Bullying:** ${result.text_analysis.bullying.is_bullying ? '⚠️ Detected' : '✅ Clear'} (${(result.text_analysis.bullying.risk_score * 100).toFixed(0)}%)`);
        }
        if (result.text_analysis?.unsafe) {
          textAnalysisLines.push(`**Unsafe:** ${result.text_analysis.unsafe.unsafe ? '⚠️ Detected' : '✅ Clear'} (${(result.text_analysis.unsafe.risk_score * 100).toFixed(0)}%)`);
        }
        if (result.text_analysis?.emotions) {
          textAnalysisLines.push(`**Emotions:** ${result.text_analysis.emotions.dominant_emotions.join(', ')}`);
        }

        const response = `## 🖼️ Image Analysis

**Overall Severity:** ${emoji} ${result.overall_severity}
**Overall Risk Score:** ${(result.overall_risk_score * 100).toFixed(0)}%

### Vision Results
**Description:** ${result.vision.visual_description}
**Visual Severity:** ${severityEmoji[result.vision.visual_severity] || '✅'} ${result.vision.visual_severity}
**Visual Confidence:** ${(result.vision.visual_confidence * 100).toFixed(0)}%
**Contains Text:** ${result.vision.contains_text ? 'Yes' : 'No'}
**Contains Faces:** ${result.vision.contains_faces ? 'Yes' : 'No'}
${result.vision.visual_categories.length > 0 ? `**Visual Categories:** ${result.vision.visual_categories.join(', ')}` : ''}

${result.vision.extracted_text ? `### Extracted Text (OCR)\n${result.vision.extracted_text}` : ''}

${textAnalysisLines.length > 0 ? `### Text Analysis Results\n${textAnalysisLines.join('\n')}` : ''}`;

        return { content: [{ type: 'text', text: response }] };
      }

      // =====================================================================
      // Webhook Management
      // =====================================================================

      case 'list_webhooks': {
        const result = await client.listWebhooks();
        if (result.webhooks.length === 0) {
          return { content: [{ type: 'text', text: 'No webhooks configured.' }] };
        }
        const lines = result.webhooks.map(w =>
          `- ${w.is_active ? '🟢' : '⚪'} **${w.name}** — \`${w.url}\`\n  Events: ${w.events.join(', ')} _(${w.id})_`
        ).join('\n');
        return { content: [{ type: 'text', text: `## Webhooks\n\n${lines}` }] };
      }

      case 'create_webhook': {
        const result = await client.createWebhook({
          name: args.name as string,
          url: args.url as string,
          events: args.events as string[],
        });
        return { content: [{ type: 'text', text: `## ✅ Webhook Created\n\n**ID:** ${result.webhook.id}\n**Name:** ${result.webhook.name}\n**URL:** ${result.webhook.url}\n**Events:** ${result.webhook.events.join(', ')}\n\n⚠️ **Secret (save this — shown only once):**\n\`${result.secret}\`` }] };
      }

      case 'update_webhook': {
        const result = await client.updateWebhook(args.id as string, {
          name: args.name as string | undefined,
          url: args.url as string | undefined,
          events: args.events as string[] | undefined,
          isActive: args.is_active as boolean | undefined,
        });
        return { content: [{ type: 'text', text: `## ✅ Webhook Updated\n\n**ID:** ${result.webhook.id}\n**Name:** ${result.webhook.name}\n**Active:** ${result.webhook.is_active ? '🟢 Yes' : '⚪ No'}` }] };
      }

      case 'delete_webhook': {
        await client.deleteWebhook(args.id as string);
        return { content: [{ type: 'text', text: `## ✅ Webhook Deleted\n\nWebhook \`${args.id}\` has been permanently deleted.` }] };
      }

      case 'test_webhook': {
        const result = await client.testWebhook(args.id as string);
        return { content: [{ type: 'text', text: `## ${result.success ? '✅' : '❌'} Webhook Test\n\n**Success:** ${result.success}\n**Status Code:** ${result.status_code}\n**Latency:** ${result.latency_ms}ms${result.error ? `\n**Error:** ${result.error}` : ''}` }] };
      }

      case 'regenerate_webhook_secret': {
        const result = await client.regenerateWebhookSecret(args.id as string);
        return { content: [{ type: 'text', text: `## ✅ Secret Regenerated\n\nThe old secret has been invalidated.\n\n⚠️ **New Secret (save this — shown only once):**\n\`${result.secret}\`` }] };
      }

      // =====================================================================
      // Pricing
      // =====================================================================

      case 'get_pricing': {
        const result = await client.getPricing();
        const lines = result.plans.map(p =>
          `### ${p.name}\n**Price:** ${p.price}\n${p.features.map(f => `- ${f}`).join('\n')}`
        ).join('\n\n');
        return { content: [{ type: 'text', text: `## Tuteliq Pricing\n\n${lines}` }] };
      }

      case 'get_pricing_details': {
        const result = await client.getPricingDetails();
        const lines = result.plans.map(p =>
          `### ${p.name}\n**Monthly:** ${p.price_monthly}/mo | **Yearly:** ${p.price_yearly}/mo\n**API Calls:** ${p.api_calls_per_month}/mo | **Rate Limit:** ${p.rate_limit}/min\n${p.features.map(f => `- ${f}`).join('\n')}`
        ).join('\n\n');
        return { content: [{ type: 'text', text: `## Tuteliq Pricing Details\n\n${lines}` }] };
      }

      // =====================================================================
      // Usage & Billing
      // =====================================================================

      case 'get_usage_history': {
        const result = await client.getUsageHistory(args.days as number | undefined);
        if (result.days.length === 0) {
          return { content: [{ type: 'text', text: 'No usage data available.' }] };
        }
        const lines = result.days.map(d =>
          `| ${d.date} | ${d.total_requests} | ${d.success_requests} | ${d.error_requests} |`
        ).join('\n');
        return { content: [{ type: 'text', text: `## Usage History\n\n| Date | Total | Success | Errors |\n|------|-------|---------|--------|\n${lines}` }] };
      }

      case 'get_usage_by_tool': {
        const result = await client.getUsageByTool(args.date as string | undefined);
        const toolLines = Object.entries(result.tools).map(([tool, count]) => `- **${tool}:** ${count}`).join('\n');
        const endpointLines = Object.entries(result.endpoints).map(([ep, count]) => `- **${ep}:** ${count}`).join('\n');
        return { content: [{ type: 'text', text: `## Usage by Tool — ${result.date}\n\n### By Tool\n${toolLines || '_No data_'}\n\n### By Endpoint\n${endpointLines || '_No data_'}` }] };
      }

      case 'get_usage_monthly': {
        const result = await client.getUsageMonthly();
        const response = `## Monthly Usage

**Tier:** ${result.tier_display_name}
**Billing Period:** ${result.billing.current_period_start} → ${result.billing.current_period_end} (${result.billing.days_remaining} days left)

### Usage
**Used:** ${result.usage.used} / ${result.usage.limit} (${result.usage.percent_used.toFixed(1)}%)
**Remaining:** ${result.usage.remaining}
**Rate Limit:** ${result.rate_limit.requests_per_minute}/min

${result.recommendations ? `### Recommendation\n${result.recommendations.reason}\n**Suggested Tier:** ${result.recommendations.suggested_tier}\n[Upgrade](${result.recommendations.upgrade_url})` : ''}`;
        return { content: [{ type: 'text', text: response }] };
      }

      // =====================================================================
      // GDPR Account
      // =====================================================================

      case 'delete_account_data': {
        const result = await client.deleteAccountData();
        return { content: [{ type: 'text', text: `## ✅ Account Data Deleted\n\n**Message:** ${result.message}\n**Records Deleted:** ${result.deleted_count}` }] };
      }

      case 'export_account_data': {
        const result = await client.exportAccountData();
        const collections = Object.keys(result.data).join(', ');
        return { content: [{ type: 'text', text: `## 📦 Account Data Export\n\n**User ID:** ${result.userId}\n**Exported At:** ${result.exportedAt}\n**Collections:** ${collections}\n\n\`\`\`json\n${JSON.stringify(result.data, null, 2).slice(0, 5000)}\n\`\`\`` }] };
      }

      case 'record_consent': {
        const result = await client.recordConsent({
          consent_type: args.consent_type as string,
          version: args.version as string,
        });
        return { content: [{ type: 'text', text: `## ✅ Consent Recorded\n\n**Type:** ${result.consent.consent_type}\n**Status:** ${result.consent.status}\n**Version:** ${result.consent.version}` }] };
      }

      case 'get_consent_status': {
        const result = await client.getConsentStatus(args.type as string | undefined);
        if (result.consents.length === 0) {
          return { content: [{ type: 'text', text: 'No consent records found.' }] };
        }
        const lines = result.consents.map(c =>
          `- **${c.consent_type}**: ${c.status === 'granted' ? '✅' : '❌'} ${c.status} (v${c.version})`
        ).join('\n');
        return { content: [{ type: 'text', text: `## Consent Status\n\n${lines}` }] };
      }

      case 'withdraw_consent': {
        const result = await client.withdrawConsent(args.type as string);
        return { content: [{ type: 'text', text: `## ⚠️ Consent Withdrawn\n\n**Type:** ${result.consent.consent_type}\n**Status:** ${result.consent.status}` }] };
      }

      case 'rectify_data': {
        const result = await client.rectifyData({
          collection: args.collection as string,
          document_id: args.document_id as string,
          fields: args.fields as Record<string, unknown>,
        });
        return { content: [{ type: 'text', text: `## ✅ Data Rectified\n\n**Message:** ${result.message}\n**Updated Fields:** ${result.updated_fields.join(', ')}` }] };
      }

      case 'get_audit_logs': {
        const result = await client.getAuditLogs({
          action: args.action as string | undefined,
          limit: args.limit as number | undefined,
        });
        if (result.audit_logs.length === 0) {
          return { content: [{ type: 'text', text: 'No audit logs found.' }] };
        }
        const logLines = result.audit_logs.map(l =>
          `- \`${l.created_at}\` **${l.action}** _(${l.id})_`
        ).join('\n');
        return { content: [{ type: 'text', text: `## 📋 Audit Logs\n\n${logLines}` }] };
      }

      // =====================================================================
      // Breach Management
      // =====================================================================

      case 'log_breach': {
        const result = await client.logBreach({
          title: args.title as string,
          description: args.description as string,
          severity: args.severity as string,
          affected_user_ids: args.affected_user_ids as string[],
          data_categories: args.data_categories as string[],
          reported_by: args.reported_by as string,
        });
        const b = result.breach;
        return { content: [{ type: 'text', text: `## ⚠️ Breach Logged\n\n**ID:** ${b.id}\n**Title:** ${b.title}\n**Severity:** ${severityEmoji[b.severity] || '⚪'} ${b.severity}\n**Status:** ${b.status}\n**Notification Deadline:** ${b.notification_deadline}\n**Affected Users:** ${b.affected_user_ids.length}\n**Data Categories:** ${b.data_categories.join(', ')}` }] };
      }

      case 'list_breaches': {
        const result = await client.listBreaches({
          status: args.status as string | undefined,
          limit: args.limit as number | undefined,
        });
        if (result.breaches.length === 0) {
          return { content: [{ type: 'text', text: 'No breaches found.' }] };
        }
        const breachLines = result.breaches.map(b =>
          `- ${severityEmoji[b.severity] || '⚪'} **${b.title}** — ${b.status} _(${b.id})_`
        ).join('\n');
        return { content: [{ type: 'text', text: `## Data Breaches\n\n${breachLines}` }] };
      }

      case 'get_breach': {
        const result = await client.getBreach(args.id as string);
        const b = result.breach;
        return { content: [{ type: 'text', text: `## Breach Details\n\n**ID:** ${b.id}\n**Title:** ${b.title}\n**Severity:** ${severityEmoji[b.severity] || '⚪'} ${b.severity}\n**Status:** ${b.status}\n**Notification:** ${b.notification_status}\n**Reported By:** ${b.reported_by}\n**Deadline:** ${b.notification_deadline}\n**Created:** ${b.created_at}\n**Updated:** ${b.updated_at}\n\n### Description\n${b.description}\n\n**Affected Users:** ${b.affected_user_ids.join(', ')}\n**Data Categories:** ${b.data_categories.join(', ')}` }] };
      }

      case 'update_breach_status': {
        const result = await client.updateBreachStatus(args.id as string, {
          status: args.status as string,
          notification_status: args.notification_status as string | undefined,
          notes: args.notes as string | undefined,
        });
        const b = result.breach;
        return { content: [{ type: 'text', text: `## ✅ Breach Updated\n\n**ID:** ${b.id}\n**Status:** ${b.status}\n**Notification:** ${b.notification_status}` }] };
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Tuteliq MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
