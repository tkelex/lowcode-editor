import { expect, test, type Page, type Route } from '@playwright/test';

const now = '2026-05-11T00:00:00.000Z';
const user = {
  id: 1,
  email: 'editor-regression@example.com',
  username: 'editor-regression',
  role: 'admin',
  status: 'active',
};
const project = {
  id: 10,
  ownerId: user.id,
  name: '编辑器回归项目',
  description: '用于自动复盘编辑器核心交互',
  status: 'active',
  currentUserRole: 'owner',
  createdAt: now,
  updatedAt: now,
};
const pageRecord = {
  id: 20,
  projectId: project.id,
  createdById: user.id,
  name: '编辑器回归页面',
  routePath: '/editor-regression',
  isPublished: false,
  publicId: null,
  publishedAt: null,
  publishedVersionId: null,
  createdAt: now,
  updatedAt: now,
  schema: {
    components: [
      {
        id: 1,
        name: 'Page',
        props: {},
        desc: '页面',
        children: [
          {
            id: 1001,
            name: 'Container',
            desc: '容器',
            parentId: 1,
            props: {
              onEvent: {
                click: {
                  actions: [
                    { actionType: 'toast', args: { msgType: 'success', msg: '点击成功' } },
                    { actionType: 'url', args: { url: 'https://baidu.com', target: '_blank' } },
                  ],
                },
              },
            },
            styles: {
              width: '100%',
              minHeight: 160,
              padding: 16,
            },
            children: [
              {
                id: 1003,
                name: 'Button',
                desc: '按钮',
                parentId: 1001,
                props: {
                  text: '按钮',
                  type: 'primary',
                },
                styles: {},
              },
              {
                id: 1002,
                name: 'Input',
                desc: '输入框',
                parentId: 1001,
                props: {
                  placeholder: '请输入内容',
                },
                styles: {},
              },
              {
                id: 1004,
                name: 'Switch',
                desc: '开关',
                parentId: 1001,
                props: {
                  checked: true,
                  checkedChildren: '开',
                  unCheckedChildren: '关',
                },
                styles: {
                  width: '96px',
                  backgroundColor: 'rgb(220, 38, 38)',
                },
              },
              {
                id: 1005,
                name: 'Alert',
                desc: '提示',
                parentId: 1001,
                props: {
                  type: 'info',
                  message: '巡检提示',
                  description: '样式应作用到真实 Alert',
                  showIcon: true,
                },
                styles: {
                  width: '360px',
                  padding: '18px',
                  backgroundColor: 'rgb(254, 249, 195)',
                },
              },
              {
                id: 1006,
                name: 'Textarea',
                desc: '多行输入',
                parentId: 1001,
                props: {
                  placeholder: '多行输入',
                  defaultValue: '巡检文本',
                  rows: 2,
                },
                styles: {
                  width: '310px',
                  padding: '15px',
                  fontSize: '18px',
                },
              },
              {
                id: 1007,
                name: 'DatePicker',
                desc: '日期选择',
                parentId: 1001,
                props: {
                  placeholder: '选择日期',
                },
                styles: {
                  width: '240px',
                  padding: '14px',
                },
              },
              {
                id: 1008,
                name: 'Upload',
                desc: '上传',
                parentId: 1001,
                props: {
                  buttonText: '上传文件',
                },
                styles: {
                  width: '180px',
                  padding: '16px',
                  color: 'rgb(220, 38, 38)',
                },
              },
              {
                id: 1009,
                name: 'Popover',
                desc: '气泡卡片',
                parentId: 1001,
                props: {
                  title: '气泡标题',
                  content: '气泡内容',
                  text: '打开气泡卡片',
                },
                styles: {
                  width: '190px',
                  padding: '13px',
                  color: 'rgb(37, 99, 235)',
                },
              },
              {
                id: 1010,
                name: 'Notification',
                desc: '通知',
                parentId: 1001,
                props: {
                  type: 'info',
                  title: '通知标题',
                  buttonText: '显示通知',
                },
                styles: {
                  width: '180px',
                  padding: '12px',
                  color: 'rgb(22, 163, 74)',
                },
              },
            ],
          },
        ],
      },
    ],
  },
};

