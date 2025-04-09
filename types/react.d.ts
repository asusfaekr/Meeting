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
  
  export interface HTMLInputElement extends HTMLElement {
    value: string;
  }
  
  export interface HTMLTextAreaElement extends HTMLElement {
    value: string;
  }
  
  export interface EventTarget {
    value: string;
  }
  
  export interface Element {
    value: string;
  }
  
  export interface HTMLElement {
    value: string;
  }
  
  export namespace React {
    interface ChangeEvent<T = Element> {
      target: EventTarget & T;
    }
    
    interface FormEvent<T = Element> {
      preventDefault(): void;
    }
  }
}