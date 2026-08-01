interface FiberLike {
  readonly memoizedProps: unknown;
  readonly return: FiberLike | null;
}

export interface RenderedElement {
  readonly unstable_fiber: FiberLike | null;
}

type PropBag = Record<string, unknown>;

function ancestorProps(element: RenderedElement, matches: (props: PropBag) => boolean): PropBag[] {
  const found: PropBag[] = [];

  for (let fiber = element.unstable_fiber; fiber !== null; fiber = fiber.return) {
    const props = fiber.memoizedProps;

    if (props !== null && typeof props === 'object' && matches(props as PropBag)) {
      found.push(props as PropBag);
    }
  }

  return found;
}

function requireOne(found: PropBag[], index: number, description: string): PropBag {
  const props = found[index];

  if (props === undefined) {
    throw new Error(`No ${description} was rendered above the element queried`);
  }

  return props;
}

export function nearestCompositeProps<T>(
  element: RenderedElement,
  matches: (props: PropBag) => boolean,
  description: string,
): T {
  return requireOne(ancestorProps(element, matches), 0, description) as T;
}

export function outermostCompositeProps<T>(
  element: RenderedElement,
  matches: (props: PropBag) => boolean,
  description: string,
): T {
  const found = ancestorProps(element, matches);

  return requireOne(found, found.length - 1, description) as T;
}
