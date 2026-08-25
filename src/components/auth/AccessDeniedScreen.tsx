import React from 'react';

type Props = {
  onSignOut: () => void | Promise<void>;
  email?: string | null;
  error?: string | null;
};

export function AccessDeniedScreen({ onSignOut, email, error }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6">
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">Không có quyền truy cập</h1>
      <p className="text-slate-600 mb-2 text-center max-w-sm">
        Tài khoản Google này không nằm trong danh sách được phép của hộ gia đình.
      </p>
      {email ? (
        <p className="text-slate-500 mb-2 text-center text-sm">{email}</p>
      ) : null}
      {error ? (
        <p className="text-rose-600 mb-6 text-center text-sm max-w-sm">{error}</p>
      ) : (
        <div className="mb-6" />
      )}
      <button
        type="button"
        onClick={() => void onSignOut()}
        className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 hover:bg-slate-100"
      >
        Đăng xuất
      </button>
    </div>
  );
}