const longPageRecord = {
  ...pageRecord,
  id: 21,
  schema: {
    components: [
      {
        id: 1,
        name: 'Page',
        props: {},
        desc: '页面',
        children: Array.from({ length: 7 }, (_, index) => ({
          id: 2001 + index,
          name: 'Container',
          desc: '容器',
          parentId: 1,
          props: {},
          styles: {
            width: '100%',
            minHeight: 180,
            marginBottom: 16,
            padding: 16,
          },
        })),
      },
    ],
  },
};

test('editor setting panel stays readable and preview remains recoverable', async ({ page }) => {
  await mockEditorApi(page);
  await page.goto('/');

  await page.getByRole('button', { name: '打开编辑器' }).click();
  await expect(page.getByText('属性')).toBeVisible();

  const container = page.locator('[data-component-id="1001"]').first();
  await expect(container).toBeVisible();
  await container.click();

  const settingPanel = page.locator('.setting-panel');
  await expect(settingPanel).toBeVisible();
  await expect(settingPanel.locator('.setting-component-title')).toHaveText('容器');
  await expect(settingPanel.locator('.setting-component-subtitle')).toContainText('Container');
  await expect(settingPanel.locator('.setting-component-id')).toHaveText('#1001');

  await expectNoHorizontalOverflow(page, '.setting-panel');
  await expectNoHorizontalOverflow(page, '.edit-area');

  await page.getByRole('tab', { name: '事件' }).click();
  await expect(settingPanel.getByRole('button', { name: '添加事件' })).toBeVisible();
  await expect(settingPanel.getByText('点击事件')).toBeVisible();
  await expect(settingPanel.getByText('2 个动作')).toBeVisible();
  await expect(settingPanel.getByText('消息提醒', { exact: true })).toBeVisible();
  await expect(settingPanel.getByText('跳转链接', { exact: true })).toBeVisible();
  await settingPanel.getByRole('button', { name: '添加事件' }).click();
  await expect(settingPanel.getByText('双击事件')).toBeVisible();
  await settingPanel.getByText('双击事件').click();
  await expect(settingPanel.getByText('0 个动作')).toBeVisible();
  await expectNoHorizontalOverflow(page, '.setting-panel');

  await page.getByRole('button', { name: '预览' }).click();
  await expect(page.getByRole('button', { name: '退出预览' })).toBeVisible();
  await expect(page.getByPlaceholder('请输入内容')).toBeVisible();

  await page.getByRole('button', { name: '退出预览' }).click();
  await expect(settingPanel).toBeVisible();
});

test('editor side panes can be hidden and restored from border toggles', async ({ page }) => {
  await mockEditorApi(page);
  await page.goto('/');

  await openMockEditor(page);

  const canvas = page.locator('.edit-area');
  await expect(canvas).toBeVisible();
  await expect(page.getByText('物料')).toBeVisible();
  await expect(settingPanelLocator(page)).toBeVisible();
  await expectToggleOnPaneEdge(page, '隐藏左侧面板', '.editor-left-panel', 'right');
  await expectToggleOnPaneEdge(page, '隐藏右侧面板', '.setting-panel', 'left');

  await page.getByRole('button', { name: '隐藏左侧面板' }).click();
  await expect(page.getByRole('button', { name: '显示左侧面板' })).toBeVisible();
  await expectTogglePositionStable(page, '显示左侧面板');
  await expect(page.locator('.editor-left-panel')).toHaveCount(0);
  await expect(canvas).toBeVisible();

  await page.getByRole('button', { name: '显示左侧面板' }).click();
  await expect(page.getByText('物料')).toBeVisible();
  await expectPaneWidth(page, '.editor-left-panel', { min: 300 });
  await expectTogglePositionStable(page, '隐藏左侧面板');
  await expectToggleOnPaneEdge(page, '隐藏左侧面板', '.editor-left-panel', 'right');

  await page.getByRole('button', { name: '隐藏右侧面板' }).click();
  await expect(page.getByRole('button', { name: '显示右侧面板' })).toBeVisible();
  await expectTogglePositionStable(page, '显示右侧面板');
  await expect(settingPanelLocator(page)).toHaveCount(0);
  await expect(canvas).toBeVisible();

  await page.getByRole('button', { name: '显示右侧面板' }).click();
  await expect(settingPanelLocator(page)).toBeVisible();
  await expectPaneWidth(page, '.setting-panel', { min: 280 });
  await expectTogglePositionStable(page, '隐藏右侧面板');
  await expectToggleOnPaneEdge(page, '隐藏右侧面板', '.setting-panel', 'left');
});

