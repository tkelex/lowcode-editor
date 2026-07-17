export function getPublishPublicId(pathname = window.location.pathname) {
  const match = pathname.match(/^\/publish\/([^/]+)$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}
