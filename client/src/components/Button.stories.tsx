import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Example/Button",
  component: () => <button type="button">Click me</button>,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
