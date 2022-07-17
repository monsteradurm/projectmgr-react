import React from 'react';


export function useString(initial) {
  const [value, setState] = React.useState(initial);

  const onChange = React.useCallback(
    (event) => {
      if ('value' in event.target)
        setState(event.target['value'].toString());
    },
    []
  );

  const Set = React.useCallback(
    (newValue) => setState(newValue.toString()),
    []
  );

  const Reset = React.useCallback(
    () => setState(initialValue.toString()),
    []
  );

  return {
    value,
    onChange,
    Set,
    Reset
  };
}

export default useString;