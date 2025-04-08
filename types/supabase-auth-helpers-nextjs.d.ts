declare module '@supabase/auth-helpers-nextjs' {
  export function createClientComponentClient(): {
    auth: {
      getUser: () => Promise<{ data: { user: any } }>;
    };
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: any) => Promise<{ data: any[]; error: any }>;
      };
      delete: () => {
        eq: (column: string, value: any) => Promise<{ error: any }>;
      };
    };
  };
} 