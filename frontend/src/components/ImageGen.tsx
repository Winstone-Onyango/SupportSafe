'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { useState } from 'react';
import Image from 'next/image';
import { Skeleton } from './ui/skeleton'; // Assuming Skeleton component is from your UI library

// Zod validation schema for form
const FormSchema = z.object({
  generatedText: z.string(),
  imagePrompt: z
    .string()
    .min(3, { message: 'Please specify the image prompt.' }),
});

export default function ImageGen({
  text,
  textGemma,
  setResImage,
}: {
  text: string;
  textGemma: string;
  setResImage: (resImage: string) => void;
}) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      generatedText: text || '',
      imagePrompt: '',
    },
  });

  const [imageOptions, setImageOptions] = useState<string[] | null>(null); // To hold the array of image URLs
  const [isLoading, setIsLoading] = useState<boolean>(false); // Loading state for images
  const [genError, setGenError] = useState<string>(''); // Friendly error message
  const [selectedText, setSelectedText] = useState<string>('');

  const promptSuggestions = [
    'Good Morning',
    'Good Night',
    'Sunset',
    'Mountains',
    'Ocean',
  ];
  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsLoading(true); // Start loading state
    setGenError(''); // Clear previous errors
    try {
      const res = await axios.post('/api/generate-image', data);
      setImageOptions(res.data.images); // Set multiple image options
    } catch (error) {
      console.error('Error generating images:', error);
      const detail =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.response?.data?.error || 'Image generation failed. Please try again.';
      setGenError(detail);
    } finally {
      setIsLoading(false); // End loading state
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    form.setValue('imagePrompt', suggestion);
  };

  const handleImageSelect = (imageUrl: string) => {
    setResImage(imageUrl); // Update the parent component with the final image URL
  };

    const handleTextOptionClick = (selected: string) => {
    setSelectedText(selected);
    form.setValue('generatedText', selected);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-4xl mx-auto space-y-6 sm:space-y-9 w-full px-2 sm:px-4"
      >
        <FormField
          control={form.control}
          name="generatedText"
          render={() => (
            <FormItem>
              <FormLabel>Generated Text</FormLabel>
              <FormControl>
                {!selectedText ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                    {[text, textGemma].map((textOption, index) => (
                      <div
                        key={index}
                        onClick={() => handleTextOptionClick(textOption)}
                        className="cursor-pointer rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-3 hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors duration-150"
                      >
                        <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                          {textOption}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="relative w-full rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-3">
                    <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words max-h-56 overflow-y-auto pr-2">
                      {selectedText}
                    </p>
                  </div>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imagePrompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image Prompt</FormLabel>
              <FormControl>
                <Input
                  className=""
                  placeholder="Enter Image Prompt (e.g., Good Morning, Sunset)"
                  {...field}
                />
              </FormControl>
              <div className="flex flex-wrap gap-2 mt-2">
                {promptSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="bg-slate-200 text-slate-700 text-sm px-3 py-1 rounded-xl hover:bg-slate-300 transition duration-150"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {genError && (
          <div className="rounded-lg border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {genError}
          </div>
        )}

        <Button type="submit" className="w-full">
          Generate Images
        </Button>
      </form>

      {isLoading ? (
        // Skeleton loader shown while the images are being generated
        <div className="mt-6 space-y-4 px-2 sm:px-4">
          <h2 className="text-xl font-semibold">Generating Images...</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(2)].map((_, index) => (
              <Skeleton key={index} className="h-48 w-full bg-gray-300" />
            ))}
          </div>
        </div>
      ) : imageOptions && imageOptions.length > 0 ? (
        <div className="mt-6 space-y-4 mb-6 px-2 sm:px-4">
          <h2 className="text-xl font-semibold">Select an Image</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {imageOptions.map((imageUrl, index) => (
              <div
                key={index}
                className="cursor-pointer shadow hover:shadow-lg hover:scale-[1.02] duration-200 rounded-md overflow-hidden"
                onClick={() => handleImageSelect(imageUrl)}
              >
                <div className="relative w-full aspect-square">
                  <Image
                    src={imageUrl}
                    alt={`Generated Image ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Form>
  );
}