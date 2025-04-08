declare module '@supabase/auth-helpers-nextjs' {
  export function createClientComponentClient(): {
    auth: {
      getSession: () => Promise<{ data: { session: any } }>;
      getUser: () => Promise<{ data: { user: any } }>;
    };
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: any) => {
          order: (column: string, options: { ascending: boolean }) => Promise<{ data: any[]; error: any }>;
          single: () => Promise<{ data: any; error: any }>;
        };
        gte: (column: string, value: any) => {
          lte: (column: string, value: any) => Promise<{ data: any[]; error: any }>;
        };
      };
      delete: () => {
        eq: (column: string, value: any) => Promise<{ error: any }>;
      };
      update: (data: any) => {
        eq: (column: string, value: any) => Promise<{ error: any }>;
      };
      insert: (data: any) => Promise<{ error: any }>;
    };
  };
} 