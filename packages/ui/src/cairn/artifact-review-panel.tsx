import { MetadataList } from '../data-display';
import { InlineAlert, StatusBadge } from '../feedback';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Textarea,
} from '../primitives';

import type { CairnComponentAction, CairnReviewState } from './types';
import type { HTMLAttributes } from 'react';

export interface ArtifactReviewPanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly actions?: readonly CairnComponentAction[];
  readonly artifactId: string;
  readonly note?: string;
  readonly onNoteChange?: (note: string) => void;
  readonly reviewState: CairnReviewState;
  readonly title: string;
}

export function ArtifactReviewPanel({
  actions = [],
  artifactId,
  note = '',
  onNoteChange,
  reviewState,
  title,
  ...props
}: ArtifactReviewPanelProps) {
  return (
    <Card {...props}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <StatusBadge label={reviewState} tone="info" />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <MetadataList
          items={[{ label: 'Artifact ID', value: <span className="font-mono">{artifactId}</span> }]}
        />
        <InlineAlert tone="warning">审阅前请确认产物来源链和敏感信息标记。</InlineAlert>
        <Textarea
          onChange={(event) => {
            onNoteChange?.(event.target.value);
          }}
          placeholder="写下审阅意见…"
          value={note}
        />
      </CardContent>
      {actions.length === 0 ? undefined : (
        <CardFooter>
          {actions.map((action) => (
            <Button
              key={action.label}
              disabled={action.disabled}
              onClick={action.onClick}
              size="sm"
              variant={
                action.tone === 'danger'
                  ? 'danger'
                  : action.tone === 'primary'
                    ? 'primary'
                    : 'secondary'
              }
            >
              {action.label}
            </Button>
          ))}
        </CardFooter>
      )}
    </Card>
  );
}
