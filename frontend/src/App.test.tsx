import React from "react";
import App from "./App";
import { mount } from "enzyme";

test("written name stays on send", () => {
  const app = mount(<App />);

  app
    .find("input")
    .find({ placeholder: "Name" })
    .simulate("change", { target: { value: "My Name" } });

  expect(
    app.find("input").find({ placeholder: "Name" }).get(0).props.value
  ).toBe("My Name");

  app.find("form").find("button").find({ type: "submit" }).simulate("click");
  expect(
    app.find("input").find({ placeholder: "Name" }).get(0).props.value
  ).toBe("My Name");
});

test("written text goes away on send", () => {
  const app = mount(<App />);

  app.find("textarea").simulate("change", { target: { value: "Text" } });

  expect(app.find("textarea").get(0).props.value).toBe("Text");

  app.find("form").simulate("submit");
  expect(app.find("textarea").get(0).props.value).toBe("");
});
