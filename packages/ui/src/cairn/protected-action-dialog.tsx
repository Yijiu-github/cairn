import { MetadataList } from '../data-display';
import { InlineAlert } from '../feedback';
import {
  Dialog,
  DialogAction,
  DialogCancel,
  DialogDescription,
  DialogFooter,
  DialogPanel,
  DialogTitle,
} from '../primitives';

import type { CairnProtectedActionKind } from './types';

const kindLabel: Record<CairnProtectedActionKind, string> = {
  artifact_delete: '删除产物',
  file_write: '写入文件',
  network: '网络访问',
  other: '受保护动作',
  shell: '执行命令',
  token_access: '读取凭据',
  workspace_reset: '重置工作区',
};

export interface ProtectedActionDialogProps {
  readonly actionKind: CairnProtectedActionKind;
  readonly impact: string;
  readonly onApprove: () => void;
  readonly onCancel: () => void;
  readonly onDeny?: () => void;
  readonly open: boolean;
  readonly target: string;
}

export function ProtectedActionDialog({
  actionKind,
  impact,
  onApprove,
  onCancel,
  onDeny,
  open,
  target,
}: ProtectedActionDialogProps) {
  return (
    <Dialog open={open}>
      <DialogPanel>
        <DialogTitle>批准受保护动作？</DialogTitle>
        <DialogDescription>{kindLabel[actionKind]} 需要你确认影响范围。</DialogDescription>
        <div className="mt-5 grid gap-4">
          <MetadataList
            items={[
              { label: '目标', value: target },
              { label: '影响', value: impact },
              { label: '批准范围', value: '仅本次 tool call' },
            ]}
          />
          <InlineAlert tone="warning">
            批准后会继续当前运行，并写入 operator action trace。
          </InlineAlert>
        </div>
        <DialogFooter>
          <DialogAction onClick={onApprove}>仅本次批准</DialogAction>
          {onDeny === undefined ? undefined : (
            <DialogAction danger onClick={onDeny}>
              拒绝
            </DialogAction>
          )}
          <DialogCancel onClick={onCancel}>返回</DialogCancel>
        </DialogFooter>
      </DialogPanel>
    </Dialog>
  );
}
