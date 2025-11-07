/**
 * Debounce utility for API calls and input handlers
 * Prevents excessive API calls during typing
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {Object} options - Options object
 * @param {boolean} options.leading - Invoke on the leading edge of the timeout
 * @param {boolean} options.trailing - Invoke on the trailing edge of the timeout
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300, options = {}) {
  const { leading = false, trailing = true } = options;
  let timeout;
  let result;

  return function debounced(...args) {
    const context = this;
    const later = () => {
      timeout = null;
      if (trailing) {
        result = func.apply(context, args);
      }
    };

    const callNow = leading && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) {
      result = func.apply(context, args);
    }

    return result;
  };
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds
 * @param {Function} func - The function to throttle
 * @param {number} wait - The number of milliseconds to throttle
 * @returns {Function} Throttled function
 */
export function throttle(func, wait = 300) {
  let timeout;
  let previous = 0;

  return function throttled(...args) {
    const context = this;
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      return func.apply(context, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(context, args);
      }, remaining);
    }
  };
}

export default debounce;