test('event action modal supports categorized actions and linkage configuration', async ({ page }) => {
  await mockEditorApi(page);
  await page.goto('/');

  await openMockEditor(page);

  const container = page.locator('[data-component-id="1001"]').first();
  await expect(container).toBeVisible();
  await container.click();

  const settingPanel = settingPanelLocator(page);
  await page.getByRole('tab', { name: '事件' }).click();
  await expect(settingPanel.getByText('点击事件')).toBeVisible();
  await expect(settingPanel.getByText('2 个动作')).toBeVisible();

  const clickEventItem = settingPanel.locator('.event-group').filter({ hasText: '点击事件' });
  const addActionButton = clickEventItem.locator('.event-group-tools button').first();
  await expect(addActionButton).toHaveCount(1);
  await addActionButton.hover();
  await expect(settingPanel.getByText('2 个动作')).toBeVisible();
  const pageWidthBeforeToolHover = await page.evaluate(() => document.documentElement.scrollWidth);
  await clickEventItem.locator('.event-group-tools button').last().hover();
  await page.waitForTimeout(300);
  const pageWidthAfterToolHover = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(pageWidthAfterToolHover).toBeLessThanOrEqual(pageWidthBeforeToolHover + 1);

  await addActionButton.click();
  const actionDialog = page.getByRole('dialog', { name: '点击事件 - 动作配置' });
  await expect(actionDialog).toBeVisible();
  await expect(actionDialog.getByText('执行动作', { exact: true })).toBeVisible();
  await expect(actionDialog.getByText('页面', { exact: true })).toBeVisible();
  await expect(actionDialog.getByText('弹窗消息', { exact: true })).toBeVisible();
  await expect(actionDialog.getByText('服务', { exact: true })).toBeVisible();
  await expect(actionDialog.locator('.event-action-category-title').filter({ hasText: '组件联动' })).toHaveCount(1);
  await actionDialog.getByRole('button', { name: '组件联动', exact: true }).click();
  await expect(actionDialog.getByText('操作意图', { exact: true })).toBeVisible();
  await expect(actionDialog.getByText('目标组件', { exact: true })).toBeVisible();
  await actionDialog.locator('.ant-modal-footer .ant-btn').first().click();
  await expect(actionDialog).toHaveCount(0);
  await expect(settingPanel.getByText('2 个动作')).toBeVisible();

  await expect(clickEventItem.getByText('https://baidu.com / 新窗口')).toBeVisible();
  await clickEventItem.locator('.event-action-row').filter({ hasText: '跳转' }).getByRole('button', { name: '编辑动作' }).click();
  const urlDialog = page.getByRole('dialog', { name: '点击事件 - 动作配置' });
  await expect(urlDialog).toBeVisible();
  await expect(urlDialog.locator('.event-action-config-title')).toHaveText('跳转链接');
  await expect(urlDialog.getByText('新窗口', { exact: true })).toBeVisible();
  await expect(urlDialog.locator('.ant-segmented-item-selected')).toContainText('新窗口');
  await urlDialog.getByPlaceholder('例如 https://baidu.com、baidu.com 或 /publish/demo').fill('/publish/next');
  await urlDialog.locator('.ant-modal-footer .ant-btn-primary').click();
  await expect(urlDialog).toHaveCount(0);
  await expect(clickEventItem.getByText('/publish/next / 新窗口')).toBeVisible();
});

