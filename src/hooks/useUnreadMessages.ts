import { useMessages } from './useMessages';

export const useUnreadMessages = () => {
  const { unreadCountMap = {} } = useMessages(null);
  const totalUnread = Object.values(unreadCountMap).reduce((sum, count) => sum + count, 0);
  return { totalUnread };
};
