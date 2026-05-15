import { InlineAlert } from '../feedback';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
} from '../primitives';

import type { HTMLAttributes } from 'react';

export interface DiagnosticExportPanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly includeLogs: boolean;
  readonly includePaths: boolean;
  readonly onExport: () => void;
  readonly onIncludeLogsChange: (checked: boolean) => void;
  readonly onIncludePathsChange: (checked: boolean) => void;
}

export function DiagnosticExportPanel({
  includeLogs,
  includePaths,
  onExport,
  onIncludeLogsChange,
  onIncludePathsChange,
  ...props
}: DiagnosticExportPanelProps) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>导出诊断包</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <InlineAlert tone="warning">
          Token 默认脱敏；本地路径和文件名仍可能包含个人信息。
        </InlineAlert>
        <Checkbox
          checked={includeLogs}
          label="包含最近日志"
          onChange={(event) => {
            onIncludeLogsChange(event.target.checked);
          }}
        />
        <Checkbox
          checked={includePaths}
          description="路径可能暴露用户名、项目名或私人目录结构。"
          label="包含本地路径"
          onChange={(event) => {
            onIncludePathsChange(event.target.checked);
          }}
        />
      </CardContent>
      <CardFooter>
        <Button onClick={onExport}>导出脱敏诊断包</Button>
      </CardFooter>
    </Card>
  );
}