test('editor context menu only opens for editable components and closes on blank canvas click', async ({ page }) => {
  await mockEditorApi(page);
  await page.goto('/');

  await page.getByRole('button', { name: '打开编辑器' }).click();

  const component = page.locator('[data-component-id="1001"]').first();
  await expect(component).toBeVisible();
  await component.click({ button: 'right' });

  const contextMenu = page.locator('.ant-dropdown:not(.ant-dropdown-hidden)');
  await expect(contextMenu).toBeVisible();
  await expect(contextMenu.locator('.ant-dropdown-menu-item-disabled')).toHaveCount(0);

  const firstBox = await contextMenu.boundingBox();
  expect(firstBox).not.toBeNull();

  const inputComponent = page.locator('[data-component-id="1002"]').first();
  await inputComponent.click({ button: 'right' });
  await expect(contextMenu).toBeVisible();
  await expect(settingPanelLocator(page).locator('.setting-component-id')).toHaveText('#1002');

  const secondBox = await contextMenu.boundingBox();
  expect(secondBox).not.toBeNull();
  expect(Math.abs((secondBox?.x || 0) - (firstBox?.x || 0))).toBeGreaterThan(20);

  await clickBlankCanvas(page);
  await expect(contextMenu).toHaveCount(0);

  await clickBlankCanvas(page, 'right');
  await expect(page.locator('.ant-dropdown:not(.ant-dropdown-hidden)').filter({ hasText: '复制' })).toHaveCount(0);
});

test('editor clears selected component when clicking blank canvas', async ({ page }) => {
  await mockEditorApi(page);
  await page.goto('/');

  await openMockEditor(page);

  const inputComponent = page.locator('[data-component-id="1002"]').first();
  await expect(inputComponent).toBeVisible();
  await inputComponent.click();

  await expect(page.locator('.editor-mask-selected')).toBeVisible();
  await expect(settingPanelLocator(page).locator('.setting-component-id')).toHaveText('#1002');

  await page.locator('.editor-page').click({ position: { x: 520, y: 260 } });

  await expect(page.locator('.editor-mask-selected')).toHaveCount(0);
  await expect(settingPanelLocator(page).locator('.ant-empty-description')).toBeVisible();
});

test('selected mask supports readable copy names, rename, and compact more menu', async ({ page }) => {
  await mockEditorApi(page);
  await page.goto('/');

  await openMockEditor(page);

  const buttonComponent = page.locator('[data-component-id="1003"]').first();
  await expect(buttonComponent).toBeVisible();
  await buttonComponent.click();

  const toolbar = page.locator('.editor-mask-toolbar');
  await expect(page.locator('.editor-mask-selected-label')).toHaveCount(0);
  await expect(settingPanelLocator(page).locator('.setting-component-title')).toHaveText('按钮');

  await toolbar.dispatchEvent('mouseover');
  await expect(page.locator('.ant-dropdown:not(.ant-dropdown-hidden)').filter({ hasText: '页面' })).toHaveCount(0);

  await page.getByRole('button', { name: '复制' }).click();
  await expect(settingPanelLocator(page).locator('.setting-component-title')).toHaveText('按钮 副本');

  await page.getByRole('button', { name: '重命名' }).click();
  const renameDialog = page.getByRole('dialog', { name: '重命名组件' });
  await expect(renameDialog).toBeVisible();
  await renameDialog.getByPlaceholder('请输入组件名称').fill('主按钮');
  await renameDialog.locator('.ant-modal-footer .ant-btn-primary').click();

  await expect(settingPanelLocator(page).locator('.setting-component-title')).toHaveText('主按钮');

  await page.getByRole('button', { name: '更多操作' }).click();
  await expect(page.locator('.ant-dropdown:not(.ant-dropdown-hidden)').getByText('包裹容器')).toBeVisible();
  await expect(page.locator('.ant-dropdown:not(.ant-dropdown-hidden)').getByText('选择父级：容器')).toBeVisible();
});

test('hover mask label appears on the top right of input components', async ({ page }) => {
  await mockEditorApi(page);
  await page.goto('/');

  await openMockEditor(page);

  const inputComponent = page.locator('[data-component-id="1002"]').first();
  await expect(inputComponent).toBeVisible();
  await inputComponent.hover();

  const hoverMask = page.locator('.editor-mask-hover');
  const maskLabel = page.locator('.editor-mask-label');
  await expect(maskLabel).toHaveText('输入框');

  const maskBox = await hoverMask.boundingBox();
  const labelBox = await maskLabel.boundingBox();
  expect(maskBox).not.toBeNull();
  expect(labelBox).not.toBeNull();
  const rightInset = (maskBox?.x || 0) + (maskBox?.width || 0) - ((labelBox?.x || 0) + (labelBox?.width || 0));
  expect(rightInset).toBeGreaterThanOrEqual(0);
  expect(rightInset).toBeLessThan(24);
  expect((labelBox?.y || 0)).toBeLessThanOrEqual((maskBox?.y || 0) + 2);
});

