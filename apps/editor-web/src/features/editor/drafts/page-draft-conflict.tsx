import { Alert, Modal, Typography } from 'antd';

export type PageDraftConflictDecision = 'reload' | 'keep';

export function requestPageDraftConflictResolution() {
  return new Promise<PageDraftConflictDecision>((resolve) => {
    Modal.confirm({
      title: '页面已在其他位置更新',
      width: 520,
      centered: true,
      closable: false,
      keyboard: false,
      maskClosable: false,
      okText: '重新加载服务端版本',
      cancelText: '保留本地草稿',
      content: (
        <div className="pt-[4px] text-[13px] leading-[22px] text-[#475569]">
          <Typography.Paragraph className="!mb-[10px] !text-[13px] !leading-[22px] !text-[#475569]">
            当前页面已被其他编辑者或另一个窗口保存。为避免覆盖对方内容，本次保存已停止。
          </Typography.Paragraph>
          <Alert
            type="warning"
            showIcon
            message="系统不会自动合并或覆盖"
            description="你可以重新加载最新服务端版本，或先保留当前本地草稿，稍后手动核对。"
          />
        </div>
      ),
      onOk: () => resolve('reload'),
      onCancel: () => resolve('keep'),
    });
  });
}
