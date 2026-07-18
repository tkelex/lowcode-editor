export function parseOptions(optionsText?: string) {
  return (optionsText || '')
    .split(/[,，\n]/)
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const [label, value] = item.includes(':') ? item.split(':') : [item, item];
      return {
        label: label.trim(),
        value: (value || label).trim(),
      };
    });
}

export function parseLineItems(value?: string) {
  return (value || '')
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean)
    .map((item, index) => {
      const [title, description] = item.includes(':') ? item.split(':') : [item, ''];
      return {
        key: String(index),
        title: title.trim(),
        label: title.trim(),
        children: (description || '').trim(),
        description: (description || '').trim(),
      };
    });
}

export function parseJsonArray(value?: string): Array<Record<string, any>> {
  if (!value) return [];

  try {
    const data = JSON.parse(value);
    return Array.isArray(data) ? data : [];
  } catch {
    return value.split('\n').filter(Boolean).map((item, index) => ({
      id: index + 1,
      title: item,
      description: '',
    }));
  }
}

export function parseDescriptions(value?: string) {
  return parseLineItems(value).map(item => ({
    key: item.key,
    label: item.label,
    children: item.children,
  }));
}

export function parseChartData(value?: string) {
  return parseLineItems(value).map(item => ({
    label: item.label,
    value: Number(item.children || 0),
  })).filter(item => Number.isFinite(item.value));
}