test('editor canvas grows and scrolls when page content exceeds the first viewport', async ({ page }) => {
  await mockEditorApi(page, longPageRecord);
  await page.goto('/');

  await page.getByRole('button', { name: '打开编辑器' }).click();
  await expect(page.locator('[data-component-id="2001"]').first()).toBeVisible();

  const scrollMetrics = await page.locator('.edit-area').evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));

  expect(scrollMetrics.scrollHeight).toBeGreaterThan(scrollMetrics.clientHeight + 80);

  await page.locator('.edit-area').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });

  const scrollTop = await page.locator('.edit-area').evaluate((element) => element.scrollTop);
  expect(scrollTop).toBeGreaterThan(0);
});

test('setting panel text inputs keep focus while editing component props', async ({ page }) => {
  await mockEditorApi(page);
  await page.goto('/');

  await page.getByRole('button', { name: '打开编辑器' }).click();

  const inputComponent = page.locator('[data-component-id="1002"]').first();
  await expect(inputComponent).toBeVisible();
  await inputComponent.click();

  const propInput = page.locator('.setting-panel-content .ant-form-item-control-input input').first();
  await expect(propInput).toBeVisible();
  await propInput.fill('');
  await propInput.click();

  await page.keyboard.type('a');
  await expect(propInput).toBeFocused();

  await page.keyboard.type('b');
  await expect(propInput).toHaveValue('ab');
  await expect(propInput).toBeFocused();
});

test('setting property panel groups searchable fields and edits extended props', async ({ page }) => {
  await mockEditorApi(page);
  await page.goto('/');

  await openMockEditor(page);

  const settingPanel = settingPanelLocator(page);
  await page.locator('.ant-segmented-item').filter({ hasText: '大纲' }).click();
  await page.locator('.editor-outline-tree').getByText('页面', { exact: true }).click();

  await expect(settingPanel.locator('.property-collapse .ant-collapse-header-text').filter({ hasText: /^基本/ })).toBeVisible();
  await expect(settingPanel.locator('.property-collapse .ant-collapse-header-text').filter({ hasText: /^数据/ })).toBeVisible();
  await expect(settingPanel.locator('.property-collapse .ant-collapse-header-text').filter({ hasText: /^移动端/ })).toBeVisible();
  await expect(settingPanel.getByLabel('页面标题')).toBeVisible();
  await expect(settingPanel.getByRole('textbox', { name: /组件静态数据/ })).toBeVisible();

  const pageTitleInput = settingPanel.getByLabel('页面标题');
  await pageTitleInput.fill('属性面板标题');
  await expect(page.locator('.editor-page-config-title')).toHaveText('属性面板标题');
  await expect(pageTitleInput).toBeFocused();

  await settingPanel.getByLabel('副标题').fill('来自属性页签');
  await expect(page.locator('.editor-page-config-subtitle')).toHaveText('来自属性页签');

  const pullRefresh = settingPanel.getByRole('switch', { name: '下拉刷新' });
  await pullRefresh.click();
  await expect(page.locator('.editor-page-config-badges')).toContainText('下拉刷新');

  const search = settingPanel.getByPlaceholder('搜索属性配置');
  await search.fill('初始化接口');
  await expect(settingPanel.getByLabel('初始化接口')).toBeVisible();
  await expect(settingPanel.getByLabel('页面标题')).toHaveCount(0);
  await search.fill('');

  const container = page.locator('[data-component-id="1001"]').first();
  await container.click();
  const directionSelect = settingPanel.getByLabel('布局方式');
  await expect(directionSelect).toBeVisible();
  await expect(container).toHaveCSS('flex-direction', 'column');
  await settingPanel.locator('.ant-form-item').filter({ hasText: '布局方式' }).locator('.ant-select-selector').click();
  await page.getByTitle('横向').click();
  await expect(container).toHaveCSS('flex-direction', 'row');

  const buttonComponent = page.locator('[data-component-id="1003"]').first();
  await buttonComponent.click();
  await expect(settingPanel.getByText('按钮类型')).toBeVisible();
  await expect(settingPanel.getByRole('switch', { name: '禁用' })).toBeVisible();
  await settingPanel.getByRole('switch', { name: '禁用' }).click();
  await expect(buttonComponent.locator('button')).toBeDisabled();
});

