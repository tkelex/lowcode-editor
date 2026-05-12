import { Drawer, List, Space, Tag, Typography } from 'antd';

const shortcuts = [
  { keys: 'Ctrl / Cmd + S', label: '保存当前页面' },
  { keys: 'Ctrl / Cmd + Z', label: '撤销上一步编辑' },
  { keys: 'Ctrl / Cmd + Shift + Z / Ctrl + Y', label: '重做编辑' },
  { keys: 'Ctrl / Cmd + P', label: '进入或退出预览模式' },
  { keys: 'Esc', label: '预览模式下退出预览' },
  { keys: 'Ctrl / Cmd + /', label: '打开快捷键帮助' },
];

export function ShortcutDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <Drawer
    title="快捷键"
    open={open}
    width={420}
    onClose={onClose}
  >
    <List
      dataSource={shortcuts}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            title={<Space>
              <Tag color="blue">{item.keys}</Tag>
              <Typography.Text>{item.label}</Typography.Text>
            </Space>}
          />
        </List.Item>
      )}
    />
  </Drawer>;
}
