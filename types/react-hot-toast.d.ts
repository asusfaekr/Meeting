declare module 'react-hot-toast' {
  export function toast(options: {
    title: string;
    description: string;
    variant?: 'default' | 'destructive';
  }): void;
} 