test('setting style inputs update selected component appearance', async ({ page }) => {
  await mockEditorApi(page);
  await page.goto('/');

  await page.getByRole('button', { name: '打开编辑器' }).click();

  const buttonComponent = page.locator('[data-component-id="1003"]').first();
  await expect(buttonComponent).toBeVisible();
  await buttonComponent.click();

  await page.getByRole('tab', { name: '外观' }).click();
  const settingPanel = settingPanelLocator(page);
  await expect(settingPanel.locator('.appearance-collapse-title-text').filter({ hasText: '快捷样式' })).toBeVisible();
  await expect(settingPanel.locator('.appearance-subgroup-title').filter({ hasText: '布局' })).toBeVisible();
  await expect(settingPanel.locator('.appearance-subgroup-title').filter({ hasText: '尺寸' })).toBeVisible();
  await expect(settingPanel.locator('.appearance-subgroup-title').filter({ hasText: '文字' })).toBeVisible();
  await expect(settingPanel.getByText('CSS 源码')).toBeVisible();

  const appearanceSearch = settingPanel.getByPlaceholder('搜索外观配置');
  await appearanceSearch.fill('内边距');
  const paddingControl = settingPanel.locator('.appearance-direction-control').filter({ hasText: '内边距' });
  await expect(paddingControl).toBeVisible();
  await expect(paddingControl.getByRole('radio', { name: '内边距全部' })).toBeVisible();
  await expect(settingPanel.getByLabel('宽度', { exact: true })).toHaveCount(0);
  await appearanceSearch.fill('上内边距');
  await expect(paddingControl.getByRole('radio', { name: '内边距上' })).toHaveAttribute('aria-checked', 'true');
  await appearanceSearch.fill('');

  await paddingControl.getByRole('radio', { name: '内边距全部' }).click();
  const buttonPaddingInput = paddingControl.locator('input');
  await buttonPaddingInput.fill('18');
  await expect(buttonComponent.locator('button')).toHaveCSS('padding-left', '18px');
  await paddingControl.getByRole('radio', { name: '内边距上' }).click();
  await buttonPaddingInput.fill('10');
  await expect(buttonComponent.locator('button')).toHaveCSS('padding-top', '10px');
  const buttonColorInput = page.getByLabel('文字颜色', { exact: true });
  await buttonColorInput.fill('#dc2626');
  await expect(buttonComponent.locator('button')).toHaveCSS('color', 'rgb(220, 38, 38)');
  const borderControl = settingPanel.locator('.appearance-compound-control').filter({ hasText: '边框' });
  await expect(borderControl).toBeVisible();
  const buttonRadiusInput = borderControl.getByLabel('圆角', { exact: true });
  await buttonRadiusInput.fill('12');
  await expect(buttonComponent.locator('button')).toHaveCSS('border-radius', '12px');
  await appearanceSearch.fill('背景');
  await expect(page.getByLabel('背景色', { exact: true })).toBeVisible();
  await expect(settingPanel.getByLabel('圆角', { exact: true })).toHaveCount(0);
  await appearanceSearch.fill('');
  const sizeControl = settingPanel.locator('.appearance-pair-control').filter({ hasText: '尺寸' }).first();
  await expect(sizeControl).toBeVisible();
  const buttonWidthInput = sizeControl.locator('input').first();
  const buttonHeightInput = sizeControl.locator('input').nth(1);
  await buttonWidthInput.fill('168');
  await buttonHeightInput.fill('44');
  await expect(buttonComponent).toHaveCSS('width', '168px');
  await expect(buttonComponent).toHaveCSS('height', '44px');
  await expect(buttonComponent.locator('button')).toHaveCSS('width', '168px');
  await expect(buttonComponent.locator('button')).toHaveCSS('height', '44px');

  const inputComponent = page.locator('[data-component-id="1002"]').first();
  await expect(inputComponent).toBeVisible();
  await inputComponent.click();

  const inputSizeControl = settingPanel.locator('.appearance-pair-control').filter({ hasText: '尺寸' }).first();
  const widthInput = inputSizeControl.locator('input').first();
  const inputControl = inputComponent.locator('.ant-input-affix-wrapper, input').first();
  await expect(widthInput).toBeVisible();
  await expect(page.locator('.setting-panel').getByText('px').first()).toBeVisible();
  await widthInput.fill('320');

  await expect(inputComponent).toHaveCSS('width', '320px');
  await expect(inputControl).toHaveCSS('width', '320px');
  await expect(widthInput).toHaveValue('320');
  await expect(widthInput).toBeFocused();

  await widthInput.fill('');
  await expect(inputComponent).not.toHaveCSS('width', '320px');
  await expect(inputControl).not.toHaveCSS('width', '320px');
  await expect(widthInput).toHaveValue('');

  await widthInput.fill('280');
  await expect(inputComponent).toHaveCSS('width', '280px');
  await expect(inputControl).toHaveCSS('width', '280px');

  await widthInput.fill('');
  const cssEditor = page.locator('.appearance-css-editor-shell .monaco-editor').first();
  await expect(cssEditor).toBeVisible();
  await cssEditor.click();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('End');
  await page.keyboard.insertText('\n  width: 260px;\n  padding: 12px;');
  await expect(inputComponent).toHaveCSS('width', '260px');
  await expect(inputControl).toHaveCSS('width', '260px');
  await expect(inputControl).toHaveCSS('padding-left', '12px');
  await expect(widthInput).toHaveValue('260');
  const inputPaddingControl = settingPanel.locator('.appearance-direction-control').filter({ hasText: '内边距' });
  await inputPaddingControl.getByRole('radio', { name: '内边距全部' }).click();
  await expect(inputPaddingControl.locator('input')).toHaveValue('12');

  await page.getByRole('button', { name: '恢复默认样式' }).click();
  await expect(inputComponent).not.toHaveCSS('width', '260px');
  await expect(inputControl).not.toHaveCSS('width', '260px');
  await expect(widthInput).toHaveValue('');
  await expect(inputPaddingControl.locator('input')).toHaveValue('');
});

