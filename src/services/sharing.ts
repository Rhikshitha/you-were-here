import { Share } from 'react-native';

export const sharingService = {
  /**
   * Generates a deep link URL for a place
   */
  getPlaceDeepLink(placeId: string): string {
    return `youwerehere://place/${placeId}`;
  },

  /**
   * Generates a web fallback URL for a place
   */
  getPlaceWebLink(placeId: string): string {
    return `https://youwerehere.app/place/${placeId}`;
  },

  /**
   * Share a place with viral teaser copy (no memory content leakage!)
   */
  async sharePlace(placeName: string, placeId: string): Promise<boolean> {
    try {
      const link = this.getPlaceWebLink(placeId);
      const result = await Share.share({
        title: `Memory at ${placeName}`,
        message: `Someone left a memory at ${placeName}. Go there to unlock what they left behind!\n\n${link}`,
        url: link,
      });
      return result.action === Share.sharedAction;
    } catch (err) {
      console.warn('Share error:', err);
      return false;
    }
  },

  /**
   * Share a specific memory teaser (Enforcing Rule #11: NEVER expose content in share payload!)
   */
  async shareMemoryTeaser(placeName: string, placeId: string): Promise<boolean> {
    try {
      const link = this.getPlaceWebLink(placeId);
      const result = await Share.share({
        title: `Hidden Memory at ${placeName}`,
        message: `A memory was left at ${placeName}. See what they said.\n\n${link}`,
        url: link,
      });
      return result.action === Share.sharedAction;
    } catch (err) {
      console.warn('Share memory teaser error:', err);
      return false;
    }
  },
};
