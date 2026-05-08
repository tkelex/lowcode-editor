export function createLowcodeEventData(args: any[], eventName?: string) {
  const firstArg = args[0];
  const secondArg = args[1];
  const eventData: Record<string, any> = {
    args,
  };

  if (eventName === 'finish') {
    eventData.values = firstArg || {};
  } else if (eventName === 'finishFailed') {
    eventData.values = firstArg?.values;
    eventData.errorFields = firstArg?.errorFields;
    eventData.outOfDate = firstArg?.outOfDate;
  } else if (eventName === 'valuesChange') {
    eventData.changedValues = firstArg || {};
    eventData.allValues = secondArg || {};
  } else if (eventName === 'fieldsChange') {
    eventData.changedFields = firstArg || [];
    eventData.allFields = secondArg || [];
  } else if (eventName === 'change' && typeof firstArg === 'boolean') {
    eventData.checked = firstArg;
    eventData.value = firstArg;
    eventData.nativeEvent = secondArg;
  } else if (eventName === 'change' && typeof firstArg === 'number' && typeof secondArg === 'number') {
    eventData.value = firstArg;
    eventData.page = firstArg;
    eventData.pageSize = secondArg;
  } else if (eventName === 'change' && typeof secondArg === 'string') {
    eventData.value = firstArg;
    eventData.dateString = secondArg;
  } else if (eventName === 'change' && secondArg !== undefined) {
    eventData.value = firstArg;
    eventData.option = secondArg;
  } else if (eventName === 'search') {
    eventData.value = firstArg;
    eventData.keyword = firstArg;
  } else if (eventName === 'openChange') {
    eventData.open = firstArg;
  } else if (eventName === 'close') {
    eventData.nativeEvent = firstArg;
  } else if (firstArg?.target) {
    eventData.value = firstArg.target.value;
    eventData.checked = firstArg.target.checked;
    eventData.nativeEvent = firstArg;
  } else if (firstArg !== undefined) {
    eventData.value = firstArg;
  }

  return eventData;
}