test('styled form and feedback materials apply visual styles to real controls', async ({ page }) => {
  await mockEditorApi(page);
  await page.goto('/');

  await openMockEditor(page);

  const switchShell = page.locator('[data-component-id="1004"]').first();
  await expect(switchShell).toHaveCSS('width', '96px');
  await expect(switchShell.locator('.ant-switch')).toHaveCSS('background-color', 'rgb(220, 38, 38)');

  const alertShell = page.locator('[data-component-id="1005"]').first();
  await expect(alertShell).toHaveCSS('width', '360px');
  await expect(alertShell.locator('.ant-alert')).toHaveCSS('padding-top', '18px');
  await expect(alertShell.locator('.ant-alert')).toHaveCSS('background-color', 'rgb(254, 249, 195)');

  const textareaShell = page.locator('[data-component-id="1006"]').first();
  await expect(textareaShell).toHaveCSS('width', '310px');
  await expect(textareaShell.locator('textarea')).toHaveCSS('width', '310px');
  await expect(textareaShell.locator('textarea')).toHaveCSS('padding-left', '15px');
  await expect(textareaShell.locator('textarea')).toHaveCSS('font-size', '18px');

  const datePickerShell = page.locator('[data-component-id="1007"]').first();
  await expect(datePickerShell).toHaveCSS('width', '240px');
  await expect(datePickerShell.locator('.ant-picker')).toHaveCSS('width', '240px');
  await expect(datePickerShell.locator('.ant-picker')).toHaveCSS('padding-left', '14px');

  const uploadShell = page.locator('[data-component-id="1008"]').first();
  await expect(uploadShell).toHaveCSS('width', '180px');
  await expect(uploadShell.locator('button')).toHaveCSS('width', '180px');
  await expect(uploadShell.locator('button')).toHaveCSS('padding-left', '16px');
  await expect(uploadShell.locator('button')).toHaveCSS('color', 'rgb(220, 38, 38)');

  const popoverShell = page.locator('[data-component-id="1009"]').first();
  await expect(popoverShell).toHaveCSS('width', '190px');
  await expect(popoverShell.locator('button')).toHaveCSS('width', '190px');
  await expect(popoverShell.locator('button')).toHaveCSS('padding-left', '13px');
  await expect(popoverShell.locator('button')).toHaveCSS('color', 'rgb(37, 99, 235)');

  const notificationShell = page.locator('[data-component-id="1010"]').first();
  await expect(notificationShell).toHaveCSS('width', '180px');
  await expect(notificationShell.locator('button')).toHaveCSS('width', '180px');
  await expect(notificationShell.locator('button')).toHaveCSS('padding-left', '12px');
  await expect(notificationShell.locator('button')).toHaveCSS('color', 'rgb(22, 163, 74)');
});

