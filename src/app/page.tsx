'use client';

import { useState } from 'react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'type'>('upload');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setProcessedImage(null);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/process-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setProcessedImage(imageUrl);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;

    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'quote.png';
    link.click();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="flex flex-col items-center justify-center text-center px-4 py-8 max-w-2xl w-full">
        <h1 className="text-5xl font-bold mb-3 text-gray-900">
          Quote Maker
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md">
          Upload or type out caption
        </p>

        <div className="w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-3 px-4 font-medium transition-colors relative ${
                activeTab === 'upload'
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Upload
              {activeTab === 'upload' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('type')}
              disabled
              className="flex-1 py-3 px-4 font-medium text-gray-300 cursor-not-allowed relative"
            >
              Type
            </button>
          </div>

          {!processedImage ? (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  disabled={isProcessing}
                />
                <label
                  htmlFor="file-upload"
                  className={`flex flex-col items-center ${isProcessing ? 'cursor-wait' : 'cursor-pointer'}`}
                >
                  {isProcessing ? (
                    <>
                      <svg
                        className="w-16 h-16 text-gray-400 mb-4 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <span className="text-lg font-medium text-gray-700">
                        Processing...
                      </span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-16 h-16 text-gray-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <span className="text-lg font-medium text-gray-700">
                        Click to upload image
                      </span>
                      <span className="text-sm text-gray-500 mt-2">
                        PNG, JPG, or GIF
                      </span>
                    </>
                  )}
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <img
                  src={processedImage}
                  alt="Processed quote"
                  className="w-full h-auto"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleDownload}
                  className="flex-1 bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={() => {
                    setProcessedImage(null);
                    setSelectedFile(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-900 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Create Another
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
