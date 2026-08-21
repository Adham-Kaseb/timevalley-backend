import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface BunnyVideoResponse {
  id: string;
  guid: string;
  title: string;
  views: number;
  length: number;
  status: number; // 0: Created, 1: Uploaded, 2: Processing, 3: Transcoding, 4: Finished, 5: Error
  thumbnailFileName?: string;
  availableResolutions?: string;
  directUploadUrl?: string;
}

export interface SignedPlaybackUrlResult {
  videoId: string;
  hlsUrl: string;
  iframeUrl: string;
  thumbnailUrl: string;
  expires: number;
  token: string;
}

@Injectable()
export class BunnyService {
  private readonly logger = new Logger(BunnyService.name);

  private readonly apiKey: string = process.env.BUNNY_STREAM_API_KEY || '';
  private readonly libraryId: string = process.env.BUNNY_STREAM_LIBRARY_ID || '';
  private readonly cdnHostname: string = process.env.BUNNY_STREAM_CDN_HOSTNAME || 'video.timevalley.com';
  private readonly tokenSecurityKey: string = process.env.BUNNY_TOKEN_SECURITY_KEY || '';

  /**
   * Generates a secure SHA256 signed playback URL for Bunny Stream HLS and iframe embedding.
   * Prevents unauthorized downloading and URL sharing across users.
   */
  generateSignedPlayback(
    videoId: string,
    options?: { expiresMinutes?: number; userIp?: string; libraryId?: string }
  ): SignedPlaybackUrlResult {
    const libId = options?.libraryId || this.libraryId || 'default-library';
    const expiresMinutes = options?.expiresMinutes || 120; // 2 hours default
    const expires = Math.floor(Date.now() / 1000) + expiresMinutes * 60;
    const userIp = options?.userIp || '';

    let token = '';
    if (this.tokenSecurityKey) {
      // Bunny Token Authentication algorithm: SHA256(tokenSecurityKey + videoId + expires + [userIp])
      const hashString = `${this.tokenSecurityKey}${videoId}${expires}${userIp}`;
      const hash = crypto.createHash('sha256').update(hashString).digest('hex');
      token = hash;
    } else {
      // Fallback pseudo-token for local development
      token = crypto.createHash('sha256').update(`${videoId}-${expires}`).digest('hex');
    }

    const tokenQuery = token ? `?token=${token}&expires=${expires}` : '';
    const hlsUrl = `https://${this.cdnHostname}/${videoId}/playlist.m3u8${tokenQuery}`;
    const iframeUrl = `https://iframe.mediadelivery.net/embed/${libId}/${videoId}${tokenQuery}`;
    const thumbnailUrl = `https://${this.cdnHostname}/${videoId}/thumbnail.jpg${tokenQuery}`;

    return {
      videoId,
      hlsUrl,
      iframeUrl,
      thumbnailUrl,
      expires,
      token,
    };
  }

  /**
   * Creates a new video record in Bunny Stream for uploading.
   */
  async createVideo(title: string, collectionId?: string): Promise<BunnyVideoResponse | null> {
    if (!this.apiKey || !this.libraryId) {
      this.logger.warn('BUNNY_STREAM_API_KEY or BUNNY_STREAM_LIBRARY_ID is not configured.');
      // Return simulated mock payload for development
      const mockGuid = crypto.randomUUID();
      return {
        id: mockGuid,
        guid: mockGuid,
        title,
        views: 0,
        length: 1200,
        status: 0,
        directUploadUrl: `https://video.bunnycdn.com/tusupload/${mockGuid}`,
      };
    }

    try {
      const res = await fetch(`https://video.bunnycdn.com/library/${this.libraryId}/videos`, {
        method: 'POST',
        headers: {
          AccessKey: this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          title,
          collectionId: collectionId || undefined,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Bunny API error (${res.status}): ${errText}`);
      }

      return (await res.json()) as BunnyVideoResponse;
    } catch (err: any) {
      this.logger.error(`Failed to create Bunny video: ${err.message}`);
      throw err;
    }
  }

  /**
   * Fetches video metadata and transcoding progress from Bunny Stream.
   */
  async getVideo(videoId: string): Promise<BunnyVideoResponse | null> {
    if (!this.apiKey || !this.libraryId) {
      return {
        id: videoId,
        guid: videoId,
        title: 'Sample Masterclass Lesson',
        views: 42,
        length: 1500,
        status: 4, // Finished
        availableResolutions: '240p,360p,480p,720p,1080p',
      };
    }

    try {
      const res = await fetch(`https://video.bunnycdn.com/library/${this.libraryId}/videos/${videoId}`, {
        headers: {
          AccessKey: this.apiKey,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        return null;
      }

      return (await res.json()) as BunnyVideoResponse;
    } catch (err: any) {
      this.logger.warn(`Failed to fetch Bunny video ${videoId}: ${err.message}`);
      return null;
    }
  }

  /**
   * Deletes a video from Bunny Stream library.
   */
  async deleteVideo(videoId: string): Promise<boolean> {
    if (!this.apiKey || !this.libraryId) {
      return true;
    }

    try {
      const res = await fetch(`https://video.bunnycdn.com/library/${this.libraryId}/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          AccessKey: this.apiKey,
          Accept: 'application/json',
        },
      });

      return res.ok;
    } catch (err: any) {
      this.logger.warn(`Failed to delete Bunny video ${videoId}: ${err.message}`);
      return false;
    }
  }
}
