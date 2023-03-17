import { DateFormItem, DateTimeFormItemProps } from "../components/date-time-form-item/DateTimeFormItem";
import { FileFormItem, FileFormItemProps } from "../components/file-form-item/FileFormItem";
import { TextArrayFormItem, TextArrayFormItemProps } from "../components/text-array-form-item/TextArrayFormItem";
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

  textFields(props: TextArrayFormItemProps<TSchema>) {
    return <TextArrayFormItem {...this.prefixFieldProp(props)} />;
  }

  textareaField(props: TextareaFormItemProps<TSchema>) {
    return <TextareaFormItem {...this.prefixFieldProp(props)} />;
  }

  dateTimeField(props: DateTimeFormItemProps<TSchema>) {
    return <DateFormItem {...this.prefixFieldProp(props)} />;
  }

  fileField(props: FileFormItemProps<TSchema>) {
    return <FileFormItem {...this.prefixFieldProp(props)} />;
  }
}
