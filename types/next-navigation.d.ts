declare module 'next/navigation' {
  export function useRouter(): {
    push: (url: string) => void;
  };
} 