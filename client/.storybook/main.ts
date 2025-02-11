import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'], // Add this line!
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
