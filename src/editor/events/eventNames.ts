import type { ComponentEventLike } from './types';

export function getLowcodeEventName(name: string) {
  if (name.startsWith('on') && name.length > 2 && name[2] === name[2].toUpperCase()) {
    const eventName = name.slice(2);
    return eventName.charAt(0).toLowerCase() + eventName.slice(1);
  }

  return name;
}

export function getReactEventProp(event: string | ComponentEventLike) {
  if (typeof event !== 'string' && event.propName) {
    return event.propName;
  }

  const name = typeof event === 'string' ? event : event.name;
  if (name.startsWith('on')) {
    return name;
  }

  return `on${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}
