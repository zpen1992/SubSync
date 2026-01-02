
import React from 'react';

interface FileUploadProps {
  id: string;
  label: string;
  description: string;
  fileName: string | null;
  onFileSelect: (content: string, name: string) => void;
  accentColor: 'blue' | 'indigo'; // 限定类型
}

const FileUpload: React.FC<FileUploadProps> = ({ id, label, description, fileName, onFileSelect, accentColor }) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    onFileSelect(text, file.name);
  };

  // 预定义类名映射，确保 Tailwind JIT 能够识别这些类名
  const colorMap = {
    blue: {
      border: 'hover:border-blue-500',
      bg: 'bg-blue-50',
      text: 'text-blue-600'
    },
    indigo: {
      border: 'hover:border-indigo-500',
      bg: 'bg-indigo-50',
      text: 'text-indigo-600'
    }
  };

  const style = colorMap[accentColor];

  return (
    <div className="flex-1">
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className={`relative group border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center bg-white shadow-sm hover:shadow-md cursor-pointer ${style.border}`}>
        <input
          type="file"
          id={id}
          accept=".srt,.vtt"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className={`p-3 rounded-full mb-4 group-hover:scale-110 transition-transform ${style.bg} ${style.text}`}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-sm text-gray-600 font-medium">{fileName || '点击或拖拽上传文件'}</p>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </div>
    </div>
  );
};

export default FileUpload;
