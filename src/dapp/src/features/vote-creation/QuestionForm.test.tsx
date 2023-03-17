import { Fields, formSchema } from "./Questions";

describe("QuestionForm", () => {
  it("should validate when all fields are filled", () => {
    const values: Fields = {
      answers: ["one", "two"],
      questionTitle: "title",
    };
    expect(() => {
      formSchema.parse(values);
    }).not.toThrow();
  });
  it("should not allow empty answer", () => {
    const values: Fields = {
      answers: ["one", "two", ""],
      questionTitle: "title",
    };
    expect(() => {
      formSchema.parse(values);
    }).toThrow();
  });
});
