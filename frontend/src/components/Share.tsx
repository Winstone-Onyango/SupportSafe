'use client';

import React from 'react';
import { Button } from './ui/button';
import { ShareIcon } from 'lucide-react';
import Image from 'next/image';
import axios from 'axios';
import toast from 'react-hot-toast';

/** Automatic hashtag attached to every shared report. */
export const REPORT_HASHTAG = 'IloveSupportSafe';

interface ShareProps {
  imageURL: string;
  resText: string;
  setShared: (shared: boolean) => void;
}

function Share({ imageURL, resText, setShared }: ShareProps) {
  const [encodedImage, setEncodedImage] = React.useState<string>('');
  const [encoding, setEncoding] = React.useState<boolean>(false);
  const [encoded, setEncoded] = React.useState<boolean>(false);

  /** Hide the victim's message inside the image, then save the report. */
  const handleCommonFunction = async () => {
    // 1) CRITICAL: encode the message into the image.
    try {
      setEncoding(true);
      const encodeRes = await axios.post('/api/encode-image', {
        text: resText,
        img_url: imageURL,
      });
      setEncodedImage(encodeRes.data.encodedImage);
      setEncoded(true);
      toast.success(
        `Your message is hidden in the image. Post it with #${REPORT_HASHTAG} so the team can find it.`
      );
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.response?.data?.error ||
        'Failed to hide your message in the image';
      toast.error(detail);
      return;
    } finally {
      setEncoding(false);
    }

    // 2) BEST-EFFORT: extract details and save the report locally.
    //    A failure here must never block the victim from sharing the image.
    try {
      const decomposeReq = await axios.post('/api/decompose', {
        resText: resText,
      });
      const data = {
        ...decomposeReq.data.decomposed,
        status: 'pending',
      };
      const saveReq = await axios.post('/api/save', data);
      if (saveReq.status !== 200) {
        console.log('Failed to save to DB');
      }
    } catch (error) {
      console.error('Report detail extraction/saving failed:', error);
      toast(
        'Your image is ready to share. (Report details could not be saved, but sharing still works.)',
        { icon: '⚠️' }
      );
    }
  };

  /**
   * DISCREET CAPTION:
   * The victim's real message is hidden inside the image (steganography).
   * The public post caption must NOT reveal that anything is hidden —
   * otherwise the cover is blown. The #IloveSupportSafe hashtag is the
   * only signal the monitoring team needs to locate and decode the post.
   */
  const shareCaption = `Something worth sharing today. #${REPORT_HASHTAG}`;

  /**
   * TELEGRAM CHANNEL FLOW:
   * The encoded image + caption are posted DIRECTLY to the SupportSafe
   * Telegram channel through the backend bot - the victim just clicks once
   * and the report appears in the channel. If the bot cannot post (e.g. it
   * has not been added as a channel admin), the victim sees a clear error
   * instead of the generic share dialog.
   */
  const handleShareTelegram = async () => {
    if (!encodedImage) return;
    try {
      const res = await axios.post('/api/send-to-telegram', {
        image_url: encodedImage,
        caption: shareCaption,
      });
      if (res.status === 200) {
        toast.success('Your report was posted to the SupportSafe Telegram channel.');
        setShared(true);
        return;
      }
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.response?.data?.detail ||
        'Could not post to the Telegram channel. Please try again later.';
      toast.error(detail);
    }
  };

  const handleShareTwitter = () => {
    if (!encodedImage) return;
    const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      encodedImage
    )}&text=${encodeURIComponent(shareCaption)}&hashtags=${REPORT_HASHTAG}`;
    window.open(twitterShareUrl, '_blank');
    setShared(true);
  };

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {/* Image preview: fluid square that never exceeds the screen width */}
      <div className="relative aspect-square w-full max-w-[500px]">
        <Image
          src={imageURL}
          alt="Generated Image"
          fill
          sizes="(max-width: 640px) 100vw, 500px"
          className="rounded-md object-cover"
        />
      </div>

      <p className="max-w-lg px-1 text-center text-xs text-gray-600 dark:text-gray-300 sm:text-sm">
        When you press a share button below, your message is first{' '}
        <span className="font-semibold">hidden inside the image</span> and the
        post automatically includes{' '}
        <span className="font-semibold text-blue-700 dark:text-blue-300">
          #{REPORT_HASHTAG}
        </span>
        . Always share the image link, not a screenshot.
      </p>

      {/* Buttons stack full-width on phones and sit in a row on wider screens */}
      <div className="flex w-full flex-col items-stretch justify-center gap-3 px-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        {encoding ? (
          <Button variant="default" disabled className="w-full sm:w-auto">
            Hiding your message...
          </Button>
        ) : !encoded ? (
          <Button
            variant="default"
            onClick={handleCommonFunction}
            className="flex w-full items-center justify-center gap-2 sm:w-auto"
          >
            <ShareIcon size={24} />
            Prepare Image for Sharing
          </Button>
        ) : (
          <>
            <Button
              variant="default"
              className="flex w-full items-center justify-center gap-2 sm:w-auto"
              onClick={handleShareTelegram}
            >
              <ShareIcon size={24} />
              Share on Telegram
            </Button>
            <Button
              variant="default"
              className="flex w-full items-center justify-center gap-2 bg-black text-white sm:w-auto"
              onClick={handleShareTwitter}
            >
              <ShareIcon size={24} />
              Share on Twitter
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default Share;
