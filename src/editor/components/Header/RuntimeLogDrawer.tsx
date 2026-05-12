import { Button, Drawer, List, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import type { RuntimeLogEntry } from '../../stores/runtime-logs';

interface RuntimeLogDrawerProps {
  open: boolean;
  logs: RuntimeLogEntry[];
  onClose: () => void;
  onClear: () => void;
}

export function RuntimeLogDrawer({ open, logs, onClose, onClear }: RuntimeLogDrawerProps) {
  return <Drawer
    title="运行日志"
    open={open}
    width={520}
    onClose={onClose}
    extra={<Button onClick={onClear} disabled={logs.length === 0}>清空</Button>}
  >
    <List
      dataSource={logs}
      locale={{ emptyText: '暂无运行日志' }}
      renderItem={(log) => (
        <List.Item>
          <List.Item.Meta
            title={<Space wrap>
              <Tag color={log.level === 'error' ? 'red' : log.level === 'warning' ? 'gold' : 'blue'}>
                {log.level === 'error' ? '错误' : log.level === 'warning' ? '警告' : '信息'}
              </Tag>
              <Typography.Text strong>{log.title}</Typography.Text>
              <Typography.Text type="secondary">{dayjs(log.createdAt).format('HH:mm:ss')}</Typography.Text>
            </Space>}
            description={<Space direction="vertical" size={6} className="w-full">
              <Typography.Text type="secondary">
                {[
                  log.componentDesc || log.componentName ? `组件：${log.componentDesc || log.componentName}(${log.componentId})` : '',
                  log.eventName ? `事件：${log.eventName}` : '',
                  log.actionType ? `动作：${log.actionType}` : '',
                ].filter(Boolean).join(' / ') || '运行时'}
              </Typography.Text>
              <Typography.Text type="danger">{log.message}</Typography.Text>
              {log.stack && (
                <Typography.Paragraph
                  className="max-h-[160px] overflow-auto rounded-[6px] bg-[#f8fafc] p-[8px] text-[12px]"
                  copyable
                >
                  {log.stack}
                </Typography.Paragraph>
              )}
            </Space>}
          />
        </List.Item>
      )}
    />
  </Drawer>;
}
