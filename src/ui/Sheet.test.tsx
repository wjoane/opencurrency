import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ThemeProvider } from '../theme/ThemeContext';

import { Sheet } from './Sheet';

const TITLE = 'Add a currency';
const CLOSE_LABEL = 'Close';
const BODY = 'sheet body';

interface RenderOptions {
  readonly visible?: boolean;
  readonly onClose?: () => void;
}

async function renderSheet({ visible = true, onClose = jest.fn() }: RenderOptions = {}) {
  await render(
    <ThemeProvider>
      <Sheet visible={visible} onClose={onClose} title={TITLE} closeLabel={CLOSE_LABEL}>
        <Text>{BODY}</Text>
      </Sheet>
    </ThemeProvider>,
  );

  return { onClose };
}

describe('Sheet', () => {
  it('renders nothing while it is not visible', async () => {
    await renderSheet({ visible: false });

    expect(screen.queryByText(TITLE)).toBeNull();
    expect(screen.queryByText(BODY)).toBeNull();
    expect(screen.queryByLabelText(CLOSE_LABEL)).toBeNull();
  });

  it('renders its title and its children while it is visible', async () => {
    await renderSheet();

    expect(screen.getByText(BODY)).toBeOnTheScreen();
  });

  it('exposes the title as a header', async () => {
    await renderSheet();

    expect(screen.getByRole('header', { name: TITLE })).toBeOnTheScreen();
  });

  it('closes from the close control', async () => {
    const { onClose } = await renderSheet();

    await fireEvent.press(screen.getByLabelText(CLOSE_LABEL));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('offers a screen reader exactly one close control', async () => {
    await renderSheet();

    expect(screen.getAllByLabelText(CLOSE_LABEL)).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: CLOSE_LABEL })).toHaveLength(1);
  });
});
