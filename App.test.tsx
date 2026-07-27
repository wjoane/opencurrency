import { render, screen } from '@testing-library/react-native';

import App from './App';

describe('App', () => {
  // Note: `render` is async in @testing-library/react-native v14+ (React 19
  // made `act` async). It must be awaited, or every query will be undefined.
  it('renders the placeholder screen', async () => {
    await render(<App />);

    expect(screen.getByText(/Open up App.tsx/)).toBeOnTheScreen();
  });
});
