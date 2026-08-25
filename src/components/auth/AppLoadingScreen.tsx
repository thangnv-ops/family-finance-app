import React from 'react';

type Props = {
  error?: string | null;
  onRetry?: () => void | Promise<void>;
};

export function AppLoadingScreen({ error, onRetry }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6">
      {error ? (
        <>
          <p className="text-red-600 text-center mb-4">{error}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={() => void onRetry()}
              className="rounded-lg bg-slate-900 text-white px-5 py-3 text-sm font-medium"
            >
              Thử lại
            </button>
          ) : null}
        </>
      ) : (
        <p className="text-slate-600">Đang tải…</p>
      )}
    </div>
  );
}
