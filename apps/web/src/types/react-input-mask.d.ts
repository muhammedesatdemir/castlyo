declare module 'react-input-mask' {
  import { ComponentType, InputHTMLAttributes } from 'react';
  
  interface InputMaskProps extends InputHTMLAttributes<HTMLInputElement> {
    mask: string;
    maskChar?: string;
    alwaysShowMask?: boolean;
    beforeMaskedStateChange?: (state: any) => any;
  }
  
  const InputMask: ComponentType<InputMaskProps>;
  export default InputMask;
}
