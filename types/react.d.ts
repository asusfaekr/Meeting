import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react' {
  export interface ChangeEvent<T = Element> {
    target: EventTarget & T;
  }
  
  export interface FormEvent<T = Element> {
    preventDefault(): void;
  }
  
  export interface FC<P = {}> {
    (props: P): JSX.Element | null;
  }
} 