import type { TextFormItemProps } from "../components/text-form-item/TextFormItem";
import { TextFormItem } from "../components/text-form-item/TextFormItem";
import type { TextareaFormItemProps } from "../components/textarea-form-item/TextareaFormItem";
import { TextareaFormItem } from "../components/textarea-form-item/TextareaFormItem";

export class FormFieldHelper<TSchema extends Record<string, any>> {
  private readonly fieldPrefix: string;

  constructor({ fieldPrefix }: { fieldPrefix?: string } = {}) {
    this.fieldPrefix = fieldPrefix ? `${fieldPrefix}.` : "";
  }

  private prefixFieldProp<T extends { field: string & keyof TSchema }>(props: T) {
    return {
      ...props,
      field: `${this.fieldPrefix}${props.field}`,
    };
  }

  textField(props: TextFormItemProps<TSchema>) {
    return <TextFormItem {...this.prefixFieldProp(props)} />;
  }

  textareaField(props: TextareaFormItemProps<TSchema>) {
    return <TextareaFormItem {...this.prefixFieldProp(props)} />;
  }
}
