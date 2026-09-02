export const statusText = {
  active: '正常',
  disabled: '禁用',
};

export const auditActionText: Record<string, string> = {
  'admin.user.disable': '禁用用户',
  'admin.user.enable': '启用用户',
  'admin.project.disable': '禁用项目',
  'admin.project.enable': '启用项目',
  'admin.page.unpublish': '取消发布',
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
  'asset.upload': '上传素材',
  'asset.delete': '删除素材',
};

export type StatusFilter = 'all' | 'active' | 'disabled';
