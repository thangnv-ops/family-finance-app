import React from 'react';

type Props = {
  onGoogle: () => void | Promise<void>;
  error?: string | null;
};

export function LoginScreen({ onGoogle, error }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6">
      <h1 className="text-3xl font-semibold text-slate-900 mb-2">Gia đình Thắng & Vân</h1>
      <p className="text-slate-600 mb-8 text-center max-w-sm">
        Đăng nhập bằng Google để quản lý tài chính gia đình chung.
      </p>
      <button
        type="button"
        onClick={() => void onGoogle()}
        className="rounded-lg bg-slate-900 text-white px-5 py-3 text-sm font-medium hover:bg-slate-800"
      >
        Đăng nhập với Google
      </button>
      {error ? <p className="mt-4 text-sm text-red-600 text-center">{error}</p> : null}
    </div>
  );
}
