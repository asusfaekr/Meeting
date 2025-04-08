import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react' {
  interface ChangeEvent<T = Element> {
    target: EventTarget & T;
  }
} 