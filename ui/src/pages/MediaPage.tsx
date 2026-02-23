import React from 'react';
import { AppWrapper } from '../App';
import { RiskGauge } from '../components/RiskGauge';
import { SeverityBadge } from '../components/SeverityBadge';
import { TimelineFindings } from '../components/TimelineFindings';
import { CategoryChips } from '../components/CategoryChips';
import { colors } from '../theme';
import type { ToolResultPayload, VoiceAnalysisResult, ImageAnalysisResult, VideoAnalysisResult } from '../types';

function VoiceView({ result }: { result: VoiceAnalysisResult }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <RiskGauge score={result.overall_risk_score} level={result.overall_severity} />
        <div>
          <SeverityBadge level={result.overall_severity} />
          <div style={{ fontSize: 12, color: colors.text.muted, marginTop: 4 }}>
            Language: {result.transcription.language} | Duration: {result.transcription.duration.toFixed(1)}s
          </div>
        </div>
      </div>

      <div style={{ margin: '12px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Transcript</div>
        <div style={{ fontSize: 12, color: colors.text.secondary, background: colors.bg.secondary, padding: 10, borderRadius: 8, maxHeight: 200, overflow: 'auto' }}>
          {result.transcription.text}
        </div>
      </div>

      {result.transcription.segments.length > 0 && (
        <div style={{ margin: '12px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Segments</div>
          {result.transcription.segments.slice(0, 10).map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: colors.text.secondary, marginBottom: 2 }}>
              <span style={{ fontFamily: 'monospace', color: colors.text.muted }}>{s.start.toFixed(1)}s-{s.end.toFixed(1)}s</span>{' '}
              {s.text}
            </div>
          ))}
          {result.transcription.segments.length > 10 && (
            <div style={{ fontSize: 11, color: colors.text.muted, fontStyle: 'italic' }}>
              ...and {result.transcription.segments.length - 10} more segments
            </div>
          )}
        </div>
      )}
    </>
  );
}

function ImageView({ result }: { result: ImageAnalysisResult }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <RiskGauge score={result.overall_risk_score} level={result.overall_severity} />
        <div>
          <SeverityBadge level={result.overall_severity} />
          <div style={{ fontSize: 12, color: colors.text.muted, marginTop: 4 }}>
            {result.vision.contains_text ? 'Contains text' : 'No text detected'}
            {result.vision.contains_faces ? ' | Faces detected' : ''}
          </div>
        </div>
      </div>

      <div style={{ margin: '12px 0', fontSize: 13, color: colors.text.secondary }}>
        {result.vision.visual_description}
      </div>

      {result.vision.visual_categories.length > 0 && <CategoryChips categories={result.vision.visual_categories} />}

      {result.vision.extracted_text && (
        <div style={{ margin: '12px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Extracted Text (OCR)</div>
          <div style={{ fontSize: 12, color: colors.text.secondary, background: colors.bg.secondary, padding: 10, borderRadius: 8 }}>
            {result.vision.extracted_text}
          </div>
        </div>
      )}
    </>
  );
}

function VideoView({ result }: { result: VideoAnalysisResult }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <RiskGauge score={result.overall_risk_score} level={result.overall_severity} />
        <div>
          <SeverityBadge level={result.overall_severity} />
          <div style={{ fontSize: 12, color: colors.text.muted, marginTop: 4 }}>
            {result.frames_analyzed} frames analyzed
          </div>
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Safety Findings</div>
      <TimelineFindings findings={result.safety_findings} />
    </>
  );
}

export function MediaPage({ data }: { data: ToolResultPayload }) {
  const { toolName, result } = data;

  const titleMap: Record<string, string> = {
    analyze_voice: 'Voice Analysis',
    analyze_image: 'Image Analysis',
    analyze_video: 'Video Analysis',
  };

  return (
    <AppWrapper title={titleMap[toolName] || 'Media Analysis'}>
      {toolName === 'analyze_voice' && <VoiceView result={result as VoiceAnalysisResult} />}
      {toolName === 'analyze_image' && <ImageView result={result as ImageAnalysisResult} />}
      {toolName === 'analyze_video' && <VideoView result={result as VideoAnalysisResult} />}
    </AppWrapper>
  );
}
