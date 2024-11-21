type ClassValue = string | number | boolean | undefined | null;
type ClassArray = ClassValue[];
type ClassObject = { [key: string]: any };
type ClassInput = ClassValue | ClassArray | ClassObject;

/**
 * Combines multiple class names into a single string.
 * Filters out falsy values and joins the remaining ones with a space.
 */
export function cn(...inputs: ClassInput[]): string {
  return inputs
    .flat()
    .filter(Boolean)
    .map((input) => {
      if (typeof input === 'string') return input;
      if (typeof input === 'object') {
        return Object.entries(input)
          .filter(([_, value]) => Boolean(value))
          .map(([key]) => key)
          .join(' ');
      }
      return String(input);
    })
    .join(' ');
}
