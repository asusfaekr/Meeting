declare module 'lucide-react' {
  import { FC, SVGProps } from 'react'
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string
    color?: string
    strokeWidth?: number | string
  }
  
  export const Calendar: FC<IconProps>
  export const Clock: FC<IconProps>
  export const Users: FC<IconProps>
  export const Check: FC<IconProps>
  export const X: FC<IconProps>
  export const AlertCircle: FC<IconProps>
} 