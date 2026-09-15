const apiBaseUrl = (process.env.API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const runId = Date.now();

async function main() {
  const owner = await registerUser('owner');
  const editor = await registerUser('editor');
  const viewer = await registerUser('viewer');
  const project = await request('/projects', {
    method: 'POST',
    token: owner.token,
    body: { name: `Remote Material Smoke ${runId}` },
  });

  await request(`/projects/${project.id}/members`, {
    method: 'POST',
    token: owner.token,
    body: { email: editor.email, role: 'editor' },
  });
  await request(`/projects/${project.id}/members`, {
    method: 'POST',
    token: owner.token,
    body: { email: viewer.email, role: 'viewer' },
  });

  const editorInstallDenied = await installMaterial(project.id, editor.token, '1.2.0', 403);
  assertEqual(editorInstallDenied.code, 'PROJECT_FORBIDDEN', 'editor must not install remote materials');

  const version1 = await installMaterial(project.id, owner.token, '1.2.0');
  const viewerMaterials = await request(`/projects/${project.id}/remote-materials`, {
    token: viewer.token,
  });
  assertEqual(viewerMaterials[0].version, '1.2.0', 'viewer should read installed remote material');

  const page = await request(`/projects/${project.id}/pages`, {
    method: 'POST',
    token: editor.token,
    body: {
      name: 'Remote Material Page',
      routePath: `/remote-material-${runId}`,
      schema: remotePageSchema(),
    },
  });
  assertEqual(page.materialDependencies[0].version, '1.2.0', 'page create should pin version 1');

  const firstPublish = await request(`/pages/${page.id}/publish`, {
    method: 'POST',
    token: editor.token,
  });
  const firstPublic = await request(`/public/pages/${firstPublish.publicId}`);
  assertEqual(firstPublic.materialDependencies[0].entry, version1.entry, 'public snapshot should expose pinned entry');
  assertEqual(firstPublic.materialDependencies[0].integrity, version1.integrity, 'public snapshot should expose pinned integrity');

  const version2 = await installMaterial(project.id, owner.token, '2.0.0');
  const unchangedPublic = await request(`/public/pages/${firstPublish.publicId}`);
  assertEqual(unchangedPublic.materialDependencies[0].version, '1.2.0', 'project upgrade must not rewrite public snapshot');

  const staleDependencyPublish = await request(`/pages/${page.id}/publish`, {
    method: 'POST',
    token: editor.token,
    expectedStatus: 409,
  });
  assertEqual(
    staleDependencyPublish.code,
    'PAGE_MATERIAL_DEPENDENCY_INVALID',
    'republish should reject a disabled fixed dependency',
  );

  const savedWithVersion2 = await request(`/pages/${page.id}`, {
    method: 'PATCH',
    token: editor.token,
    body: {
      expectedRevision: page.revision,
      schema: remotePageSchema(),
    },
  });
  assertEqual(savedWithVersion2.materialDependencies[0].version, '2.0.0', 'saving should explicitly repin the current version');

  const secondPublish = await request(`/pages/${page.id}/publish`, {
    method: 'POST',
    token: editor.token,
  });
  const secondPublic = await request(`/public/pages/${secondPublish.publicId}`);
  assertEqual(secondPublic.materialDependencies[0].entry, version2.entry, 'republished snapshot should use version 2 entry');

  const viewerDisableDenied = await request(`/remote-materials/${version2.id}`, {
    method: 'PATCH',
    token: viewer.token,
    body: { status: 'disabled' },
    expectedStatus: 403,
  });
  assertEqual(viewerDisableDenied.code, 'PROJECT_FORBIDDEN', 'viewer must not disable remote materials');

  await request(`/remote-materials/${version2.id}`, {
    method: 'PATCH',
    token: owner.token,
    body: { status: 'disabled' },
  });
  const disabledPublish = await request(`/pages/${page.id}/publish`, {
    method: 'POST',
    token: owner.token,
    expectedStatus: 409,
  });
  assertEqual(disabledPublish.code, 'PAGE_MATERIAL_DEPENDENCY_INVALID', 'disabled material should block publish');

  const stillPublic = await request(`/public/pages/${secondPublish.publicId}`);
  assertEqual(stillPublic.materialDependencies[0].version, '2.0.0', 'disabling a project material must not remove the public snapshot');

  console.log(JSON.stringify({
    ok: true,
    projectId: project.id,
    pageId: page.id,
    publicId: secondPublish.publicId,
    versions: ['1.2.0', '2.0.0'],
  }, null, 2));
}

function installMaterial(projectId, token, version, expectedStatus) {
  return request(`/projects/${projectId}/remote-materials`, {
    method: 'POST',
    token,
    expectedStatus,
    body: {
      manifestUrl: `https://cdn.example.com/customer/${version}/manifest.json`,
      manifest: remoteManifest(version),
    },
  });
}

function remoteManifest(version) {
  return {
    protocolVersion: '1',
    name: '@portfolio/customer-materials',
    version,
    entry: './customer-materials.iife.js',
    integrity: 'sha384-YWJjZA==',
    schemaVersion: '1.0.0',
    dependencies: {
      react: '^18.3.1',
      reactDom: '^18.3.1',
      antd: '^5.20.0',
    },
    materials: [{
      name: 'CustomerSummary',
      displayName: '客户摘要',
      category: 'data',
      allowedParents: ['Page'],
    }],
  };
}

function remotePageSchema() {
  return {
    schemaVersion: '1.0.0',
    components: [{
      id: 1,
      name: 'Page',
      desc: '页面',
      props: {},
      children: [{
        id: 2,
        parentId: 1,
        name: 'CustomerSummary',
        desc: '客户摘要',
        props: {},
      }],
    }],
  };
}

async function registerUser(label) {
  const email = `remote-material-${label}-${runId}@example.com`;
  const response = await request('/auth/register', {
    method: 'POST',
    body: {
      email,
      username: `rm_${label}_${runId}`,
      password: 'password123',
    },
  });
  return { email, token: response.accessToken };
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (options.expectedStatus !== undefined) {
    if (response.status !== options.expectedStatus) {
      throw new Error(`${options.method || 'GET'} ${path}: expected ${options.expectedStatus}, received ${response.status} ${JSON.stringify(data)}`);
    }
    return data;
  }
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path}: ${response.status} ${JSON.stringify(data)}`);
  }
  return data;
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
