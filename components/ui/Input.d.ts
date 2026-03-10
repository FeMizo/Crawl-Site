type InputProps = {
  label?: string;
  hint?: string;
  className?: string;
  inputClassName?: string;
  type?: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (event: { target: { value: string } }) => void;
};

export default function Input(props: InputProps): JSX.Element;
