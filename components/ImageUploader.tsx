
import React, { useState, useRef } from 'react';
import { UploadIcon } from './Icons';

interface ImageUploaderProps {
  onImageUpload: (file: File, zipCode: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [zipCode, setZipCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (files: FileList | null) => {
    if (files && files.length > 0) {
      onImageUpload(files[0], zipCode);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFile(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleFile(e.target.files);
  };

  const onButtonClick = () => {
    if (!zipCode || zipCode.length < 5) {
        alert("Please enter a valid Zip Code first for accurate market analysis.");
        return;
    }
    inputRef.current?.click();
  };

  return (
    <div className="text-center max-w-2xl w-full">
      <h2 className="text-3xl sm:text-4xl font-bold mb-2 font-serif text-[#36454F]">Analyze &amp; Visualize Your Home's Potential</h2>
      <p className="text-lg text-[#36454F] opacity-80 mb-8">
        Upload a photo and provide your location for <span className="font-semibold text-[#5F8575]">Gemini 3 Pro</span> powered hyper-local ROI estimates.
      </p>
      
      <div className="mb-6 max-w-xs mx-auto">
        <label htmlFor="zip" className="block text-sm font-medium text-[#36454F]/70 mb-1 text-left">Location (Zip Code)</label>
        <input 
            type="text" 
            id="zip"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="e.g. 90210"
            className="w-full px-4 py-3 rounded-lg border border-[#9CAFB7]/50 focus:border-[#5F8575] focus:ring-2 focus:ring-[#5F8575]/20 outline-none transition-all text-lg shadow-sm text-center tracking-widest font-serif"
        />
      </div>

      <form
        className={`p-8 border-2 border-dashed rounded-xl transition-colors ${dragActive ? 'border-[#9CAFB7] bg-[#9CAFB7]/10' : 'border-[#9CAFB7]/50 hover:border-[#9CAFB7]'}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleChange}
        />
        <label htmlFor="file-upload" className="flex flex-col items-center justify-center cursor-pointer">
            <UploadIcon className="w-12 h-12 text-[#9CAFB7] mb-4" />
          <p className="mb-2 text-[#36454F]">
            <span className="font-semibold text-[#9CAFB7] cursor-pointer" onClick={onButtonClick}>Click to upload</span> or drag and drop
          </p>
          <p className="text-sm text-[#36454F] opacity-60">PNG, JPG, or WEBP (max 10MB)</p>
        </label>
      </form>
    </div>
  );
};

export default ImageUploader;
