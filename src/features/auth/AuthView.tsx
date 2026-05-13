import { Button, Card, Form, Input, Space, Typography, message } from 'antd';
import { useState } from 'react';
import { login, register } from '../../shared/api/auth';
import { User } from '../../shared/api/types';

interface AuthViewProps {
  onAuthenticated: (user: User) => void;
}

export function AuthView({ onAuthenticated }: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  async function handleFinish(values: { account?: string; email?: string; username?: string; password: string }) {
    setLoading(true);
    try {
      const result = mode === 'login'
        ? await login({ account: values.account!.trim(), password: values.password })
        : await register({
          email: values.email!.trim().toLowerCase(),
          username: values.username!.trim(),
          password: values.password,
        });
      message.success(mode === 'login' ? '登录成功' : '注册成功');
      onAuthenticated(result.user);
    } catch (error) {
      message.error(mode === 'login' ? '登录失败，请检查账号密码' : '注册失败，请检查输入信息');
    } finally {
      setLoading(false);
    }
  }

  return <div className="min-h-screen flex items-center justify-center bg-slate-100">
    <Card className="w-[420px]" title="低代码编辑器">
      <Typography.Paragraph type="secondary">
        {mode === 'login' ? '登录后管理你的低代码项目。' : '创建账号后开始搭建页面。'}
      </Typography.Paragraph>
      <Form layout="vertical" onFinish={handleFinish}>
        {mode === 'login' ? <Form.Item name="account" label="邮箱或用户名" rules={[{ required: true, message: '请输入邮箱或用户名' }]}>
          <Input />
        </Form.Item> : <>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="username" label="用户名" rules={[{ required: true, min: 3, message: '用户名至少 3 位' }]}>
            <Input />
          </Form.Item>
        </>}
        <Form.Item name="password" label="密码" rules={[{ required: true, min: 6, message: '密码至少 6 位' }]}>
          <Input.Password />
        </Form.Item>
        <Space className="w-full justify-between">
          <Button type="primary" htmlType="submit" loading={loading}>
            {mode === 'login' ? '登录' : '注册'}
          </Button>
          <Button type="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? '没有账号？去注册' : '已有账号？去登录'}
          </Button>
        </Space>
      </Form>
    </Card>
  </div>
}
