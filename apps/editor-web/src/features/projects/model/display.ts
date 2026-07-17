import type { ProjectRole } from '../../../shared/api/types';

export const roleText: Record<ProjectRole, string> = {
  owner: '拥有者',
  editor: '编辑者',
  viewer: '查看者',
};

export const roleColor: Record<ProjectRole, string> = {
  owner: 'gold',
  editor: 'blue',
  viewer: 'default',
};

export const auditActionText: Record<string, string> = {
  'project.create': '创建项目',
  'project.update': '更新项目',
  'project.delete': '删除项目',
  'project.member.add': '添加成员',
  'project.member.update': '变更成员角色',
  'project.member.remove': '移除成员',
  'page.create': '创建页面',
  'page.update': '保存页面',
  'page.publish': '发布页面',
  'page.unpublish': '取消发布',
  'page.rollback': '回滚页面',
  'page.delete': '删除页面',
  'page.version.delete': '删除版本',
  'template.create': '创建模板',
  'template.delete': '删除模板',
  'asset.upload': '上传素材',
  'asset.delete': '删除素材',
};
