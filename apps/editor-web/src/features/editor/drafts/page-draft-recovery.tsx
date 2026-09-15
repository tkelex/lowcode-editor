import { Alert, Modal, Typography } from 'antd';
import type { PageDraftLoadResult } from './page-draft-repository';

type RecoverablePageDraft = Extract<PageDraftLoadResult, { status: 'recoverable' }>;

export function requestPageDraftRecovery(draft: RecoverablePageDraft) {
  return new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: '检测到未保存的本地草稿',
      width: 520,
      centered: true,
      closable: false,
      keyboard: false,
      maskClosable: false,
      okText: '恢复本地草稿',
      cancelText: '使用服务端版本',
      content: (
        <div className="pt-[4px] text-[13px] leading-[22px] text-[#475569]">
          <Typography.Paragraph className="!mb-[10px] !text-[13px] !leading-[22px] !text-[#475569]">
            上次修改尚未保存到服务端。恢复后只会写入当前编辑器，仍需手动点击保存。
          </Typography.Paragraph>
          <div className="rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-[12px] py-[10px]">
            <Typography.Text className="!text-[12px] !text-[#64748b]">本地修改时间</Typography.Text>
            <div className="mt-[2px] font-medium text-[#0f172a]">{formatDraftTime(draft.localUpdatedAt)}</div>
          </div>
          {draft.serverChanged && (
            <Alert
              className="mt-[12px]"
              type="warning"
              showIcon
              message="服务端页面在此草稿产生后可能已有更新"
              description="恢复会保留本地内容，但不会自动覆盖服务端；请确认内容后再保存。"
            />
          )}
        </div>
      ),
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}

function formatDraftTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false });
}
