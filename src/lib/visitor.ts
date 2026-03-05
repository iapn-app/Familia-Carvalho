
export function getVisitorId(): string {
  if (typeof window === 'undefined') return '';

  const STORAGE_KEY = 'fc_visitor_id';
  let visitorId = localStorage.getItem(STORAGE_KEY);

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, visitorId);
  }

  return visitorId;
}
