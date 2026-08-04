jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = jest.requireActual('react-native');

  return {
    __esModule: true,
    default: (props) => React.createElement(View, props),
  };
});

require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-reorderable-list', () => {
  const React = require('react');
  const { View } = jest.requireActual('react-native');

  function renderComponent(component) {
    if (React.isValidElement(component) || component == null) {
      return component;
    }

    return React.createElement(component);
  }

  function ReorderableListMock({
    data,
    renderItem,
    keyExtractor,
    ListHeaderComponent,
    ListFooterComponent,
    accessibilityLabel,
    style,
  }) {
    return React.createElement(
      View,
      { accessibilityLabel, style },
      renderComponent(ListHeaderComponent),
      ...data.map((item, index) =>
        React.createElement(
          React.Fragment,
          { key: keyExtractor(item, index) },
          renderItem({ item, index }),
        ),
      ),
      renderComponent(ListFooterComponent),
    );
  }

  return {
    __esModule: true,
    default: ReorderableListMock,
    reorderItems(data, from, to) {
      const reordered = [...data];
      reordered.splice(to, 0, reordered.splice(from, 1)[0]);
      return reordered;
    },
    useReorderableDrag: () => jest.fn(),
  };
});