async function mockEditorApi(page: Page, editorPage = pageRecord) {
  await page.addInitScript(() => {
    window.localStorage.removeItem('xxx');
    window.localStorage.setItem('lowcode_editor_token', 'mock-editor-token');
  });

  await page.route('http://localhost:3000/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const pathname = url.pathname.replace(/^\/api/, '');

    if (method === 'GET' && pathname === '/auth/me') {
      await json(route, user);
      return;
    }

    if (method === 'GET' && pathname === '/projects') {
      await json(route, [project]);
      return;
    }

    if (method === 'GET' && pathname === `/projects/${project.id}/pages`) {
      await json(route, [editorPage]);
      return;
    }

    if (method === 'GET' && pathname === `/pages/${editorPage.id}`) {
      await json(route, editorPage);
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: `${method} ${pathname} is not mocked` }),
    });
  });
}

async function openMockEditor(page: Page) {
  await page.getByRole('button', { name: '打开编辑器' }).click();
}

async function expectNoHorizontalOverflow(page: Page, selector: string) {
  const result = await page.locator(selector).evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));

  expect(result.scrollWidth, `${selector} should not overflow horizontally`).toBeLessThanOrEqual(result.clientWidth + 1);
}

async function expectPaneWidth(page: Page, selector: string, range: { min?: number; max?: number }) {
  const width = await page.locator(selector).evaluate((element) => element.getBoundingClientRect().width);

  if (range.min !== undefined) {
    expect(width, `${selector} width`).toBeGreaterThanOrEqual(range.min);
  }

  if (range.max !== undefined) {
    expect(width, `${selector} width`).toBeLessThanOrEqual(range.max);
  }
}

async function clickBlankCanvas(page: Page, button: 'left' | 'right' = 'left') {
  const box = await getBoundingBox(page.locator('.editor-page'));
  const x = box.x + 16;
  const y = box.y + 16;

  await page.mouse.click(x, y, { button });
}

async function expectTogglePositionStable(page: Page, name: string) {
  const button = page.getByRole('button', { name });
  const before = await getBoundingBox(button);
  await page.waitForTimeout(220);
  const after = await getBoundingBox(button);

  expect(Math.abs(after.x - before.x), `${name} x should stay stable`).toBeLessThanOrEqual(1);
  expect(Math.abs(after.y - before.y), `${name} y should stay stable`).toBeLessThanOrEqual(1);
}

async function expectToggleOnPaneEdge(page: Page, name: string, paneSelector: string, edge: 'left' | 'right') {
  const buttonBox = await getBoundingBox(page.getByRole('button', { name }));
  const paneBox = await getBoundingBox(page.locator(paneSelector));
  const buttonEdge = edge === 'left' ? buttonBox.x : buttonBox.x + buttonBox.width;
  const paneEdge = edge === 'left' ? paneBox.x : paneBox.x + paneBox.width;

  expect(Math.abs(buttonEdge - paneEdge), `${name} should stay near ${paneSelector} ${edge} edge`).toBeLessThanOrEqual(24);
}

async function getBoundingBox(locator: ReturnType<Page['locator']>) {
  const box = await locator.boundingBox();

  expect(box).not.toBeNull();
  return box!;
}

function settingPanelLocator(page: Page) {
  return page.locator('.setting-panel');
}

async function json(route: Route, data: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(data),
  });
}
